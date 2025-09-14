import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardCache } from '../../hooks/useDashboardCache';
import { useCacheInvalidation } from '../../hooks/useCacheInvalidation';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import EmbeddedDateFilter from '../../components/ui/EmbeddedDateFilter';

import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { subMonths, startOfMonth, endOfMonth, format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './Dashboard.module.css';

// Registrando os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  onClick?: () => void;
  clickable?: boolean;
}

interface Student {
  id: string;
  name: string;
  classroom: string;
}

interface Loan {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  status: 'active' | 'returned';
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  createdAt: Date;
  completed?: boolean;
  readingProgress?: number;
}

interface Book {
  id: string;
  title: string;
  authors?: string[];
  genres?: string[];
  code: string;
  description?: string;
}

interface TopStudent {
  id: string;
  name: string;
  classroom: string;
  booksRead: number;
}

interface GenreData {
  genre: string;
  count: number;
}

interface TopBook {
  id: string;
  title: string;
  borrowCount: number;
}

interface ClassroomPerformance {
  classroom: string;
  booksRead: number;
  averageCompletion: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, onClick, clickable = false }) => (
  <div 
    className={`${styles.statCard} ${clickable ? styles.clickableCard : ''}`}
    onClick={onClick}
    style={{
      cursor: clickable ? 'pointer' : 'default',
      transition: clickable ? 'all 0.2s ease' : 'none'
    }}
    onMouseEnter={(e) => {
      if (clickable) {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }
    }}
    onMouseLeave={(e) => {
      if (clickable) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }
    }}
  >
    <h3>{title}</h3>
    <div className={styles.value}>{value}</div>
    <p>{description}</p>
    {clickable && (
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        fontSize: '12px',
        color: '#4a90e2',
        opacity: 0.7
      }}>
        ↗
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Cache management
  const cache = useDashboardCache(currentUser?.uid || '');
  const [initialLoading, setInitialLoading] = useState(!cache.hasCache);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  // Estados para filtros de data dos rankings
  const [studentRankingFilter, setStudentRankingFilter] = useState({
    active: false,
    startDate: '',
    endDate: '',
    loading: false
  });
  
  const [classroomRankingFilter, setClassroomRankingFilter] = useState({
    active: false,
    startDate: '',
    endDate: '',
    loading: false
  });
  
  // Estados para estatísticas principais
  const [activeLoansCount, setActiveLoansCount] = useState(cache.cachedData?.activeLoansCount || 0);
  const [overdueLoansCount, setOverdueLoansCount] = useState(cache.cachedData?.overdueLoansCount || 0);
  const [totalBooksCount, setTotalBooksCount] = useState(cache.cachedData?.totalBooksCount || 0);
  const [activeReadersCount, setActiveReadersCount] = useState(cache.cachedData?.activeReadersCount || 0);
  const [totalBooksRead, setTotalBooksRead] = useState<number>(cache.cachedData?.totalBooksRead || 0);
  const [totalReadersCount, setTotalReadersCount] = useState(cache.cachedData?.totalReadersCount || 0);
  
  // Estados para gráficos e insights
  const [genreData, setGenreData] = useState<GenreData[]>(cache.cachedData?.genreData || []);
  const [topBooks, setTopBooks] = useState<TopBook[]>(cache.cachedData?.topBooks || []);
  const [topStudents, setTopStudents] = useState<TopStudent[]>(cache.cachedData?.topStudents || []);
  const [classroomPerformance, setClassroomPerformance] = useState<ClassroomPerformance[]>(cache.cachedData?.classroomPerformance || []);
  const [monthlyLoanData, setMonthlyLoanData] = useState<{
    labels: string[],
    borrowed: number[],
    returned: number[]
  }>(cache.cachedData?.monthlyLoanData || {
    labels: [],
    borrowed: [],
    returned: []
  });
  const [completionRateData, setCompletionRateData] = useState<{labels: string[], rates: number[]}>
  (cache.cachedData?.completionRateData || {
    labels: [],
    rates: []
  });

  // Função para aplicar filtro no ranking de estudantes
  const applyStudentRankingFilter = useCallback(async (startDate: string, endDate: string) => {
    setStudentRankingFilter(prev => ({ ...prev, loading: true }));
    
    try {
      // Reprocessar apenas os dados dos estudantes com filtro
      const loansRef = collection(db, `users/${currentUser?.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : data.borrowDate,
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : data.returnDate,
        } as Loan;
      });

      const studentsRef = collection(db, `users/${currentUser?.uid}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      const filterStartDate = startOfDay(parseISO(startDate));
      const filterEndDate = endOfDay(parseISO(endDate));
      
      processTopStudents(loans, students, filterStartDate, filterEndDate);
      
      setStudentRankingFilter({
        active: true,
        startDate,
        endDate,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao aplicar filtro no ranking de estudantes:', error);
      setStudentRankingFilter(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser?.uid]);

  // Função para limpar filtro do ranking de estudantes
  const clearStudentRankingFilter = useCallback(async () => {
    setStudentRankingFilter(prev => ({ ...prev, loading: true }));
    
    try {
      // Reprocessar dados sem filtro
      const loansRef = collection(db, `users/${currentUser?.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : data.borrowDate,
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : data.returnDate,
        } as Loan;
      });

      const studentsRef = collection(db, `users/${currentUser?.uid}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      processTopStudents(loans, students);
      
      setStudentRankingFilter({
        active: false,
        startDate: '',
        endDate: '',
        loading: false
      });
    } catch (error) {
      console.error('Erro ao limpar filtro do ranking de estudantes:', error);
      setStudentRankingFilter(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser?.uid]);

  // Função para aplicar filtro no ranking de turmas
  const applyClassroomRankingFilter = useCallback(async (startDate: string, endDate: string) => {
    setClassroomRankingFilter(prev => ({ ...prev, loading: true }));
    
    try {
      // Reprocessar apenas os dados das turmas com filtro
      const loansRef = collection(db, `users/${currentUser?.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : data.borrowDate,
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : data.returnDate,
        } as Loan;
      });

      const studentsRef = collection(db, `users/${currentUser?.uid}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      const filterStartDate = startOfDay(parseISO(startDate));
      const filterEndDate = endOfDay(parseISO(endDate));
      
      processClassroomPerformance(loans, students, filterStartDate, filterEndDate);
      
      setClassroomRankingFilter({
        active: true,
        startDate,
        endDate,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao aplicar filtro no ranking de turmas:', error);
      setClassroomRankingFilter(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser?.uid]);

  // Função para limpar filtro do ranking de turmas
  const clearClassroomRankingFilter = useCallback(async () => {
    setClassroomRankingFilter(prev => ({ ...prev, loading: true }));
    
    try {
      // Reprocessar dados sem filtro
      const loansRef = collection(db, `users/${currentUser?.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : data.borrowDate,
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : data.returnDate,
        } as Loan;
      });

      const studentsRef = collection(db, `users/${currentUser?.uid}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      processClassroomPerformance(loans, students);
      
      setClassroomRankingFilter({
        active: false,
        startDate: '',
        endDate: '',
        loading: false
      });
    } catch (error) {
      console.error('Erro ao limpar filtro do ranking de turmas:', error);
      setClassroomRankingFilter(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser?.uid]);

  const fetchDashboardData = useCallback(async (options: { forceRefresh?: boolean; startDate?: Date; endDate?: Date } = {}) => {
    const { forceRefresh = false, startDate: filterStartDate, endDate: filterEndDate } = options;
    if (!currentUser) return;

    try {
      // Se não é force refresh e temos cache válido, não faz nada
      if (!forceRefresh && cache.hasCache && !cache.shouldRevalidate) {
        return;
      }

      // Se temos cache, carrega em background
      const isBackground = cache.hasCache;
      
      if (isBackground) {
        setBackgroundLoading(true);
        cache.setIsValidating(true);
      } else {
        setInitialLoading(true);
      }
      
      // 1. pega todos os livros
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const booksSnapshot = await getDocs(booksRef);
      const books = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      
      setTotalBooksCount(books.length);
      
      // 2. pega todos os empréstimos
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Converter timestamps para Date de forma mais robusta
        const convertTimestampToDate = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          
          if (timestamp instanceof Timestamp) {
            return timestamp.toDate();
          } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          } else if (timestamp.seconds) {
            // Para o formato { seconds: number, nanoseconds: number }
            return new Date(timestamp.seconds * 1000);
          } else if (timestamp instanceof Date) {
            return timestamp;
          } else if (typeof timestamp === 'string') {
            return new Date(timestamp);
          }
          
          return new Date();
        };
        
        // Converter todas as datas usando a nova função
        const borrowDate = convertTimestampToDate(data.borrowDate);
        const dueDate = convertTimestampToDate(data.dueDate);
        const returnDate = data.returnDate ? convertTimestampToDate(data.returnDate) : undefined;
        const createdAt = convertTimestampToDate(data.createdAt);
        
        return {
          id: doc.id,
          ...data,
          borrowDate,
          dueDate,
          returnDate,
          createdAt
        };
      }) as Loan[];
      
      // 3. pega todos os alunos
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      // total de leitores registrados
      setTotalReadersCount(students.length);
      
      // 4. calcula estatísticas principais
      processMainStats(loans, students);
      
      // 5. processa dados para os gráficos
      processGenreData(loans, books);
      processTopBooks(loans);
      processTopStudents(loans, students, filterStartDate, filterEndDate);
      processClassroomPerformance(loans, students, filterStartDate, filterEndDate);
      processMonthlyLoanData(loans);
      processCompletionRateData(loans);

      // Aguarda um pouco para que todos os states sejam atualizados
      // e então salva no cache
      setTimeout(() => {
        const dashboardData = {
          activeLoansCount,
          overdueLoansCount,
          totalBooksCount,
          activeReadersCount,
          totalBooksRead,
          totalReadersCount,
          genreData,
          topBooks,
          topStudents,
          classroomPerformance,
          monthlyLoanData,
          completionRateData
        };
        cache.saveToCache(dashboardData);
      }, 100);
      
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setInitialLoading(false);
      setBackgroundLoading(false);
      cache.setIsValidating(false);
    }
  }, [currentUser, cache]);

  // Cache invalidation quando dados importantes mudam
  useCacheInvalidation({
    onInvalidate: () => {
      console.log('Dashboard cache invalidated - fetching fresh data');
      cache.markAsStale();
      fetchDashboardData({ forceRefresh: true });
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Atualizar dados a cada 5 minutos enquanto o dashboard estiver aberto
  useEffect(() => {
    if (!currentUser) return;
    
    // Configurar atualização periódica
    const intervalId = setInterval(() => {
      fetchDashboardData({ forceRefresh: true }); // Force refresh no background
    }, 300000); // 5 minutos (300000 millisegundos)
    
    // limpa o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // Força atualização quando dados ficam stale
  useEffect(() => {
    if (cache.isStale && !cache.isValidating) {
      fetchDashboardData();
    }
  }, [cache.isStale, cache.isValidating, fetchDashboardData]);

  const processMainStats = (loans: Loan[], students: Student[]) => {
    // Contagem de empréstimos ativos
    const activeLoans = loans.filter(loan => loan.status === 'active');
    setActiveLoansCount(activeLoans.length);
    
    // Contagem de empréstimos atrasados
    const now = new Date();
    const overdueLoans = activeLoans.filter(loan => loan.dueDate < now);
    setOverdueLoansCount(overdueLoans.length);
    
    // Contagem de leitores ativos (alunos com empréstimos ativos ou que leram no último trimestre)
    const threeMonthsAgo = subMonths(new Date(), 3);
    
    // Conjunto de IDs únicos de alunos que têm empréstimos ativos ou recentes
    const activeReaderIds = new Set(
      loans.filter(loan => 
        loan.status === 'active' || 
        (loan.returnDate && loan.returnDate >= threeMonthsAgo)
      ).map(loan => loan.studentId)
    );
    
    setActiveReadersCount(activeReaderIds.size);
    
    // Calcular total de livros lidos (considerando leituras parciais)
    let totalReadCounter = 0;
    loans.forEach(loan => {
      if (loan.status === 'returned') {
        if (loan.completed) {
          totalReadCounter += 1;
        } else if (loan.readingProgress !== undefined) {
          totalReadCounter += loan.readingProgress / 100;
        }
      }
    });
    
    setTotalBooksRead(Math.round(totalReadCounter * 10) / 10); // Arredonda para 1 casa decimal
  };

  const processGenreData = (loans: Loan[], books: Book[]) => {
    // Mapear empréstimos para gêneros
    const genreCounts: Record<string, number> = {};
    
    loans.forEach(loan => {
      const book = books.find(b => b.id === loan.bookId);
      
      if (book?.genres && book.genres.length > 0) {
        book.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    // Converter para array e ordenar
    const genreArray = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Pegar os 8 principais
    
    setGenreData(genreArray);
  };

  const processTopBooks = (loans: Loan[]) => {
    // Contar empréstimos por livro
    const bookBorrowCounts: Record<string, { id: string, title: string, count: number }> = {};
    
    loans.forEach(loan => {
      if (!bookBorrowCounts[loan.bookId]) {
        bookBorrowCounts[loan.bookId] = {
          id: loan.bookId,
          title: loan.bookTitle,
          count: 0
        };
      }
      
      bookBorrowCounts[loan.bookId].count++;
    });
    
    // Converter para array e ordenar
    const topBooksArray = Object.values(bookBorrowCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 livros
      .map(item => ({
        id: item.id,
        title: item.title,
        borrowCount: item.count
      }));
    
    setTopBooks(topBooksArray);
  };

  const processTopStudents = (loans: Loan[], students: Student[], startDate?: Date, endDate?: Date) => {
    // Contar livros lidos por aluno, considerando progresso parcial
    const studentReadCounts: Record<string, { id: string, name: string, classroom: string, count: number }> = {};
    
    // Inicializar todos os alunos com contagem 0
    students.forEach(student => {
      studentReadCounts[student.id] = {
        id: student.id,
        name: student.name,
        classroom: student.classroom || 'N/A',
        count: 0
      };
    });
    
    // Calcular pontuação baseada no progresso de leitura
    loans.forEach(loan => {
      // Filtrar por data se os filtros estiverem ativos
      if (startDate && endDate) {
        const loanDate = loan.returnDate || loan.borrowDate;
        if (!loanDate || loanDate < startDate || loanDate > endDate) {
          return; // Pula este empréstimo se não estiver no período filtrado
        }
      }
      
      if (loan.status === 'returned' && studentReadCounts[loan.studentId]) {
        // Se o livro foi marcado como concluído, soma 1 ponto
        if (loan.completed) {
          studentReadCounts[loan.studentId].count += 1;
        } 
        // Se não foi concluído mas tem progresso de leitura, soma pontuação proporcional
        else if (loan.readingProgress !== undefined) {
          // Converte porcentagem para decimal (ex: 50% = 0.5 pontos)
          const progressPoints = loan.readingProgress / 100;
          studentReadCounts[loan.studentId].count += progressPoints;
        }
      }
    });
    
    // Converter para array e ordenar
    const topStudentsArray = Object.values(studentReadCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 alunos
      .map(item => ({
        id: item.id,
        name: item.name,
        classroom: item.classroom,
        booksRead: item.count
      }));
    
    setTopStudents(topStudentsArray);
  };

  const processClassroomPerformance = (loans: Loan[], students: Student[], startDate?: Date, endDate?: Date) => {
    // Agrupar alunos por turma
    const classroomStudents: Record<string, string[]> = {};
    
    students.forEach(student => {
      const classroom = student.classroom || 'Sem Turma';
      if (!classroomStudents[classroom]) {
        classroomStudents[classroom] = [];
      }
      classroomStudents[classroom].push(student.id);
    });
    
    // Calcular desempenho por turma
    const classroomStats: Record<string, { totalRead: number, totalStudents: number, completionSum: number, completionCount: number }> = {};
    
    // Inicializar estatísticas
    Object.keys(classroomStudents).forEach(classroom => {
      classroomStats[classroom] = {
        totalRead: 0,
        totalStudents: classroomStudents[classroom].length,
        completionSum: 0,
        completionCount: 0
      };
    });
    
    // Processar empréstimos
    loans.forEach(loan => {
      // Filtrar por data se os filtros estiverem ativos
      if (startDate && endDate) {
        const loanDate = loan.returnDate || loan.borrowDate;
        if (!loanDate || loanDate < startDate || loanDate > endDate) {
          return; // Pula este empréstimo se não estiver no período filtrado
        }
      }
      
      const student = students.find(s => s.id === loan.studentId);
      if (student) {
        const classroom = student.classroom || 'Sem Turma';
        
        // Contar livros lidos (incluindo parcialmente)
        if (loan.status === 'returned') {
          if (loan.completed) {
            classroomStats[classroom].totalRead += 1;
          } else if (loan.readingProgress !== undefined) {
            // Adiciona pontuação proporcional para leituras parciais
            classroomStats[classroom].totalRead += loan.readingProgress / 100;
          }
          
          // Somar taxas de progresso
          if (typeof loan.readingProgress === 'number') {
            classroomStats[classroom].completionSum += loan.readingProgress;
            classroomStats[classroom].completionCount++;
          }
        }
      }
    });
    
    // Calcular médias e formatar dados
    const performanceData = Object.entries(classroomStats)
      .map(([classroom, stats]) => ({
        classroom,
        booksRead: Math.round(stats.totalRead * 10) / 10, // Arredonda para 1 casa decimal
        averageCompletion: stats.completionCount > 0 
          ? Math.round(stats.completionSum / stats.completionCount) 
          : 0
      }))
      .sort((a, b) => b.booksRead - a.booksRead);
    
    setClassroomPerformance(performanceData);
  };

  const processMonthlyLoanData = (loans: Loan[]) => {
    // Gerar dados para os últimos 6 meses
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        label: format(date, 'MMM/yy', { locale: ptBR }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    }).reverse();
    
    const monthlyData = last6Months.map(month => {
      // Empréstimos iniciados no mês
      const borrowed = loans.filter(loan => 
        loan.borrowDate >= month.startDate && 
        loan.borrowDate <= month.endDate
      ).length;
      
      // Livros devolvidos no mês
      const returned = loans.filter(loan => 
        loan.status === 'returned' && 
        loan.returnDate && 
        loan.returnDate >= month.startDate && 
        loan.returnDate <= month.endDate
      ).length;
      
      // Para debugging - mostrar no console
      console.log(`Mês: ${month.label}, Empréstimos: ${borrowed}, Devoluções: ${returned}`);
      console.log(`Intervalo: ${month.startDate.toISOString()} - ${month.endDate.toISOString()}`);
      
      // Mostrar informações dos empréstimos devolvidos neste mês
      const returnedLoansInMonth = loans.filter(loan => 
        loan.status === 'returned' && 
        loan.returnDate && 
        loan.returnDate >= month.startDate && 
        loan.returnDate <= month.endDate
      );
      
      if (returnedLoansInMonth.length > 0) {
        console.log('Empréstimos devolvidos neste mês:', returnedLoansInMonth);
      }
      
      return {
        label: month.label,
        borrowed,
        returned
      };
    });
    
    setMonthlyLoanData({
      labels: monthlyData.map(d => d.label),
      borrowed: monthlyData.map(d => d.borrowed),
      returned: monthlyData.map(d => d.returned)
    });
  };

  const processCompletionRateData = (loans: Loan[]) => {
    // Agrupar por mês e calcular taxa de conclusão
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        label: format(date, 'MMM/yy', { locale: ptBR }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    }).reverse();
    
    const completionData = last6Months.map(month => {
      // Empréstimos devolvidos neste mês
      const returnedLoans = loans.filter(loan => 
        loan.status === 'returned' && 
        loan.returnDate && 
        loan.returnDate >= month.startDate && 
        loan.returnDate <= month.endDate
      );
      
      // Calcular média do progresso de leitura
      let averageProgress = 0;
      if (returnedLoans.length > 0) {
        // Soma todos os progressos (considerando 100% para livros marcados como concluídos)
        const totalProgress = returnedLoans.reduce((sum, loan) => {
          if (loan.completed) {
            return sum + 100;
          } else if (typeof loan.readingProgress === 'number') {
            return sum + loan.readingProgress;
          }
          return sum;
        }, 0);
        
        // Calcula a média
        averageProgress = Math.round(totalProgress / returnedLoans.length);
      }
      
      return {
        label: month.label,
        rate: averageProgress
      };
    });
    
    setCompletionRateData({
      labels: completionData.map(d => d.label),
      rates: completionData.map(d => d.rate)
    });
  };

  // Dados para os cards principais
  const stats = [
    {
      title: 'Livros Emprestados',
      value: activeLoansCount,
      description: 'Total de livros atualmente emprestados',
      clickable: true,
      onClick: () => navigate('/student-loans')
    },
    {
      title: 'Devoluções Pendentes',
      value: overdueLoansCount,
      description: 'Livros com devolução atrasada',
      clickable: true,
      onClick: () => navigate('/student-loans')
    },
    {
      title: 'Livros no Acervo',
      value: totalBooksCount,
      description: 'Total de livros disponíveis',
      clickable: true,
      onClick: () => navigate('/books')
    },
    {
      title: 'Leitores Registrados',
      value: totalReadersCount,
      description: 'Total de alunos cadastrados',
      clickable: true,
      onClick: () => navigate('/students')
    },
    {
      title: 'Leitores Ativos',
      value: activeReadersCount,
      description: 'Alunos com leituras no trimestre',
      clickable: true,
      onClick: () => navigate('/staff-loans')
    },
    {
      title: 'Total de Leituras',
      value: totalBooksRead,
      description: 'Inclui leituras parciais como pontuação',
      clickable: false
    }
  ];

  // Se é carregamento inicial e não temos cache, mostra skeleton
  if (initialLoading && !cache.hasCache) {
    return <DashboardSkeleton />;
  }

  // Se temos cache mas está carregando em background, mostra dados com indicador
  const showCacheIndicator = backgroundLoading || cache.isValidating;

  return (
    <div className={styles.dashboard}>
      {showCacheIndicator && (
        <div className={styles.cacheIndicator}>
          <div className={styles.cacheIcon}></div>
          <span>Atualizando dados em segundo plano...</span>
        </div>
      )}
      
      <h2>Dashboard</h2>
      
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            title={stat.title}
            value={stat.value}
            description={stat.description}
            onClick={stat.onClick}
            clickable={stat.clickable}
          />
        ))}
      </div>
      
      <div className={styles.charts}>
        {/* Gráfico de Empréstimos por Categoria */}
        <div className={styles.chartCard}>
          <h3>Empréstimos por Categoria</h3>
          {genreData.length > 0 ? (
            <div className={styles.chartContainer}>
              <Pie
                data={{
                  labels: genreData.map(item => item.genre),
                  datasets: [
                    {
                      data: genreData.map(item => item.count),
                      backgroundColor: [
                        '#4a90e2',
                        '#50c878',
                        '#f78fb3',
                        '#f5cd79',
                        '#778beb',
                        '#e77f67',
                        '#cf6a87',
                        '#786fa6'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 15,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
          <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
          </div>
          )}
        </div>
        
        {/* Lista de Livros Mais Populares */}
        <div className={styles.chartCard}>
          <h3>Livros Mais Populares</h3>
          {topBooks.length > 0 ? (
            <div className={styles.popularBooksContainer}>
              <table className={styles.topItemsTable}>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Empréstimos</th>
                  </tr>
                </thead>
                <tbody>
                  {topBooks.map((book, index) => (
                    <tr key={book.id} className={index === 0 ? styles.topRanked : ''}>
                      <td>
                        <span 
                          style={{
                            cursor: 'pointer',
                            color: '#4a90e2',
                            borderBottom: '1px dotted #4a90e2',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/books/${book.id}`);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2c5aa0';
                            e.currentTarget.style.borderBottomStyle = 'solid';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#4a90e2';
                            e.currentTarget.style.borderBottomStyle = 'dotted';
                          }}
                          title={`Editar ${book.title}`}
                        >
                          {book.title}
                        </span>
                      </td>
                      <td>{book.borrowCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>
      
      <h2 className={styles.sectionTitle}>Métricas de Desempenho</h2>
      
      <div className={styles.charts}>
        {/* Gráfico de Evolução Mensal */}
        <div className={styles.chartCard}>
          <h3>Evolução Mensal</h3>
          {monthlyLoanData.labels.length > 0 ? (
            <div className={styles.chartContainer}>
              <Line
                data={{
                  labels: monthlyLoanData.labels,
                  datasets: [
                    {
                      label: 'Empréstimos',
                      data: monthlyLoanData.borrowed,
                      borderColor: '#4a90e2',
                      backgroundColor: 'rgba(74, 144, 226, 0.5)',
                      tension: 0.3,
                      pointRadius: 5,
                      pointHoverRadius: 7
                    },
                    {
                      label: 'Devoluções',
                      data: monthlyLoanData.returned,
                      borderColor: '#50c878',
                      backgroundColor: 'rgba(80, 200, 120, 0.5)',
                      tension: 0.3,
                      pointRadius: 5,
                      pointHoverRadius: 7
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    },
                    tooltip: {
                      callbacks: {
                        title: function(tooltipItems) {
                          return tooltipItems[0].label;
                        },
                        label: function(context) {
                          const value = context.raw as number;
                          const label = context.dataset.label || '';
                          return `${label}: ${value} livros`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      },
                      title: {
                        display: true,
                        text: 'Quantidade de livros'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
            </div>
          )}
        </div>
        
        {/* Taxa de Conclusão de Leitura */}
        <div className={styles.chartCard}>
          <h3>Média de Progresso de Leitura</h3>
          {completionRateData.labels.length > 0 ? (
            <div className={styles.chartContainer}>
              <Bar
                data={{
                  labels: completionRateData.labels,
                  datasets: [
                    {
                      label: 'Progresso Médio (%)',
                      data: completionRateData.rates,
                      backgroundColor: '#778beb'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Média: ${context.raw}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.charts}>
        {/* Top Alunos */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Ranking de Alunos</h3>
            <EmbeddedDateFilter
              onApplyFilter={applyStudentRankingFilter}
              onClearFilter={clearStudentRankingFilter}
              hasActiveFilter={studentRankingFilter.active}
              activeStartDate={studentRankingFilter.startDate}
              activeEndDate={studentRankingFilter.endDate}
              loading={studentRankingFilter.loading}
            />
          </div>
          {topStudents.length > 0 ? (
            <div className={styles.rankingContainer}>
              <table className={styles.topItemsTable}>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Turma</th>
                    <th>Pontos de Leitura</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student, index) => (
                    <tr key={student.id} className={index === 0 ? styles.topRanked : ''}>
                      <td>
                        <span 
                          style={{
                            cursor: 'pointer',
                            color: '#4a90e2',
                            borderBottom: '1px dotted #4a90e2',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${student.id}`);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2c5aa0';
                            e.currentTarget.style.borderBottomStyle = 'solid';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#4a90e2';
                            e.currentTarget.style.borderBottomStyle = 'dotted';
                          }}
                          title={`Ir para o perfil de ${student.name}`}
                        >
                          {student.name}
                        </span>
                      </td>
                      <td>{student.classroom}</td>
                      <td>{student.booksRead.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
            </div>
          )}
        </div>
        
        {/* Desempenho por Turma */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Desempenho por Turma</h3>
            <EmbeddedDateFilter
              onApplyFilter={applyClassroomRankingFilter}
              onClearFilter={clearClassroomRankingFilter}
              hasActiveFilter={classroomRankingFilter.active}
              activeStartDate={classroomRankingFilter.startDate}
              activeEndDate={classroomRankingFilter.endDate}
              loading={classroomRankingFilter.loading}
            />
          </div>
          {classroomPerformance.length > 0 ? (
            <div className={styles.chartContainer}>
              <Bar
                data={{
                  labels: classroomPerformance.map(c => c.classroom),
                  datasets: [
                    {
                      label: 'Livros Lidos',
                      data: classroomPerformance.map(c => c.booksRead),
                      backgroundColor: '#4a90e2'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Livros: ${context.raw} livros`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Quantidade de livros lidos'
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
          <div className={styles.chartPlaceholder}>
              Nenhum dado disponível
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 