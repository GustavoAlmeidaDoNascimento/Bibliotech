import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  DashboardSnapshot,
  SnapshotLoan,
  SnapshotStudent,
  SnapshotBook,
  DateFilter,
  FilteredDashboardData
} from '../types/dashboardSnapshot';
import { startOfYear, endOfYear, isWithinInterval } from 'date-fns';

class DashboardSnapshotService {
  /**
   * Cria snapshot do dashboard para um ano letivo
   */
  async createSnapshot(userId: string, year: string): Promise<DashboardSnapshot> {
    try {
      console.log(`📸 Criando snapshot do dashboard para ${year}...`);
      
      // Buscar todos os dados do ano
      const students = await this.fetchStudents(userId);
      const loans = await this.fetchLoans(userId);
      const books = await this.fetchBooks(userId);
      
      // Filtrar dados do ano específico
      const yearStart = startOfYear(new Date(`${year}-01-01`));
      const yearEnd = endOfYear(new Date(`${year}-12-31`));
      
      const yearLoans = loans.filter(loan => {
        const loanDate = new Date(loan.borrowDate);
        return isWithinInterval(loanDate, { start: yearStart, end: yearEnd });
      });
      
      // Calcular métricas
      const metrics = this.calculateMetrics(yearLoans, students);
      
      // Gerar dados para gráficos
      const charts = this.generateCharts(yearLoans, students, books);
      
      // Gerar rankings
      const rankings = this.generateRankings(yearLoans, students, books);
      
      // Preparar dados brutos para filtros futuros
      const rawData = {
        loans: yearLoans.map(loan => this.mapLoanToSnapshot(loan)),
        students: students.map(student => this.mapStudentToSnapshot(student, yearLoans)),
        books: books.map(book => this.mapBookToSnapshot(book, yearLoans))
      };
      
      const snapshot: DashboardSnapshot = {
        id: year,
        year,
        userId,
        createdAt: new Date(),
        metrics,
        charts,
        rankings,
        rawData
      };
      
      // Limpar campos undefined (Firestore não aceita undefined)
      const cleanSnapshot = this.removeUndefinedFields({
        ...snapshot,
        createdAt: serverTimestamp()
      });
      
      // Salvar no Firestore
      const snapshotRef = doc(db, `users/${userId}/dashboardSnapshots/${year}`);
      await setDoc(snapshotRef, cleanSnapshot);
      
      console.log(`✅ Snapshot criado com sucesso para ${year}`);
      return snapshot;
      
    } catch (error) {
      console.error('Erro ao criar snapshot:', error);
      throw error;
    }
  }
  
