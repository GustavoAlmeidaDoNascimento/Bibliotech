import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, TrendingUp, Trophy, Target, Users, Clock, Calendar } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import ClassDashboard from '../../components/student/ClassDashboard';
import { studentService, StudentDashboardData, StudentLoan, StudentBook } from '../../services/studentService';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';
import styles from './StudentStats.module.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

type TabType = 'aluno' | 'turma';

const StudentStats: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const chartOptions = useResponsiveChart();
  const [activeTab, setActiveTab] = useState<TabType>('aluno');
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Métricas do Aluno
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [genrePercentage, setGenrePercentage] = useState(0);
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [bestQuarter, setBestQuarter] = useState('');
  
  // Dados para gráficos
  const [genresData, setGenresData] = useState<{labels: string[], data: number[]}>({ labels: [], data: [] });
  const [monthlyLoansData, setMonthlyLoansData] = useState<{
    labels: string[], 
    borrowed: number[],
    completed: number[]
  }>({ 
    labels: [], 
    borrowed: [],
    completed: [] 
  });
  const [quarterlyData, setQuarterlyData] = useState<{labels: string[], data: number[]}>({ labels: [], data: [] });

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    const loadData = async () => {
      try {
        const data = await studentService.getStudentDashboardData(studentId);
        if (data) {
          setDashboardData(data);
          calculateMetrics(data.loans, data.books);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [studentId, navigate]);

  const calculateMetrics = (loansData: StudentLoan[], booksData: StudentBook[]) => {
    // Total de livros lidos (devolvidos)
    const completedLoans = loansData.filter(loan => loan.status === 'returned');
    setTotalBooksRead(completedLoans.length);

    // Calcular gênero favorito e dados para gráfico de pizza
    const genreCounts: { [key: string]: number } = {};
    let totalGenreReads = 0;

    loansData.forEach(loan => {
      const book = booksData.find(b => b.id === loan.bookId);
      if (book?.genres) {
        book.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenreReads++;
        });
      }
    });

    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    if (sortedGenres.length > 0) {
      setFavoriteGenre(sortedGenres[0][0]);
      const percentage = Math.round((sortedGenres[0][1] / totalGenreReads) * 100);
      setGenrePercentage(percentage);
      
      // Preparar dados para gráfico (top 5 gêneros)
      const topGenres = sortedGenres.slice(0, 5);
      setGenresData({
        labels: topGenres.map(([genre]) => genre),
        data: topGenres.map(([, count]) => count)
      });
    }

    // Empréstimos por mês (últimos 6 meses)
    const lastSixMonths = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        label: format(date, 'MMM/yy', { locale: ptBR }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    }).reverse();

    const monthlyLoans = lastSixMonths.map(month => {
      const borrowedCount = loansData.filter(loan => 
        isWithinInterval(loan.borrowDate, {
          start: month.startDate,
          end: month.endDate
        })
      ).length;

      let completedCount = 0;
      loansData.forEach(loan => {
        if (loan.status === 'returned' && 
            loan.returnDate && 
            isWithinInterval(loan.returnDate, {
              start: month.startDate,
              end: month.endDate
            })) {
          completedCount += 1;
        }
      });

      return { 
        label: month.label, 
        borrowed: borrowedCount,
        completed: completedCount 
      };
    });

    setMonthlyLoansData({
      labels: monthlyLoans.map(m => m.label),
      borrowed: monthlyLoans.map(m => m.borrowed),
      completed: monthlyLoans.map(m => m.completed)
    });

    // Determinar melhor trimestre
    const quarters = [
      { name: '1º Trimestre', months: [0, 1, 2] },
      { name: '2º Trimestre', months: [3, 4, 5] },
      { name: '3º Trimestre', months: [6, 7, 8] },
      { name: '4º Trimestre', months: [9, 10, 11] }
    ];

    const quarterCounts = quarters.map(quarter => {
      const count = loansData.filter(loan => {
        const month = loan.borrowDate.getMonth();
        return quarter.months.includes(month);
      }).length;

      return { name: quarter.name, count };
    });

    setQuarterlyData({
      labels: quarterCounts.map(q => q.name),
      data: quarterCounts.map(q => q.count)
    });

    const bestQ = quarterCounts.reduce((best, current) => 
      current.count > best.count ? current : best, 
      { name: '', count: -1 }
    );

    if (bestQ.count > 0) {
      setBestQuarter(bestQ.name);
    }

    // Calcular velocidade média de leitura (dias)
    if (completedLoans.length > 0) {
      const totalDays = completedLoans.reduce((sum, loan) => {
        if (loan.returnDate) {
          const diffTime = loan.returnDate.getTime() - loan.borrowDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);

      setReadingSpeed(Math.round(totalDays / completedLoans.length));
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando estatísticas...</p>
        </div>
        <BottomNavigation studentId={studentId || ''} activePage="stats" />
      </div>
    );
  }

  const loans = dashboardData?.loans || [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Estatísticas</h1>
          <p>Acompanhe seu progresso de leitura</p>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'aluno' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('aluno')}
        >
          Aluno
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'turma' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('turma')}
        >
          Turma
        </button>
      </div>

      {/* Content */}
      <main className={styles.main}>
        {activeTab === 'aluno' ? (
          <>
            {/* Cards de Estatísticas */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <BookOpen size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Livros Lidos</p>
                  <p className={styles.statValue}>{totalBooksRead}</p>
                  <p className={styles.statDescription}>Livros devolvidos</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Categoria Favorita</p>
                  <p className={styles.statValue}>{favoriteGenre || 'Nenhuma'}</p>
                  <p className={styles.statDescription}>{genrePercentage}% das leituras</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Clock size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Tempo Médio</p>
                  <p className={styles.statValue}>{readingSpeed > 0 ? `${readingSpeed} dias` : '--'}</p>
                  <p className={styles.statDescription}>Entre retirada e devolução</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Calendar size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Melhor Trimestre</p>
                  <p className={styles.statValue}>{bestQuarter || '--'}</p>
                  <p className={styles.statDescription}>Trimestre com mais retiradas</p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className={styles.chartsGrid}>
              {/* Evolução de Leitura */}
              <div className={styles.chartCard}>
                <h3>Evolução de Leitura</h3>
                {monthlyLoansData.labels.length > 0 ? (
                  <div className={styles.chartWrapper}>
                    <Line 
                      data={{
                        labels: monthlyLoansData.labels,
                        datasets: [
                          {
                            label: 'Livros retirados',
                            data: monthlyLoansData.borrowed,
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.3
                          },
                          {
                            label: 'Livros devolvidos',
                            data: monthlyLoansData.completed,
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.3
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: chartOptions.legendPosition,
                            labels: {
                              color: '#F8FAFC',
                              usePointStyle: true,
                              padding: chartOptions.padding,
                              font: {
                                size: chartOptions.fontSize
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: '#94A3B8',
                              font: {
                                size: chartOptions.fontSize
                              }
                            },
                            grid: {
                              color: 'rgba(148, 163, 184, 0.1)'
                            }
                          },
                          y: {
                            ticks: {
                              color: '#94A3B8',
                              font: {
                                size: chartOptions.fontSize
                              }
                            },
                            grid: {
                              color: 'rgba(148, 163, 184, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.noData}>Sem dados suficientes</div>
                )}
              </div>

              {/* Categorias Lidas */}
              <div className={styles.chartCard}>
                <h3>Categorias Lidas</h3>
                {genresData.labels.length > 0 ? (
                  <div className={styles.chartWrapper}>
                    <Pie 
                      data={{
                        labels: genresData.labels,
                        datasets: [
                          {
                            data: genresData.data,
                            backgroundColor: [
                              '#3B82F6',
                              '#10B981',
                              '#F59E0B',
                              '#EF4444',
                              '#8B5CF6'
                            ],
                            borderWidth: 0
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
                              color: '#F8FAFC',
                              usePointStyle: true,
                              padding: chartOptions.padding,
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
                  <div className={styles.noData}>Sem dados suficientes</div>
                )}
              </div>

              {/* Leitura por Trimestre */}
              <div className={styles.chartCard}>
                <h3>Leitura por Trimestre</h3>
                {quarterlyData.labels.length > 0 ? (
                  <div className={styles.chartWrapper}>
                    <Bar 
                      data={{
                        labels: quarterlyData.labels,
                        datasets: [
                          {
                            label: 'Livros por trimestre',
                            data: quarterlyData.data,
                            backgroundColor: '#10B981',
                            borderRadius: 8
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
                              color: '#94A3B8',
                              font: {
                                size: chartOptions.fontSize
                              }
                            },
                            grid: {
                              display: false
                            }
                          },
                          y: {
                            ticks: {
                              color: '#94A3B8',
                              font: {
                                size: chartOptions.fontSize
                              }
                            },
                            grid: {
                              color: 'rgba(148, 163, 184, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.noData}>Sem dados suficientes</div>
                )}
              </div>

              {/* Histórico de Empréstimos */}
              <div className={styles.chartCard}>
                <h3>Histórico de Empréstimos</h3>
                <div className={styles.loansTable}>
                  {loans.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Livro</th>
                          <th>Data</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.slice(0, 5).map(loan => (
                          <tr key={loan.id}>
                            <td className={styles.bookTitle}>{loan.bookTitle}</td>
                            <td>{format(loan.borrowDate, 'dd/MM/yy')}</td>
                            <td>
                              <span className={loan.status === 'returned' ? styles.statusReturned : styles.statusActive}>
                                {loan.status === 'returned' ? 'Devolvido' : 'Ativo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.noData}>Nenhum empréstimo encontrado</div>
                  )}
                  {loans.length > 5 && (
                    <p className={styles.moreLoans}>Exibindo 5 de {loans.length} empréstimos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card de Conquista */}
            <div className={styles.achievementCard}>
              <div className={styles.achievementIcon}>
                <Trophy size={40} />
              </div>
              <div className={styles.achievementContent}>
                <h3>Parabéns, Leitor!</h3>
                <p>Você está entre os 10% de leitores mais ativos</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {dashboardData?.student?.className ? (
              <ClassDashboard
                studentClassName={dashboardData.student.className}
                studentId={studentId || ''}
                currentUserId={dashboardData.student.userId}
              />
            ) : (
              <div className={styles.emptyState}>
                <Users size={48} />
                <h3>Informações da turma não disponíveis</h3>
                <p>Não foi possível carregar os dados da turma</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="stats" />
    </div>
  );
};

export default StudentStats;
