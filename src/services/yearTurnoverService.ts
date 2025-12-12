import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import {
  YearTurnoverConfig,
  YearTurnoverHistory,
  TurnoverStatistics,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StudentAction,
  ClassGroup
} from '../types/yearTurnover';
import { academicYearService } from './academicYearService';
import { dashboardSnapshotService } from './dashboardSnapshotService';
import { globalCacheService } from './globalCacheService';

class YearTurnoverService {
  /**
   * Busca todos os alunos ativos
   */
  async getAllActiveStudents(userId: string): Promise<any[]> {
    try {
      const studentsRef = collection(db, `users/${userId}/students`);
      const snapshot = await getDocs(studentsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      return [];
    }
  }
  
  /**
   * Busca todas as turmas ativas (extraídas dos alunos)
   */
  async getAllActiveClasses(userId: string): Promise<ClassGroup[]> {
    try {
      const students = await this.getAllActiveStudents(userId);
      
      // Agrupar alunos por turma
      const classesMap = new Map<string, any[]>();
      
      students.forEach(student => {
        const key = `${student.classroom}_${student.shift}`;
        if (!classesMap.has(key)) {
          classesMap.set(key, []);
        }
        classesMap.get(key)!.push(student);
      });
      
      // Converter para ClassGroup
      const classes: ClassGroup[] = [];
      classesMap.forEach((students, key) => {
        if (students.length > 0) {
          const first = students[0];
          classes.push({
            className: first.classroom,
            shift: first.shift,
            levelId: first.educationalLevelId || '',
            levelName: '', // Será preenchido depois
            students: students.map(s => this.mapStudentToAction(s))
          });
        }
      });
      
      return classes;
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      return [];
    }
  }
  
  /**
   * Busca empréstimos ativos
   */
  async getActiveLoans(userId: string): Promise<any[]> {
    try {
      const loansRef = collection(db, `users/${userId}/loans`);
      const q = query(loansRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao buscar empréstimos ativos:', error);
      return [];
    }
  }
  
  /**
   * Valida se a virada pode ser executada
   */
  async validateTurnover(
    userId: string,
    config: YearTurnoverConfig
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // 1. Verificar se há ano ativo
      const activeYear = await academicYearService.getActiveYear(userId);
      if (!activeYear) {
        errors.push({
          type: 'missing_level',
          message: 'Não há ano letivo ativo no sistema',
          affectedItems: []
        });
      }
      
      // 2. Verificar se novo ano já existe
      const existingYear = await academicYearService.getYearById(userId, config.toYear);
      if (existingYear) {
        errors.push({
          type: 'duplicate_mapping',
          message: `Ano letivo ${config.toYear} já existe no sistema`,
          affectedItems: [config.toYear]
        });
      }
      
      // 3. Verificar se há turmas criadas para o novo ano
      if (!config.newClasses || config.newClasses.length === 0) {
        errors.push({
          type: 'no_mapping',
          message: 'Nenhuma turma foi criada para o próximo ano letivo',
          affectedItems: []
        });
      }
      
      // 4. Verificar se todos os alunos têm ação definida
      const allStudents = await this.getAllActiveStudents(userId);
      const studentsWithoutAction = config.studentActions.filter(action => !action.action);
      
      if (studentsWithoutAction.length > 0) {
        errors.push({
          type: 'no_action',
          message: `${studentsWithoutAction.length} aluno(s) sem ação definida`,
          affectedItems: studentsWithoutAction.map(s => s.studentName)
        });
      }
      
      // 5. Verificar se todas as turmas antigas têm nível educacional
      const allClasses = await this.getAllActiveClasses(userId);
      const classesWithoutLevel = allClasses.filter(cls => !cls.levelId);
      if (classesWithoutLevel.length > 0) {
        errors.push({
          type: 'missing_level',
          message: 'Todas as turmas devem ter um nível educacional definido antes da virada',
          affectedItems: classesWithoutLevel.map(c => `${c.className} (${c.shift})`)
        });
      }
      
      // 6. Avisos sobre empréstimos ativos
      const studentsWithLoans = config.studentActions.filter(
        action => (action.action === 'transfer' || action.action === 'graduate') && action.hasActiveLoans
      );
      
      if (studentsWithLoans.length > 0) {
        warnings.push({
          type: 'active_loans',
          message: `${studentsWithLoans.length} aluno(s) transferido(s)/graduado(s) possui(em) empréstimos ativos`,
          affectedItems: studentsWithLoans.map(s => s.studentName)
        });
      }
      
      // 7. Avisar sobre turmas grandes
      const largeClasses = allClasses.filter(cls => cls.students.length > 40);
      if (largeClasses.length > 0) {
        warnings.push({
          type: 'large_class',
          message: `${largeClasses.length} turma(s) com mais de 40 alunos`,
          affectedItems: largeClasses.map(c => `${c.className} (${c.students.length} alunos)`)
        });
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      console.error('Erro na validação:', error);
      errors.push({
        type: 'invalid_target',
        message: 'Erro ao validar dados da virada',
        affectedItems: []
      });
      
      return { valid: false, errors, warnings };
    }
  }
  
  /**
   * Executa a virada de ano
   */
  async executeTurnover(
    userId: string,
    config: YearTurnoverConfig
  ): Promise<{
    success: boolean;
    statistics: TurnoverStatistics;
    historyId?: string;
    error?: string;
  }> {
    try {
      console.log('🔄 Iniciando virada de ano...');
      
      // 1. Validar antes de executar
      const validation = await this.validateTurnover(userId, config);
      if (!validation.valid) {
        return {
          success: false,
          statistics: this.getEmptyStatistics(),
          error: validation.errors.map(e => e.message).join('; ')
        };
      }
      
      // 2. Criar snapshot do dashboard ANTES de qualquer mudança
      console.log('📸 Criando snapshot do dashboard...');
      await dashboardSnapshotService.createSnapshot(userId, config.fromYear);
      
      // 3. Criar histórico da virada
      const historyId = await this.createTurnoverHistory(userId, config);
      
      // 4. Inicializar estatísticas
      const statistics = this.getEmptyStatistics();
      statistics.totalStudents = config.studentActions.length;
      
      // 5. Executar em batches (Firestore permite até 500 operações por batch)
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      const BATCH_LIMIT = 450; // Margem de segurança
      
      // 6. Criar novo ano letivo
      console.log(`📅 Criando ano letivo ${config.toYear}...`);
      const newYearRef = doc(db, `users/${userId}/academicYears/${config.toYear}`);
      currentBatch.set(newYearRef, {
        year: config.toYear,
        startDate: Timestamp.fromDate(new Date(`${config.toYear}-01-01`)),
        endDate: Timestamp.fromDate(new Date(`${config.toYear}-12-31`)),
        status: 'active',
        userId,
        createdAt: serverTimestamp()
      });
      operationCount++;
      
      // 7. Arquivar ano anterior
      console.log(`📦 Arquivando ano letivo ${config.fromYear}...`);
      const oldYearRef = doc(db, `users/${userId}/academicYears/${config.fromYear}`);
      currentBatch.update(oldYearRef, {
        status: 'archived',
        archivedAt: serverTimestamp()
      });
      operationCount++;
      
      // 8. Processar ações de alunos
      console.log('👥 Processando alunos...');
      
      for (const action of config.studentActions) {
        if (operationCount >= BATCH_LIMIT) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
        
        const studentRef = doc(db, `users/${userId}/students/${action.studentId}`);
        
        switch (action.action) {
          case 'promote':
            // Promover aluno para próxima turma
            currentBatch.update(studentRef, {
              classroom: action.toClass,
              shift: action.toShift,
              educationalLevelId: action.toLevelId,
              updatedAt: serverTimestamp()
            });
            statistics.promoted++;
            break;
            
          case 'retain':
            // Aluno repete a turma (não muda nada, apenas continua)
            currentBatch.update(studentRef, {
              updatedAt: serverTimestamp()
            });
            statistics.retained++;
            break;
            
          case 'transfer':
          case 'graduate':
            // Deletar aluno (transferido ou graduado)
            // Nota: Empréstimos ativos continuam, mas ficam "anônimos"
            currentBatch.delete(studentRef);
            statistics.studentsDeleted++;
            
            if (action.action === 'transfer') {
              statistics.transferred++;
            } else {
              statistics.graduated++;
            }
            
            // Contar empréstimos ativos que ficarão órfãos
            if (action.hasActiveLoans) {
              statistics.activeLoansKept += action.activeLoansCount;
            }
            break;
        }
        
        operationCount++;
      }
      
      // 9. Criar novos registros de turmas (se necessário)
      console.log('🏫 Criando turmas...');
      const newClasses = this.extractNewClasses(config);
      
      for (const newClass of newClasses) {
        if (operationCount >= BATCH_LIMIT) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
        
        const classId = `${newClass.name}_${newClass.shift}_${config.toYear}`
          .replace(/[^a-zA-Z0-9]/g, '_');
        const classRef = doc(db, `users/${userId}/classes/${classId}`);
        
        currentBatch.set(classRef, {
          name: newClass.name,
          shift: newClass.shift,
          educationalLevelId: newClass.levelId,
          userId,
          createdAt: serverTimestamp()
        });
        
        statistics.classesCreated++;
        operationCount++;
      }
      
      // 10. Adicionar último batch
      batches.push(currentBatch);
      
      // 11. Executar todos os batches
      console.log(`💾 Executando ${batches.length} batch(es)...`);
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        console.log(`✅ Batch ${i + 1}/${batches.length} concluído`);
      }
      
      // 12. Atualizar histórico com estatísticas
      await this.updateTurnoverHistory(userId, historyId, {
        status: 'completed',
        statistics
      });
      
      // 13. Invalidar todos os caches
      console.log('🧹 Limpando caches...');
      await this.invalidateAllCaches();
      
      console.log('✨ Virada de ano concluída com sucesso!');
      
      return {
        success: true,
        statistics,
        historyId
      };
      
    } catch (error) {
      console.error('❌ Erro ao executar virada de ano:', error);
      
      return {
        success: false,
        statistics: this.getEmptyStatistics(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Busca histórico de viradas
   */
  async getTurnoverHistory(userId: string): Promise<YearTurnoverHistory[]> {
    try {
      const historyRef = collection(db, `users/${userId}/yearTurnoverHistory`);
      const snapshot = await getDocs(historyRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        executedAt: doc.data().executedAt?.toDate() || new Date()
      } as YearTurnoverHistory));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }
  
  /**
   * Conta empréstimos ativos de um aluno
   */
  async countActiveLoans(userId: string, studentId: string): Promise<number> {
    try {
      const loansRef = collection(db, `users/${userId}/loans`);
      const q = query(
        loansRef,
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao contar empréstimos:', error);
      return 0;
    }
  }
  
  // ========== MÉTODOS PRIVADOS ==========
  
  private async createTurnoverHistory(
    userId: string,
    config: YearTurnoverConfig
  ): Promise<string> {
    const historyRef = doc(collection(db, `users/${userId}/yearTurnoverHistory`));
    
    await setDoc(historyRef, {
      fromYear: config.fromYear,
      toYear: config.toYear,
      executedAt: serverTimestamp(),
      executedBy: userId,
      status: 'in_progress',
      statistics: this.getEmptyStatistics(),
      userId
    });
    
    return historyRef.id;
  }
  
  private async updateTurnoverHistory(
    userId: string,
    historyId: string,
    updates: { status: string; statistics: TurnoverStatistics }
  ): Promise<void> {
    const historyRef = doc(db, `users/${userId}/yearTurnoverHistory/${historyId}`);
    await setDoc(historyRef, updates, { merge: true });
  }
  
  private extractNewClasses(config: YearTurnoverConfig): Array<{
    name: string;
    shift: string;
    levelId: string;
  }> {
    // Se as novas turmas foram criadas explicitamente no Step2, usar elas
    if (config.newClasses && config.newClasses.length > 0) {
      return config.newClasses.map(cls => ({
        name: cls.name,
        shift: cls.shift,
        levelId: cls.levelId
      }));
    }
    
    // Fallback: extrair das ações dos alunos (método antigo)
    const classesSet = new Set<string>();
    const classes: Array<{ name: string; shift: string; levelId: string }> = [];
    
    config.studentActions.forEach(action => {
      if ((action.action === 'promote' || action.action === 'retain') && action.toClass && action.toShift && action.toLevelId) {
        const key = `${action.toClass}_${action.toShift}`;
        if (!classesSet.has(key)) {
          classesSet.add(key);
          classes.push({
            name: action.toClass,
            shift: action.toShift,
            levelId: action.toLevelId
          });
        }
      }
    });
    
    return classes;
  }
  
  private mapStudentToAction(student: any): StudentAction {
    return {
      studentId: student.id,
      studentName: student.name,
      fromClass: student.classroom,
      fromShift: student.shift,
      action: 'promote', // Default
      hasActiveLoans: false,
      activeLoansCount: 0
    };
  }
  
  private getEmptyStatistics(): TurnoverStatistics {
    return {
      totalStudents: 0,
      promoted: 0,
      retained: 0,
      transferred: 0,
      graduated: 0,
      studentsDeleted: 0,
      classesCreated: 0,
      classesArchived: 0,
      activeLoansKept: 0
    };
  }
  
  private async invalidateAllCaches(): Promise<void> {
    try {
      // Limpar localStorage
      localStorage.clear();
      
      // Você pode adicionar mais lógicas de limpeza aqui
      console.log('✅ Caches invalidados');
    } catch (error) {
      console.error('Erro ao invalidar caches:', error);
    }
  }
}

export const yearTurnoverService = new YearTurnoverService();