  /**
   * Busca snapshot de um ano específico
   */
  async getSnapshot(userId: string, year: string): Promise<DashboardSnapshot | null> {
    try {
      const snapshotRef = doc(db, `users/${userId}/dashboardSnapshots/${year}`);
      const snapshot = await getDoc(snapshotRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return this.mapDocToSnapshot(snapshot);
    } catch (error) {
      console.error('Erro ao buscar snapshot:', error);
      return null;
    }
  }
  
  /**
   * Filtra dados do snapshot por intervalo de datas
   */
  filterSnapshotByDateRange(
    snapshot: DashboardSnapshot,
    dateFilter: DateFilter
  ): FilteredDashboardData {
    const { startDate, endDate } = dateFilter;
    
    // Filtrar empréstimos por data
    const filteredLoans = snapshot.rawData.loans.filter(loan => {
      const loanDate = new Date(loan.borrowDate);
      return isWithinInterval(loanDate, { start: startDate, end: endDate });
    });
    
    // Recalcular métricas
    const metrics = this.calculateMetricsFromSnapshot(filteredLoans, snapshot.rawData.students);
    
    // Regenerar gráficos
    const charts = this.generateChartsFromSnapshot(
      filteredLoans,
      snapshot.rawData.students,
      snapshot.rawData.books
    );
    
    // Regenerar rankings
    const rankings = this.generateRankingsFromSnapshot(
      filteredLoans,
      snapshot.rawData.students,
      snapshot.rawData.books
    );
    
    return { metrics, charts, rankings };
  }
  
  /**
   * Busca todos os snapshots disponíveis
   */
  async getAllSnapshots(userId: string): Promise<DashboardSnapshot[]> {
    try {
      const snapshotsRef = collection(db, `users/${userId}/dashboardSnapshots`);
      const q = query(snapshotsRef, orderBy('year', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => this.mapDocToSnapshot(doc));
    } catch (error) {
      console.error('Erro ao buscar snapshots:', error);
      return [];
    }
  }
  
  // ========== MÉTODOS PRIVADOS ==========
  
  private async fetchStudents(userId: string): Promise<any[]> {
    const studentsRef = collection(db, `users/${userId}/students`);
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  private async fetchLoans(userId: string): Promise<any[]> {
    const loansRef = collection(db, `users/${userId}/loans`);
    const snapshot = await getDocs(loansRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  private async fetchBooks(userId: string): Promise<any[]> {
    const booksRef = collection(db, `users/${userId}/books`);
    const snapshot = await getDocs(booksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  private calculateMetrics(loans: any[], students: any[]): DashboardSnapshot['metrics'] {
    const activeLoans = loans.filter(l => l.status === 'active');
    const completedLoans = loans.filter(l => l.status === 'returned' && l.completed);
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    
    const totalProgress = loans
      .filter(l => l.status === 'returned')
      .reduce((sum, l) => sum + (l.readingProgress || 0), 0);
    const returnedCount = loans.filter(l => l.status === 'returned').length;
    
    return {
      totalBooks: 0, // Será preenchido depois
      totalStudents: students.length,
      totalActiveLoans: activeLoans.length,
      totalCompletedLoans: completedLoans.length,
      totalOverdueLoans: overdueLoans.length,
      averageReadingProgress: returnedCount > 0 ? totalProgress / returnedCount : 0
    };
  }
  
  private calculateMetricsFromSnapshot(loans: SnapshotLoan[], students: SnapshotStudent[]): DashboardSnapshot['metrics'] {
    const activeLoans = loans.filter(l => l.status === 'active');
    const completedLoans = loans.filter(l => l.status === 'returned' && l.completed);
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    
    const totalProgress = loans
      .filter(l => l.status === 'returned')
      .reduce((sum, l) => sum + l.readingProgress, 0);
    const returnedCount = loans.filter(l => l.status === 'returned').length;
    
    return {
      totalBooks: 0,
      totalStudents: students.length,
      totalActiveLoans: activeLoans.length,
      totalCompletedLoans: completedLoans.length,
      totalOverdueLoans: overdueLoans.length,
      averageReadingProgress: returnedCount > 0 ? totalProgress / returnedCount : 0
    };
  }
  
  private generateCharts(loans: any[], students: any[], books: any[]): DashboardSnapshot['charts'] {
    // Implementar lógica de geração de gráficos
    // Por enquanto retornar estrutura vazia
    return {
      monthlyLoans: [],
      loansByCategory: [],
      loansByLevel: [],
      monthlyNewReaders: []
    };
  }
  
  private generateChartsFromSnapshot(loans: SnapshotLoan[], students: SnapshotStudent[], books: SnapshotBook[]): DashboardSnapshot['charts'] {
    // Implementar lógica similar ao generateCharts mas com tipos snapshot
    return {
      monthlyLoans: [],
      loansByCategory: [],
      loansByLevel: [],
      monthlyNewReaders: []
    };
  }
  
  private generateRankings(loans: any[], students: any[], books: any[]): DashboardSnapshot['rankings'] {
    // Implementar lógica de rankings
    return {
      topBooks: [],
      topStudents: [],
      topClasses: [],
      topGenres: []
    };
  }
  
  private generateRankingsFromSnapshot(loans: SnapshotLoan[], students: SnapshotStudent[], books: SnapshotBook[]): DashboardSnapshot['rankings'] {
    return {
      topBooks: [],
      topStudents: [],
      topClasses: [],
      topGenres: []
    };
  }
  
  /**
   * Remove recursivamente campos undefined de um objeto
   * (Firestore não aceita undefined)
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }
    
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.removeUndefinedFields(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
  
  private mapLoanToSnapshot(loan: any): SnapshotLoan {
    return {
      id: loan.id,
      bookId: loan.bookId,
      bookTitle: loan.bookTitle || '',
      studentId: loan.studentId,
      studentName: loan.studentName || '',
      studentClass: loan.studentClass || '',
      borrowDate: loan.borrowDate?.toISOString() || new Date().toISOString(),
      returnDate: loan.returnDate?.toISOString(),
      dueDate: loan.dueDate?.toISOString() || new Date().toISOString(),
      status: loan.status,
      completed: loan.completed || false,
      readingProgress: loan.readingProgress || 0,
      genres: loan.genres || []
    };
  }
  
  private mapStudentToSnapshot(student: any, loans: any[]): SnapshotStudent {
    const studentLoans = loans.filter(l => l.studentId === student.id);
    const completedLoans = studentLoans.filter(l => l.status === 'returned' && l.completed);
    
    // Calcular pontos
    let points = 0;
    studentLoans.forEach(loan => {
      if (loan.status === 'returned') {
        if (loan.completed) {
          points += 1;
        } else {
          points += (loan.readingProgress || 0) / 100;
        }
      }
    });
    
    return {
      id: student.id,
      name: student.name,
      classroom: student.classroom,
      shift: student.shift,
      educationalLevelId: student.educationalLevelId || '',
      totalLoans: studentLoans.length,
      completedLoans: completedLoans.length,
      points
    };
  }
  
  private mapBookToSnapshot(book: any, loans: any[]): SnapshotBook {
    const bookLoans = loans.filter(l => l.bookId === book.id);
    
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genres: book.genres || [],
      coverUrl: book.coverUrl,
      totalLoans: bookLoans.length
    };
  }
  
  private mapDocToSnapshot(doc: any): DashboardSnapshot {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date()
    } as DashboardSnapshot;
  }
}

export const dashboardSnapshotService = new DashboardSnapshotService();

