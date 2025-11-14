import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, limit, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardCache } from '../../hooks/useDashboardCache';
import { useCacheInvalidation } from '../../hooks/useCacheInvalidation';
import { useIncrementalSync } from '../../hooks/useIncrementalSync';
import { useLazySection } from '../../hooks/useLazySection';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import EmbeddedDateFilter from '../../components/ui/EmbeddedDateFilter';
import { useFeatureBlock } from '../../hooks/useFeatureBlocks';
import { FEATURE_BLOCK_KEYS } from '../../config/planFeatures';
import { LockClosedIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

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
  
  // Feature block para gráficos do dashboard
  const dashboardChartsFeature = useFeatureBlock(FEATURE_BLOCK_KEYS.BlockDashboardCharts);
  
  // Cache management
  const cache = useDashboardCache(currentUser?.uid || '');
  const [initialLoading, setInitialLoading] = useState(!cache.hasCache);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  // Ref para evitar carregamentos duplicados
  const isLoadingRef = useRef(false);
  const loadingIdRef = useRef(0);
  
  // Sincronização incremental
  const { syncLoans, syncBooks, syncStudents, mergeData } = useIncrementalSync();
  
  // Lazy loading de seções
  const genreChartSection = useLazySection();
  const monthlyChartSection = useLazySection();
  const rankingsSection = useLazySection();
  
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
  const [hasForcedRefreshOnMount, setHasForcedRefreshOnMount] = useState(false);

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

  // Função auxiliar: busca binária para encontrar aluno por ID (estável, sem dependências)
  const binarySearchStudent = useMemo(() => {
    return (students: Student[], studentId: string): Student | null => {
      let left = 0;
      let right = students.length - 1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const comparison = students[mid].id.localeCompare(studentId);
        
        if (comparison === 0) {
          return students[mid];
        } else if (comparison < 0) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return null;
    };
  }, []);

  // Função otimizada: busca apenas empréstimos ativos com query específica
  const fetchActiveLoansOptimized = useCallback(async () => {
    if (!currentUser) return { active: 0, overdue: 0 };

    try {
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const activeQuery = query(loansRef, where('status', '==', 'active'));
      const snapshot = await getDocs(activeQuery);
      
      const now = new Date();
      let overdueCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date();
        if (dueDate < now) {
          overdueCount++;
        }
      });
      
      return { active: snapshot.size, overdue: overdueCount };
    } catch (error) {
      console.error('Erro ao buscar empréstimos ativos:', error);
      return { active: 0, overdue: 0 };
    }
  }, [currentUser]);

  // Função otimizada: conta total de livros usando aggregation
  const fetchBooksCountOptimized = useCallback(async () => {
    if (!currentUser) return 0;

    try {
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const snapshot = await getCountFromServer(booksRef);
      return snapshot.data().count;
    } catch (error) {
      console.error('Erro ao contar livros:', error);
      // Fallback: busca normal se aggregation não disponível
      const booksRefFallback = collection(db, `users/${currentUser.uid}/books`);
      const snapshotFallback = await getDocs(booksRefFallback);
      return snapshotFallback.size;
    }
  }, [currentUser]);

  // Função otimizada: conta total de alunos usando aggregation
  const fetchStudentsCountOptimized = useCallback(async () => {
    if (!currentUser) return 0;

    try {
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const snapshot = await getCountFromServer(studentsRef);
      return snapshot.data().count;
    } catch (error) {
      console.error('Erro ao contar alunos:', error);
      // Fallback
      const studentsRefFallback = collection(db, `users/${currentUser.uid}/students`);
      const snapshotFallback = await getDocs(studentsRefFallback);
      return snapshotFallback.size;
    }
  }, [currentUser]);

  // Função otimizada: busca empréstimos dos últimos 6 meses para gráficos
  const fetchRecentLoansForCharts = useCallback(async () => {
    if (!currentUser) return [];

    try {
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const recentQuery = query(
        loansRef,
        where('borrowDate', '>=', Timestamp.fromDate(sixMonthsAgo)),
        orderBy('borrowDate', 'desc')
      );
      
      const snapshot = await getDocs(recentQuery);
      console.log(`📊 Buscou ${snapshot.size} empréstimos dos últimos 6 meses (otimizado)`);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date(),
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as Loan;
      });
    } catch (error) {
      console.error('Erro ao buscar empréstimos recentes:', error);
      return [];
    }
  }, [currentUser]);

  // Função para buscar TODOS os empréstimos necessários para estatísticas principais
  const fetchAllLoansForStats = useCallback(async () => {
    if (!currentUser) return [];

    try {
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      
      // Busca TODOS os empréstimos (sem filtro de data)
      const allLoansQuery = query(
        loansRef,
        orderBy('borrowDate', 'desc')
      );
      
      const snapshot = await getDocs(allLoansQuery);
      console.log(`📊 Buscou ${snapshot.size} empréstimos para estatísticas principais`);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date(),
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as Loan;
      });
    } catch (error) {
      console.error('Erro ao buscar todos os empréstimos:', error);
      return [];
    }
  }, [currentUser]);

  const fetchDashboardData = useCallback(async (options: { forceRefresh?: boolean; startDate?: Date; endDate?: Date } = {}) => {
    const { forceRefresh = false, startDate: filterStartDate, endDate: filterEndDate } = options;
    if (!currentUser) return;

    // Previne carregamentos duplicados/concorrentes
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Carregamento já em andamento, pulando...');
      return;
    }

    try {
      // Se não é force refresh e temos cache válido, não faz nada
      if (!forceRefresh && cache.hasCache && !cache.shouldRevalidate) {
        return;
      }

      // Marca como carregando
      const loadingId = ++loadingIdRef.current;
      isLoadingRef.current = true;

      // Se temos cache, carrega em background
      const isBackground = cache.hasCache;
      
      if (isBackground) {
        setBackgroundLoading(true);
        cache.setIsValidating(true);
      } else {
        setInitialLoading(true);
      }
      
      console.log('🚀 Iniciando carregamento otimizado do dashboard...');
      const startTime = performance.now();
      
      // FASE 1: Estatísticas principais com queries otimizadas (paralelo)
      const [loansStats, booksCount, studentsCount, allLoansForStats] = await Promise.all([
        fetchActiveLoansOptimized(),
        fetchBooksCountOptimized(),
        fetchStudentsCountOptimized(),
        fetchAllLoansForStats() // Busca TODOS os empréstimos para estatísticas corretas
      ]);
      
      setActiveLoansCount(loansStats.active);
      setOverdueLoansCount(loansStats.overdue);
      setTotalBooksCount(booksCount);
      setTotalReadersCount(studentsCount);
      
      console.log(`✅ Estatísticas principais carregadas: ${loansStats.active} ativos, ${loansStats.overdue} atrasados`);
      
      // FASE 2: Sincronização incremental ou busca completa
      let loans: Loan[];
      let books: Book[];
      let students: Student[];
      
      const useIncrementalSync = cache.lastSyncTimestamp > 0 && !forceRefresh;
      
      if (useIncrementalSync) {
        console.log('📡 Usando sincronização incremental...');
        
        // Busca apenas dados modificados
        const [newLoans, newBooks, newStudents] = await Promise.all([
          syncLoans({ userId: currentUser.uid, lastSyncTimestamp: cache.lastSyncTimestamp }),
          syncBooks({ userId: currentUser.uid, lastSyncTimestamp: cache.lastSyncTimestamp }),
          syncStudents({ userId: currentUser.uid, lastSyncTimestamp: cache.lastSyncTimestamp })
        ]);
        
        // Mescla com cache existente
        const cachedData = cache.cachedData;
        if (cachedData) {
          // Para empréstimos, precisamos buscar todos para gráficos (apenas recentes)
          const recentLoans = await fetchRecentLoansForCharts();
          loans = recentLoans;
          
          // Livros: usa apenas os do cache (estatísticas de gênero não precisam ser atualizadas sempre)
          books = newBooks.length > 0 ? newBooks as Book[] : [];
          
          // Alunos: mescla incremental
          const mergedStudents = mergeData(
            (cachedData as any).allStudents || [],
            newStudents as Student[]
          );
          students = mergedStudents.merged;
          
          console.log(`🔄 Dados mesclados: ${newLoans.length} novos loans, ${newBooks.length} novos books, ${newStudents.length} novos students`);
        } else {
          // Fallback se não tem cache
          loans = newLoans as Loan[];
          books = newBooks as Book[];
          students = newStudents as Student[];
        }
      } else {
        console.log('📥 Carregamento completo (primeira vez ou force refresh)...');
        
        // Carregamento completo otimizado: apenas empréstimos recentes
        const recentLoans = await fetchRecentLoansForCharts();
        loans = recentLoans;
        
        // Busca todos os livros e alunos em paralelo
        const [allBooks, allStudents] = await Promise.all([
          (async () => {
            const booksRef = collection(db, `users/${currentUser.uid}/books`);
            const booksSnapshot = await getDocs(booksRef);
            return booksSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Book[];
          })(),
          (async () => {
            const studentsRef = collection(db, `users/${currentUser.uid}/students`);
            const studentsSnapshot = await getDocs(studentsRef);
            return studentsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Student[];
          })()
        ]);
        
        books = allBooks;
        students = allStudents;
        
        setTotalReadersCount(students.length);
      }
      
      // FASE 3: Processa estatísticas e gráficos
      console.log('📊 Processando dados para gráficos...');
      
      // Ordena alunos para busca binária
      const sortedStudents = [...students].sort((a, b) => a.id.localeCompare(b.id));
      
      // Calcula estatísticas principais usando TODOS os empréstimos
      processMainStats(allLoansForStats, sortedStudents);
      
      // Processa dados para os gráficos apenas se não estiver bloqueado
      if (!dashboardChartsFeature.isBlocked && !dashboardChartsFeature.loading) {
        processGenreData(loans, books);
        processTopBooks(loans);
        processTopStudents(loans, sortedStudents, filterStartDate, filterEndDate);
        processClassroomPerformance(loans, sortedStudents, filterStartDate, filterEndDate);
        processMonthlyLoanData(loans);
        processCompletionRateData(loans);
      } else if (!dashboardChartsFeature.loading) {
        // Limpa dados dos gráficos quando bloqueado (apenas quando não está carregando)
        setGenreData([]);
        setTopBooks([]);
        setTopStudents([]);
        setClassroomPerformance([]);
        setMonthlyLoanData({ labels: [], borrowed: [], returned: [] });
        setCompletionRateData({ labels: [], rates: [] });
      }
      
      const endTime = performance.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`✅ Dashboard carregado com sucesso em ${loadTime}s`);

      // Salva no cache com timestamp de sincronização
      setTimeout(() => {
        const dashboardData = {
          activeLoansCount: loansStats.active,
          overdueLoansCount: loansStats.overdue,
          totalBooksCount: booksCount,
          activeReadersCount,
          totalBooksRead,
          totalReadersCount: studentsCount,
          genreData,
          topBooks,
          topStudents,
          classroomPerformance,
          monthlyLoanData,
          completionRateData,
          // Armazena dados completos para merge incremental
          allStudents: students
        };
        cache.saveToCache(dashboardData as any, Date.now());
      }, 100);
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
    } finally {
      isLoadingRef.current = false;
      setInitialLoading(false);
      setBackgroundLoading(false);
      cache.setIsValidating(false);
    }
  }, [
    currentUser, 
    cache, 
    fetchActiveLoansOptimized, 
    fetchBooksCountOptimized, 
    fetchStudentsCountOptimized,
    fetchRecentLoansForCharts,
    fetchAllLoansForStats,
    syncLoans,
    syncBooks,
    syncStudents,
    mergeData
  ]);

  // Cache invalidation quando dados importantes mudam
  useCacheInvalidation({
    onInvalidate: () => {
      console.log('Dashboard cache invalidated - fetching fresh data');
      cache.markAsStale();
      fetchDashboardData({ forceRefresh: true });
    }
  });

  // Carregamento inicial e gerenciamento de atualizações
  useEffect(() => {
    if (!currentUser) return;
    
    // Carregamento inicial
    fetchDashboardData();
    
    // Configurar atualização periódica (5 minutos)
    const intervalId = setInterval(() => {
      console.log('🔄 Atualização automática do dashboard (5 min)');
      fetchDashboardData({ forceRefresh: true });
    }, 300000);
    
    // limpa o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]); // Apenas quando o usuário mudar

  useEffect(() => {
    setHasForcedRefreshOnMount(false);
  }, [currentUser?.uid]);

  // Recarrega dados quando o usuário volta para o dashboard (navegação entre páginas)
  useEffect(() => {
    if (!currentUser) return;
    
    // Força recarregamento sempre que o componente é montado (volta da navegação)
    console.log('🔄 Dashboard montado, verificando dados...');
    
    // Pequeno delay para permitir que os estados sejam inicializados
    const timeoutId = setTimeout(() => {
      // Verifica se os dados específicos estão zerados (indicando cache corrompido)
      const hasInvalidData = activeReadersCount === 0 && totalBooksRead === 0 &&
                            totalBooksCount > 0 && totalReadersCount > 0; // Mas tem dados de contagem
      
      if (hasInvalidData && !hasForcedRefreshOnMount) {
        console.log('🔄 Dados inválidos detectados, recarregando dashboard...');
        setHasForcedRefreshOnMount(true);
        fetchDashboardData({ forceRefresh: true });
      } else {
        console.log('✅ Dados válidos encontrados no cache');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [
    currentUser,
    activeLoansCount,
    overdueLoansCount,
    activeReadersCount,
    totalBooksRead,
    totalBooksCount,
    totalReadersCount,
    fetchDashboardData,
    hasForcedRefreshOnMount
  ]);

  // Força atualização quando dados ficam stale (mas não cria loop)
  useEffect(() => {
    if (cache.isStale && !cache.isValidating && !isLoadingRef.current) {
      console.log('📡 Cache stale detectado, recarregando...');
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.isStale]);

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
    
    // Processar empréstimos (com busca binária otimizada)
    loans.forEach(loan => {
      // Filtrar por data se os filtros estiverem ativos
      if (startDate && endDate) {
        const loanDate = loan.returnDate || loan.borrowDate;
        if (!loanDate || loanDate < startDate || loanDate > endDate) {
          return; // Pula este empréstimo se não estiver no período filtrado
        }
      }
      
      // Usa busca binária se alunos estão ordenados
      const student = binarySearchStudent(students, loan.studentId);
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
      
      {dashboardChartsFeature.isBlocked ? (
        <div className={styles.featureBlockContainer}>
          <div className={styles.featureBlockBackdrop} aria-hidden="true">
            <div className={styles.backdropPanel}>
              <div className={styles.backdropHeader}>
                <span className={styles.backdropBadge}></span>
                <span className={styles.backdropTitle}></span>
                <span className={styles.backdropSubtitle}></span>
              </div>
              <div className={styles.backdropScoreCard}>
                <span className={styles.backdropScoreRing}></span>
                <div className={styles.backdropScoreInfo}>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className={styles.backdropMetricList}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div className={styles.backdropCharts}>
              <div className={styles.backdropLineChart}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className={styles.backdropBarChart}>
                <span data-height="sm"></span>
                <span data-height="md"></span>
                <span data-height="lg"></span>
                <span data-height="xl"></span>
                <span data-height="md"></span>
                <span data-height="sm"></span>
              </div>
            </div>
          </div>
          <div className={styles.featureBlockCard}>
            <div className={styles.featureBlockHeader}>
              <div className={styles.featureBlockIcon}>
                <LockClosedIcon />
              </div>
              <div>
                <span className={styles.featureBlockBadge}>
                  Plano atual: {dashboardChartsFeature.planDisplayName}
                </span>
                <h4>Gráficos e análises disponíveis no plano Intermediário</h4>
              </div>
            </div>
            <p className={styles.featureBlockDescription}>
              Faça o upgrade para o Bibliotech Intermediário e tenha acesso a gráficos completos, rankings detalhados e análises avançadas do seu dashboard.
            </p>
            <ul className={styles.featureBlockHighlights}>
              <li>Acompanhe métricas e gráficos sobre suas turmas em tempo real</li>
              <li>Visualize rankings completos e gráficos prontos para reuniões</li>
              <li>Veja as categorias e livros mais lidos para investir em livros melhores</li>
              <li>Veja a evolução mensal da biblioteca em geral, assim como de cada turma</li>
            </ul>
            <a
              className={styles.featureBlockButton}
              href="https://bibliotech.tech/#planos"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conhecer plano intermediário
              <ArrowUpRightIcon />
            </a>
            <span className={styles.featureBlockFootnote}>
              Disponível nos planos Bibliotech Intermediário e Avançado.
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.charts}>
          {/* Gráfico de Empréstimos por Categoria */}
          <div ref={genreChartSection.elementRef} className={styles.chartCard}>
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
      )}
      
      {!dashboardChartsFeature.isBlocked && (
        <>
          <h2 className={styles.sectionTitle}>Métricas de Desempenho</h2>
          
          <div className={styles.charts}>
        {/* Gráfico de Evolução Mensal */}
        <div ref={monthlyChartSection.elementRef} className={styles.chartCard}>
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
        <div ref={rankingsSection.elementRef} className={styles.chartCard}>
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
        </>
      )}
    </div>
  );
};

export default Dashboard; 