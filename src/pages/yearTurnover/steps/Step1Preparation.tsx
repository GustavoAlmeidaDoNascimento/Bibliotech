import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { useEducationalLevels } from '../../../contexts/EducationalLevelsContext';
import { yearTurnoverService } from '../../../services/yearTurnoverService';
import { academicYearService } from '../../../services/academicYearService';
import { LoadingSpinner } from '../../../components/ui';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import styles from './Steps.module.css';

const Step1Preparation: React.FC = () => {
  const { currentUser } = useAuth();
  const { levels } = useEducationalLevels();
  const {
    config,
    setConfig,
    setAllClasses,
    setAllStudents,
    goToNextStep,
    completeStep
  } = useYearTurnover();
  
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({
    hasActiveYear: false,
    hasLevels: false,
    hasStudents: false,
    allClassesHaveLevel: false,
    canProceed: false
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    activeLoans: 0,
    classesWithoutLevel: 0
  });
  
  useEffect(() => {
    if (currentUser) {
      loadPreparationData();
    }
  }, [currentUser]);
  
  const loadPreparationData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // 1. Verificar ano ativo (cria automaticamente se não existir)
      const activeYear = await academicYearService.ensureActiveYear(currentUser.uid);
      const hasActiveYear = !!activeYear;
      
      if (activeYear) {
        const nextYear = await academicYearService.getNextYear(activeYear.year);
        setConfig({
          fromYear: activeYear.year,
          toYear: nextYear
        });
      }
      
      // 2. Verificar níveis educacionais
      const hasLevels = levels.length > 0;
      
      // 3. Buscar alunos e turmas
      const students = await yearTurnoverService.getAllActiveStudents(currentUser.uid);
      const classes = await yearTurnoverService.getAllActiveClasses(currentUser.uid);
      
      // Adicionar informação de empréstimos ativos para cada aluno
      const studentsWithLoans = await Promise.all(
        students.map(async (student) => {
          const activeLoansCount = await yearTurnoverService.countActiveLoans(
            currentUser.uid,
            student.id
          );
          return {
            studentId: student.id,
            studentName: student.name,
            fromClass: student.classroom,
            fromShift: student.shift,
            action: 'promote' as const,
            hasActiveLoans: activeLoansCount > 0,
            activeLoansCount
          };
        })
      );
      
      setAllStudents(studentsWithLoans);
      setAllClasses(classes);
      
      // 4. Verificar se todas as turmas têm nível
      const classesWithoutLevel = classes.filter(c => !c.levelId);
      
      // 5. Buscar empréstimos ativos
      const activeLoans = await yearTurnoverService.getActiveLoans(currentUser.uid);
      
      // Atualizar estatísticas
      setStats({
        totalStudents: students.length,
        totalClasses: classes.length,
        activeLoans: activeLoans.length,
        classesWithoutLevel: classesWithoutLevel.length
      });
      
      // Verificações
      const canProceed = 
        hasActiveYear && 
        hasLevels && 
        students.length > 0 && 
        classesWithoutLevel.length === 0;
      
      setChecks({
        hasActiveYear,
        hasLevels,
        hasStudents: students.length > 0,
        allClassesHaveLevel: classesWithoutLevel.length === 0,
        canProceed
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados de preparação:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProceed = () => {
    if (checks.canProceed) {
      completeStep(1);
      goToNextStep();
    }
  };
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>Carregando dados do sistema...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Preparação e Validação</h2>
      <p className={styles.stepDescription}>
        Verificando se o sistema está pronto para a virada de ano
      </p>
      
      {/* Anos */}
      <div className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h3>Transição de Ano Letivo</h3>
        </div>
        <div className={styles.yearTransition}>
          <div className={styles.yearBox}>
            <span className={styles.yearLabel}>Ano Atual</span>
            <span className={styles.yearValue}>{config.fromYear}</span>
          </div>
          <div className={styles.arrow}>→</div>
          <div className={styles.yearBox}>
            <span className={styles.yearLabel}>Próximo Ano</span>
            <span className={styles.yearValue}>{config.toYear}</span>
          </div>
        </div>
      </div>
      
      {/* Verificações */}
      <div className={styles.checksContainer}>
        <h3 className={styles.sectionTitle}>Verificações do Sistema</h3>
        
        <div className={styles.checksList}>
          <CheckItem
            title="Ano Letivo Ativo"
            passed={checks.hasActiveYear}
            description={
              checks.hasActiveYear
                ? `Ano ${config.fromYear} está ativo`
                : 'Nenhum ano letivo ativo encontrado'
            }
          />
          
          <CheckItem
            title="Níveis Educacionais"
            passed={checks.hasLevels}
            description={
              checks.hasLevels
                ? `${levels.length} nível(is) cadastrado(s)`
                : 'Nenhum nível educacional cadastrado'
            }
          />
          
          <CheckItem
            title="Alunos Cadastrados"
            passed={checks.hasStudents}
            description={
              checks.hasStudents
                ? `${stats.totalStudents} aluno(s) encontrado(s)`
                : 'Nenhum aluno cadastrado'
            }
          />
          
          <CheckItem
            title="Turmas com Nível Educacional"
            passed={checks.allClassesHaveLevel}
            description={
              checks.allClassesHaveLevel
                ? `Todas as ${stats.totalClasses} turmas possuem nível`
                : `${stats.classesWithoutLevel} turma(s) sem nível educacional`
            }
            warning={!checks.allClassesHaveLevel}
          />
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className={styles.statsGrid}>
        <StatCard 
          label="Total de Alunos"
          value={stats.totalStudents}
          color="blue"
        />
        <StatCard 
          label="Total de Turmas"
          value={stats.totalClasses}
          color="purple"
        />
        <StatCard 
          label="Empréstimos Ativos"
          value={stats.activeLoans}
          color="green"
        />
      </div>
      
      {/* Avisos */}
      {!checks.canProceed && (
        <div className={styles.warningBox}>
          <ExclamationTriangleIcon className={styles.warningIcon} />
          <div>
            <strong>Atenção!</strong>
            <p>
              {!checks.hasActiveYear && 'Crie um ano letivo ativo antes de continuar. '}
              {!checks.hasLevels && 'Cadastre os níveis educacionais antes de continuar. '}
              {!checks.hasStudents && 'Cadastre alunos antes de continuar. '}
              {!checks.allClassesHaveLevel && 'Todas as turmas devem ter um nível educacional definido. '}
            </p>
          </div>
        </div>
      )}
      
      {/* Botão de ação */}
      <div className={styles.stepActions}>
        <button
          onClick={handleProceed}
          disabled={!checks.canProceed}
          className={styles.primaryButton}
        >
          Iniciar Virada de Ano
        </button>
      </div>
    </div>
  );
};

// Componentes auxiliares
const CheckItem: React.FC<{
  title: string;
  passed: boolean;
  description: string;
  warning?: boolean;
}> = ({ title, passed, description, warning }) => {
  const IconComponent = passed 
    ? CheckCircleIcon 
    : warning 
    ? ExclamationTriangleIcon 
    : XCircleIcon;
  
  const iconColor = passed 
    ? styles.successIcon 
    : warning 
    ? styles.warningIcon 
    : styles.errorIcon;
  
  return (
    <div className={styles.checkItem}>
      <IconComponent className={`${styles.checkIcon} ${iconColor}`} />
      <div className={styles.checkContent}>
        <strong className={styles.checkTitle}>{title}</strong>
        <p className={styles.checkDescription}>{description}</p>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green';
}> = ({ label, value, color }) => {
  const colorClass = styles[`stat${color.charAt(0).toUpperCase() + color.slice(1)}`];
  
  return (
    <div className={`${styles.statCard} ${colorClass}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
};

export default Step1Preparation;

