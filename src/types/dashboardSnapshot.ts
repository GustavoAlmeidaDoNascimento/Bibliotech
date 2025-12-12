export interface DashboardSnapshot {
  id: string;
  year: string; // "2024", "2025"
  userId: string;
  createdAt: Date;
  
  // Métricas gerais
  metrics: {
    totalBooks: number;
    totalStudents: number;
    totalActiveLoans: number;
    totalCompletedLoans: number;
    totalOverdueLoans: number;
    averageReadingProgress: number;
  };
  
  // Dados para gráficos
  charts: {
    // Empréstimos por mês
    monthlyLoans: Array<{
      month: string; // "Janeiro", "Fevereiro"
      monthNumber: number; // 1-12
      borrowed: number;
      returned: number;
      completed: number;
    }>;
    
    // Empréstimos por categoria
    loansByCategory: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    
    // Empréstimos por nível educacional
    loansByLevel: Array<{
      levelId: string;
      levelName: string;
      count: number;
    }>;
    
    // Evolução mensal de novos alunos leitores
    monthlyNewReaders: Array<{
      month: string;
      monthNumber: number;
      count: number;
    }>;
  };
  
  // Rankings
  rankings: {
    topBooks: Array<{
      bookId: string;
      title: string;
      author: string;
      totalLoans: number;
      coverUrl?: string;
    }>;
    
    topStudents: Array<{
      studentId: string;
      name: string;
      classroom: string;
      points: number; // Leituras completas + parciais
    }>;
    
    topClasses: Array<{
      className: string;
      shift: string;
      totalLoans: number;
      studentsCount: number;
      averagePerStudent: number;
    }>;
    
    topGenres: Array<{
      genre: string;
      count: number;
    }>;
  };
  
  // Dados brutos para filtros de data
  rawData: {
    loans: SnapshotLoan[];
    students: SnapshotStudent[];
    books: SnapshotBook[];
  };
}

export interface SnapshotLoan {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  borrowDate: string; // ISO date
  returnDate?: string; // ISO date
  dueDate: string; // ISO date
  status: 'active' | 'returned' | 'overdue';
  completed: boolean;
  readingProgress: number;
  genres?: string[];
}

export interface SnapshotStudent {
  id: string;
  name: string;
  classroom: string;
  shift: string;
  educationalLevelId: string;
  totalLoans: number;
  completedLoans: number;
  points: number;
}

export interface SnapshotBook {
  id: string;
  title: string;
  author: string;
  genres?: string[];
  coverUrl?: string;
  totalLoans: number;
}

export interface DateFilter {
  startDate: Date;
  endDate: Date;
}

export interface FilteredDashboardData {
  metrics: DashboardSnapshot['metrics'];
  charts: DashboardSnapshot['charts'];
  rankings: DashboardSnapshot['rankings'];
}

