import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';
import { useClassStatsCache } from '../../hooks/useClassStatsCache';
import { Bar, Pie } from 'react-chartjs-2';
import { startOfYear, endOfYear } from 'date-fns';
import { 
  BookOpenIcon, 
  TrophyIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import styles from './ClassDashboard.module.css';

interface ClassStats {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  genreStats: { [genre: string]: number };
  studentRanking: Array<{ studentId: string; studentName: string; totalBooks: number }>;
  monthlyLoans: Array<{ month: string; count: number }>;
}

interface ClassDashboardProps {
  studentClassName: string;
  studentId: string;
  currentUserId?: string;
  selectedYear?: number;
}

const ClassDashboard: React.FC<ClassDashboardProps> = ({ studentClassName, studentId, currentUserId, selectedYear = new Date().getFullYear() }) => {
  console.log('🏫 ClassDashboard renderizado com props:', { studentClassName, studentId, currentUserId });
  
  const { currentUser } = useAuth();
  const effectiveUserId = currentUserId || currentUser?.uid;
  const chartOptions = useResponsiveChart();
  
  // Usar o hook de cache
  const { cachedData, setCachedData } = useClassStatsCache(studentClassName, effectiveUserId);
  
  const [classStats, setClassStats] = useState<ClassStats | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  console.log('🏫 Estado atual:', { loading, error, hasClassStats: !!classStats, hasCachedData: !!cachedData });
  console.log('🏫 effectiveUserId:', effectiveUserId);

  useEffect(() => {
    console.log('🏫 useEffect disparado - studentClassName:', studentClassName, 'effectiveUserId:', effectiveUserId, 'selectedYear:', selectedYear);
    
    // Sempre recarregar quando o ano mudar, mesmo se tiver cache
    // O cache não inclui filtro por ano
    if (effectiveUserId && studentClassName) {
      console.log('🔄 Buscando dados do servidor...');
      fetchClassStats();
    }
  }, [studentClassName, effectiveUserId, selectedYear]);

  const fetchClassStats = async () => {
    console.log('🏫 Iniciando fetchClassStats...');
    console.log('📍 effectiveUserId:', effectiveUserId);
    console.log('📍 studentClassName:', studentClassName);
    
    if (!effectiveUserId || !studentClassName) {
      console.log('❌ Faltam dados básicos - effectiveUserId ou studentClassName');
      return;
    }

    try {
      setLoading(true); // Garantir que loading está ativo
      setError(null);
      console.log('🔄 Iniciando carregamento...');

      // Buscar todos os alunos da mesma turma
      console.log('🔍 Buscando alunos da turma:', studentClassName);
      const studentsRef = collection(db, `users/${effectiveUserId}/students`);
      const studentsQuery = query(studentsRef, where('classroom', '==', studentClassName));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      console.log('👥 Documentos de alunos encontrados:', studentsSnapshot.docs.length);
      
      const classStudents = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('👥 Alunos da turma processados:', classStudents.length);
      console.log('👥 Primeiros 3 alunos:', classStudents.slice(0, 3));

      const studentIds = classStudents.map(student => student.id);
      console.log('🆔 IDs dos alunos:', studentIds);

      // Buscar todos os empréstimos dos alunos da turma
      console.log('📚 Buscando empréstimos...');
      const loansRef = collection(db, `users/${effectiveUserId}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      
      console.log('📚 Total de empréstimos no sistema:', loansSnapshot.docs.length);
      
      const allLoans = loansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📚 Primeiros 3 empréstimos do sistema:', allLoans.slice(0, 3));

      // Filtrar empréstimos dos alunos da turma e pelo ano selecionado
      console.log('🔍 Filtrando empréstimos da turma...');
      console.log('🔍 IDs dos alunos da turma:', studentIds);
      console.log('📅 Ano selecionado:', selectedYear);
      
      const yearStart = startOfYear(new Date(selectedYear, 0, 1));
      const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
      
      const classLoans = allLoans.filter((loan: any) => {
        const isFromClass = studentIds.includes((loan as any).studentId);
        if (!isFromClass) {
          console.log('🔍 Empréstimo ignorado (não é da turma):', { loanId: loan.id, studentId: (loan as any).studentId });
          return false;
        }
        
        // Filtrar por ano
        let loanDate = null;
        if (loan.borrowedAt && typeof loan.borrowedAt.toDate === 'function') {
          loanDate = loan.borrowedAt.toDate();
        } else if (loan.borrowDate && typeof loan.borrowDate.toDate === 'function') {
          loanDate = loan.borrowDate.toDate();
        } else if (loan.createdAt && typeof loan.createdAt.toDate === 'function') {
          loanDate = loan.createdAt.toDate();
        } else if (loan.borrowedAt) {
          loanDate = new Date(loan.borrowedAt);
        } else if (loan.borrowDate) {
          loanDate = new Date(loan.borrowDate);
        }
        
        if (!loanDate) {
          return false;
        }
        
        const isInYear = loanDate >= yearStart && loanDate <= yearEnd;
        if (!isInYear) {
          console.log('🔍 Empréstimo ignorado (fora do ano selecionado):', { loanId: loan.id, loanDate });
        }
        return isInYear;
      });
      
      console.log('📚 Empréstimos da turma filtrados:', classLoans.length);
      console.log('📚 Todos os empréstimos da turma:', classLoans.map(loan => ({
        id: loan.id,
        studentId: (loan as any).studentId,
        bookId: (loan as any).bookId,
        status: (loan as any).status,
        returned: (loan as any).returned,
        returnedAt: (loan as any).returnedAt
      })));

      // Buscar detalhes dos livros para obter gêneros
      console.log('📖 Buscando livros...');
      const booksRef = collection(db, `users/${effectiveUserId}/books`);
      const booksSnapshot = await getDocs(booksRef);
      const books = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📖 Total de livros no sistema:', books.length);
      console.log('📖 Primeiros 3 livros:', books.slice(0, 3));

      // Calcular estatísticas
      console.log('📊 Calculando estatísticas...');
      console.log('📊 Total de empréstimos da turma:', classLoans.length);
      
      const now = new Date();
      const totalLoans = classLoans.length;

      // Analisar cada empréstimo individualmente
      let activeCount = 0;
      let returnedCount = 0;
      let overdueCount = 0;

      classLoans.forEach((loan: any, index: number) => {
        console.log(`📊 Empréstimo ${index + 1}:`, {
          id: loan.id,
          studentId: loan.studentId,
          bookId: loan.bookId,
          returnedAt: loan.returnedAt,
          returned: loan.returned,
          status: loan.status,
          dueDate: loan.dueDate,
          borrowedAt: loan.borrowedAt,
          borrowDate: loan.borrowDate
        });

        // Verificar se foi devolvido (múltiplos campos possíveis)
        const isReturned = !!(loan.returnedAt || loan.returned || loan.status === 'returned');
        
        if (isReturned) {
          returnedCount++;
          console.log(`📊 ✅ Empréstimo ${index + 1} está DEVOLVIDO`);
        } else {
          activeCount++;
          console.log(`📊 🔄 Empréstimo ${index + 1} está ATIVO`);
          
          // Verificar se está em atraso
          let dueDate = null;
          if (loan.dueDate && typeof loan.dueDate.toDate === 'function') {
            dueDate = loan.dueDate.toDate();
          } else if (loan.dueDate) {
            dueDate = new Date(loan.dueDate);
          }

          if (dueDate && dueDate < now) {
            overdueCount++;
            console.log(`📊 ⚠️ Empréstimo ${index + 1} está EM ATRASO (vence em: ${dueDate})`);
          } else {
            console.log(`📊 ✅ Empréstimo ${index + 1} está em dia (vence em: ${dueDate})`);
          }
        }
      });

      const activeLoans = activeCount;
      const returnedLoans = returnedCount;
      const overdueLoans = overdueCount;

      console.log('📊 Estatísticas finais calculadas:', {
        totalLoans,
        activeLoans,
        returnedLoans,
        overdueLoans,
        verificacao: `${activeLoans + returnedLoans} deve ser igual a ${totalLoans}`
      });

      // Calcular estatísticas por gênero
      console.log('📈 Calculando estatísticas por gênero...');
      const genreStats: { [genre: string]: number } = {};
      classLoans.forEach((loan: any) => {
        const book = books.find((b: any) => b.id === loan.bookId);
        console.log('📖 Processando empréstimo:', { loanId: loan.id, bookId: loan.bookId, bookFound: !!book });
        if (book) {
          console.log('📖 Dados do livro:', book);
          // Tentar diferentes propriedades para o gênero
          const genre = (book as any).genre || (book as any).genres || (book as any).category || (book as any).categories;
          console.log('📖 Gênero encontrado:', genre);
          if (genre) {
            // Se for um array, pegar o primeiro
            const genreValue = Array.isArray(genre) ? genre[0] : genre;
            if (genreValue) {
              genreStats[genreValue] = (genreStats[genreValue] || 0) + 1;
            }
          }
        }
      });
      console.log('📈 Estatísticas de gênero finais:', genreStats);

      // Calcular ranking de alunos
      const studentLoansCount: { [studentId: string]: number } = {};
      classLoans.forEach((loan: any) => {
        studentLoansCount[loan.studentId] = (studentLoansCount[loan.studentId] || 0) + 1;
      });

      const studentRanking = classStudents
        .map((student: any) => ({
          studentId: student.id,
          studentName: student.name,
          totalBooks: studentLoansCount[student.id] || 0
        }))
        .sort((a, b) => b.totalBooks - a.totalBooks);

      // Calcular empréstimos por mês do ano selecionado (12 meses)
      console.log('📅 Calculando estatísticas mensais para o ano:', selectedYear);
      const monthlyStats: { [monthKey: string]: number } = {};
      
      // Criar estrutura para os 12 meses do ano selecionado
      for (let i = 0; i < 12; i++) {
        const date = new Date(selectedYear, i, 1);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyStats[monthName] = 0;
        console.log('📅 Mês inicializado:', monthName);
      }

      console.log('📅 Estrutura inicial dos meses:', Object.keys(monthlyStats));

      // Processar empréstimos
      classLoans.forEach((loan: any) => {
        console.log('📅 Processando empréstimo para data:', { 
          loanId: loan.id, 
          borrowedAt: loan.borrowedAt,
          borrowDate: loan.borrowDate,
          createdAt: loan.createdAt 
        });
        
        // Tentar diferentes campos de data
        let loanDate = null;
        if (loan.borrowedAt && typeof loan.borrowedAt.toDate === 'function') {
          loanDate = loan.borrowedAt.toDate();
        } else if (loan.borrowDate && typeof loan.borrowDate.toDate === 'function') {
          loanDate = loan.borrowDate.toDate();
        } else if (loan.createdAt && typeof loan.createdAt.toDate === 'function') {
          loanDate = loan.createdAt.toDate();
        } else if (loan.borrowedAt) {
          loanDate = new Date(loan.borrowedAt);
        } else if (loan.borrowDate) {
          loanDate = new Date(loan.borrowDate);
        }

        if (loanDate) {
          const monthName = loanDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          console.log('📅 Data processada:', loanDate, 'Mês:', monthName);
          if (monthlyStats.hasOwnProperty(monthName)) {
            monthlyStats[monthName]++;
            console.log('📅 Incrementado mês:', monthName, 'Total:', monthlyStats[monthName]);
          }
        } else {
          console.log('📅 Empréstimo sem data válida:', loan);
        }
      });

      console.log('📅 Estatísticas mensais finais:', monthlyStats);

      const monthlyLoans = Object.entries(monthlyStats).map(([month, count]) => ({
        month,
        count
      }));
      
      console.log('📅 Array final para gráfico:', monthlyLoans);

      const finalStats = {
        totalLoans,
        activeLoans,
        returnedLoans,
        overdueLoans,
        genreStats,
        studentRanking,
        monthlyLoans
      };

      console.log('✅ Estatísticas finais calculadas:', finalStats);
      console.log('📈 Gêneros encontrados:', Object.keys(genreStats));
      console.log('🏆 Top 3 do ranking:', studentRanking.slice(0, 3));

      setClassStats(finalStats);
      
      // Salvar no cache
      if (effectiveUserId && studentClassName) {
        setCachedData(finalStats);
        console.log('💾 Dados salvos no cache');
      }
      
      console.log('✅ Estado atualizado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas da turma:', error);
      console.error('❌ Stack trace:', error);
      setError('Erro ao carregar estatísticas da turma');
    } finally {
      setLoading(false);
      console.log('🔄 Loading finalizado');
    }
  };

  if (loading) {
    return (
      <div className={styles.classDashboard}>
        {/* Header Skeleton */}
        <div className={styles.header}>
          <div className={styles.headerTitleSkeleton}></div>
          <div className={styles.headerSubtitleSkeleton}></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className={styles.statCardSkeleton}>
              <div className={styles.statIconSkeleton}></div>
              <div className={styles.statContentSkeleton}>
                <div className={styles.statLabelSkeleton}></div>
                <div className={styles.statValueSkeleton}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className={styles.chartsGrid}>
          {/* Chart 1 - Pie Chart Skeleton */}
          <div className={styles.chartCardSkeleton}>
            <div className={styles.chartTitleSkeleton}></div>
            <div className={styles.chartWrapperSkeleton}>
              <div className={styles.pieChartSkeleton}></div>
            </div>
          </div>

          {/* Chart 2 - Bar Chart Skeleton */}
          <div className={styles.chartCardSkeleton}>
            <div className={styles.chartTitleSkeleton}></div>
            <div className={styles.chartWrapperSkeleton}>
              <div className={styles.barChartSkeleton}></div>
            </div>
          </div>
        </div>

        {/* Ranking Skeleton */}
        <div className={styles.rankingCardSkeleton}>
          <div className={styles.rankingTitleSkeleton}>
            <div className={styles.rankingIconSkeleton}></div>
            <div className={styles.rankingTextSkeleton}></div>
          </div>
          <div className={styles.rankingListSkeleton}>
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className={styles.rankingItemSkeleton}>
                <div className={styles.rankingPositionSkeleton}></div>
                <div className={styles.rankingInfoSkeleton}>
                  <div className={styles.studentNameSkeleton}></div>
                  <div className={styles.bookCountSkeleton}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={fetchClassStats} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!classStats) {
    return (
      <div className={styles.emptyContainer}>
        <UserGroupIcon className={styles.emptyIcon} />
        <h3>Dados da turma não encontrados</h3>
        <p>Não foi possível carregar as informações da turma {studentClassName}</p>
      </div>
    );
  }

  console.log('🎨 Renderizando ClassDashboard com dados:', {
    totalLoans: classStats.totalLoans,
    genreStatsKeys: Object.keys(classStats.genreStats),
    monthlyLoansLength: classStats.monthlyLoans.length,
    hasGenreData: Object.keys(classStats.genreStats).length > 0,
    hasMonthlyData: classStats.monthlyLoans.length > 0
  });

  return (
    <div className={styles.classDashboard}>
      <div className={styles.header}>
        <h3>Dashboard da Turma {studentClassName}</h3>
        <p>Estatísticas e desempenho da sua turma</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <BookOpenIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Total de Empréstimos</h4>
            <span className={styles.statValue}>{classStats.totalLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <ClockIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Empréstimos Ativos</h4>
            <span className={styles.statValue}>{classStats.activeLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircleIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Devolvidos</h4>
            <span className={styles.statValue}>{classStats.returnedLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <ExclamationTriangleIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Em Atraso</h4>
            <span className={styles.statValue}>{classStats.overdueLoans}</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Gráfico de Pizza - Empréstimos por Gênero */}
        <div className={styles.chartCard}>
          <h4>Empréstimos por Gênero</h4>
          {Object.keys(classStats.genreStats).length > 0 && Object.values(classStats.genreStats).some(val => val > 0) ? (
            <div className={styles.chart}>
              <Pie
                data={{
                  labels: Object.keys(classStats.genreStats),
                  datasets: [
                    {
                      data: Object.values(classStats.genreStats),
                      backgroundColor: [
                        '#3B82F6', '#ef4444', '#10b981', '#f59e0b', '#1D4ED8',
                        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#2563EB'
                      ],
                      borderWidth: 2,
                      borderColor: '#ffffff'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: chartOptions.isMobile ? 'bottom' : 'right',
                      labels: {
                        usePointStyle: true,
                        padding: chartOptions.padding,
                        font: {
                          size: chartOptions.fontSize
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((context.parsed / total) * 100).toFixed(1);
                          return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className={styles.noData}>Nenhum empréstimo encontrado</div>
          )}
        </div>

        {/* Gráfico de Barras - Empréstimos por Mês */}
        <div className={styles.chartCard}>
          <h4>Empréstimos por Mês</h4>
          {classStats.monthlyLoans && classStats.monthlyLoans.length > 0 ? (
            <div className={styles.chart}>
              <Bar
              data={{
                labels: classStats.monthlyLoans.map(item => item.month),
                datasets: [
                  {
                    label: 'Empréstimos',
                    data: classStats.monthlyLoans.map(item => item.count),
                    backgroundColor: '#4285f4',
                    borderColor: '#1a73e8',
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      font: {
                        size: chartOptions.fontSize
                      },
                      maxRotation: chartOptions.maxRotation
                    }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      font: {
                        size: chartOptions.fontSize
                      }
                    }
                  }
                }
              }}
            />
            </div>
          ) : (
            <div className={styles.noData}>Nenhum empréstimo encontrado</div>
          )}
        </div>
      </div>

      {/* Ranking de Alunos */}
      <div className={styles.rankingCard}>
        <h4>
          <TrophyIcon className={styles.rankingIcon} />
          Ranking de Leitores da Turma
        </h4>
        {classStats.studentRanking.length > 0 ? (
          <div className={styles.rankingList}>
            {classStats.studentRanking.slice(0, 10).map((student, index) => (
              <div 
                key={student.studentId} 
                className={`${styles.rankingItem} ${student.studentId === studentId ? styles.currentStudent : ''}`}
              >
                <div className={styles.rankingPosition}>
                  <span className={`${styles.positionBadge} ${index < 3 ? styles.topThree : ''}`}>
                    {index + 1}º
                  </span>
                </div>
                <div className={styles.rankingInfo}>
                  <span className={styles.studentName}>
                    {student.studentName}
                    {student.studentId === studentId && <span className={styles.youBadge}>(Você)</span>}
                  </span>
                  <span className={styles.bookCount}>
                    {student.totalBooks} {student.totalBooks === 1 ? 'livro' : 'livros'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noData}>Nenhum empréstimo registrado ainda</div>
        )}
      </div>
    </div>
  );
};

export default ClassDashboard;
