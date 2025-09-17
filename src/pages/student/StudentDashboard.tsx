import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { studentService, StudentDashboardData, StudentLoan, StudentBook } from '../../services/studentService';
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
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import styles from './StudentDashboard.module.css';

// Registrando os componentes necessários do Chart.js
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

type TabType = 'pessoal' | 'turma' | 'recomendacoes';

const StudentDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pessoal');
  const { execute: executeLoadDashboard, isLoading, error } = useAsync<StudentDashboardData | null>();
  
  // Dados processados para gráficos
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
  
  // Métricas calculadas
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [bestQuarter, setBestQuarter] = useState('');

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }
    
    const loadDashboardData = async () => {
      try {
        const data = await executeLoadDashboard(() => 
          studentService.getStudentDashboardData(studentId)
        );
        
        if (data) {
          setDashboardData(data);
          // Processar dados para visualizações
          processData(data.loans, data.books);
        } else {
          navigate('/student-id-input');
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        // Não redirecionar automaticamente para permitir que o usuário veja o erro
      }
    };

    loadDashboardData();
  }, [studentId, navigate, executeLoadDashboard]);
  
  const processData = (loansData: StudentLoan[], booksData: StudentBook[]) => {
    if (loansData.length === 0) return;
    
    // total de livros lidos (só os devolvidos)
    const completedLoans = loansData.filter(loan => loan.status === 'returned');
    setTotalBooksRead(completedLoans.length);
    
    // calcula gêneros mais lidos
    const genreCounts: {[key: string]: number} = {};
    
    loansData.forEach(loan => {
      const book = booksData.find(b => b.id === loan.bookId);
      
      if (book?.genres) {
        book.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    // ordena gêneros por popularidade
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5 gêneros
    
    if (sortedGenres.length > 0) {
      setFavoriteGenre(sortedGenres[0][0]);
      
      setGenresData({
        labels: sortedGenres.map(([genre]) => genre),
        data: sortedGenres.map(([, count]) => count)
      });
    }
    
    // empréstimos por mês (últimos 6 meses)
    const lastSixMonths = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        label: format(date, 'MMM/yyyy', { locale: ptBR }),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    }).reverse();
    
    const monthlyLoans = lastSixMonths.map(month => {
      // todos os empréstimos realizados no mês
      const borrowedCount = loansData.filter(loan => 
        isWithinInterval(loan.borrowDate, {
          start: month.startDate,
          end: month.endDate
        })
      ).length;
      
      // calculando livros lidos no mês
      // se um livro tem readPercentage, usa esse valor, senão verifica se completed
      let completedCount = 0;
      
      loansData.forEach(loan => {
        if (loan.status === 'returned' && 
            loan.returnDate && 
            isWithinInterval(loan.returnDate, {
              start: month.startDate,
              end: month.endDate
            })) {
          if (loan.readPercentage !== undefined) {
            // se tiver percentual de leitura, soma o valor proporcional
            completedCount += (loan.readPercentage / 100);
          } else if (loan.completed) {
            // se não tiver percentual mas estiver marcado como completo, soma 1
            completedCount += 1;
          } else {
            // padrão: se foi devolvido mas sem indicação, considera 50%
            completedCount += 0.5;
          }
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
    
    // Determinar em qual trimestre o estudante leu mais
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
    
    // Determinar o melhor trimestre
    const bestQ = quarterCounts.reduce((best, current) => 
      current.count > best.count ? current : best, 
      { name: '', count: -1 }
    );
    
    if (bestQ.count > 0) {
      setBestQuarter(bestQ.name);
    }
    
    // calcula velocidade média de leitura (dias)
    if (completedLoans.length > 0) {
      const totalDays = completedLoans.reduce((sum, loan) => {
        if (loan.returnDate) {
          // diferença em dias entre empréstimo e devolução
          const diffTime = loan.returnDate.getTime() - loan.borrowDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      
      setReadingSpeed(Math.round(totalDays / completedLoans.length));
    }
  };
  
  const handleGoBack = () => {
    navigate('/student-id-input');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const tabs = [
    { id: 'pessoal' as TabType, label: 'Pessoal', icon: '👤' },
    { id: 'turma' as TabType, label: 'Turma', icon: '👥' },
    { id: 'recomendacoes' as TabType, label: 'Recomendações', icon: '⭐' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pessoal':
        return renderPessoalContent();
      case 'turma':
        return (
          <div className={styles.tabContentPlaceholder}>
            <div className={styles.placeholderIcon}>👥</div>
            <h3>Dashboard da Turma</h3>
            <p>Em desenvolvimento...</p>
            <p>Aqui aparecerão estatísticas e informações sobre a turma {student?.className}</p>
          </div>
        );
      case 'recomendacoes':
        return (
          <div className={styles.tabContentPlaceholder}>
            <div className={styles.placeholderIcon}>⭐</div>
            <h3>Recomendações</h3>
            <p>Em desenvolvimento...</p>
            <p>Aqui aparecerão recomendações personalizadas de livros</p>
          </div>
        );
      default:
        return renderPessoalContent();
    }
  };

  const renderPessoalContent = () => {
    if (loans.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <AcademicCapIcon />
          </div>
          <h3>Você ainda não possui histórico de leitura</h3>
          <p>Quando você começar a retirar livros na biblioteca, seus dados aparecerão aqui.</p>
          <div className={styles.emptyActions}>
            <button onClick={handleGoToLogin} className={styles.primaryButton}>
              Área do Bibliotecário
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total de Livros Lidos</h3>
            <div className={styles.value}>{totalBooksRead}</div>
            <p>Livros devolvidos até o momento</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Categoria Favorita</h3>
            <div className={styles.value}>{favoriteGenre || "Não definido"}</div>
            <p>Categoria mais lida por você</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Tempo Médio de Leitura</h3>
            <div className={styles.value}>
              {readingSpeed > 0 
                ? `${readingSpeed} dias`
                : "Não disponível"}
            </div>
            <p>Tempo médio entre retirada e devolução</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Melhor Trimestre</h3>
            <div className={styles.value}>{bestQuarter || "Não definido"}</div>
            <p>Trimestre com mais retiradas</p>
          </div>
        </div>
        
        <div className={styles.chartGrid}>
          <div className={styles.chartCard}>
            <h3>Evolução de Leitura</h3>
            {monthlyLoansData.labels.length > 0 ? (
              <div className={styles.chart}>
                <Line 
                  data={{
                    labels: monthlyLoansData.labels,
                    datasets: [
                      {
                        label: 'Livros retirados por mês',
                        data: monthlyLoansData.borrowed,
                        borderColor: '#4a90e2',
                        backgroundColor: 'rgba(74, 144, 226, 0.5)',
                        tension: 0.3
                      },
                      {
                        label: 'Livros lidos por mês',
                        data: monthlyLoansData.completed,
                        borderColor: '#50c878',
                        backgroundColor: 'rgba(80, 200, 120, 0.5)',
                        tension: 0.3
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          title: function(context) {
                            return context[0].label;
                          },
                          afterTitle: function(context) {
                            const datasetIndex = context[0].datasetIndex;
                            const index = context[0].dataIndex;
                            const value = context[0].parsed.y;
                            
                            if (datasetIndex === 1) { // Livros lidos
                              const otherDataset = context[0].chart.data.datasets[0];
                              const borrowedValue = otherDataset.data[index];
                              
                              if (typeof borrowedValue === 'number' && typeof value === 'number' && borrowedValue > 0) {
                                const percentage = Math.round((value / borrowedValue) * 100);
                                return `Taxa de conclusão: ${percentage}%`;
                              }
                            }
                            return '';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className={styles.noData}>Dados insuficientes</div>
            )}
          </div>
          
          <div className={styles.chartCard}>
            <h3>Categorias Lidas</h3>
            {genresData.labels.length > 0 ? (
              <div className={styles.chart}>
                <Pie 
                  data={{
                    labels: genresData.labels,
                    datasets: [
                      {
                        data: genresData.data,
                        backgroundColor: [
                          '#4a90e2',
                          '#50c878',
                          '#f78fb3',
                          '#f5cd79',
                          '#778beb'
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
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className={styles.noData}>Dados insuficientes</div>
            )}
          </div>
          
          <div className={styles.chartCard}>
            <h3>Leitura por Trimestre</h3>
            {quarterlyData.labels.length > 0 ? (
              <div className={styles.chart}>
                <Bar 
                  data={{
                    labels: quarterlyData.labels,
                    datasets: [
                      {
                        label: 'Livros por trimestre',
                        data: quarterlyData.data,
                        backgroundColor: '#50c878',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className={styles.noData}>Dados insuficientes</div>
            )}
          </div>
          
          <div className={styles.chartCard}>
            <h3>Histórico de Empréstimos</h3>
            <div className={styles.loansList}>
              <table className={styles.loansTable}>
                <thead>
                  <tr>
                    <th>Livro</th>
                    <th>Data Retirada</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.slice(0, 5).map(loan => (
                    <tr key={loan.id}>
                      <td>{loan.bookTitle}</td>
                      <td>{format(loan.borrowDate, 'dd/MM/yyyy')}</td>
                      <td className={loan.status === 'returned' ? styles.returned : styles.active}>
                        {loan.status === 'returned' ? 'Devolvido' : 'Ativo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loans.length > 5 && (
                <p className={styles.moreLoans}>Exibindo 5 dos {loans.length} empréstimos</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error || !dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Ops! Algo deu errado</h2>
          <p>{error || 'Não conseguimos carregar seus dados.'}</p>
          <div className={styles.errorActions}>
            <button onClick={handleGoBack} className={styles.secondaryButton}>
              Tentar novamente
            </button>
            <button onClick={handleGoToLogin} className={styles.primaryButton}>
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { student, loans } = dashboardData;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleGoBack}
          type="button"
          aria-label="Voltar"
        >
          <ArrowLeftIcon className={styles.backIcon} />
          <span>Voltar</span>
        </button>

        <div className={styles.studentHeader}>
          <div className={styles.studentIcon}>
            <AcademicCapIcon />
          </div>
          <div className={styles.studentInfo}>
            <h1 className={styles.studentName}>Olá, {student.name}!</h1>
            <p className={styles.studentDetails}>
              Turma: {student.className || 'Não informada'} • ID: {student.id}
            </p>
          </div>
        </div>
      </div>
      
      {/* Sistema de Abas */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsWrapper}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Indicador da aba ativa */}
        <div 
          className={styles.tabIndicator}
          style={{
            transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`
          }}
        />
      </div>

      {/* Conteúdo das Abas */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>

      <div className={styles.footer}>
        <button onClick={handleGoToLogin} className={styles.footerButton}>
          Área do Bibliotecário
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;
