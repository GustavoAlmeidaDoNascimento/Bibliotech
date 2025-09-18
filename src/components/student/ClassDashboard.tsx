import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsiveChart } from '../../hooks/useResponsiveChart';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  BookOpenIcon, 
  TrophyIcon,
  UserGroupIcon 
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
}

const ClassDashboard: React.FC<ClassDashboardProps> = ({ studentClassName, studentId, currentUserId }) => {
  console.log('🏫 ClassDashboard renderizado com props:', { studentClassName, studentId, currentUserId });
  
  const { currentUser } = useAuth();
  const effectiveUserId = currentUserId || currentUser?.uid;
  const chartOptions = useResponsiveChart();
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🏫 Estado atual:', { loading, error, hasClassStats: !!classStats });
  console.log('🏫 effectiveUserId:', effectiveUserId);

  useEffect(() => {
    console.log('🏫 useEffect disparado - studentClassName:', studentClassName, 'effectiveUserId:', effectiveUserId);
    fetchClassStats();
  }, [studentClassName, effectiveUserId]);

  const fetchClassStats = async () => {
    console.log('🏫 Iniciando fetchClassStats...');
    console.log('📍 effectiveUserId:', effectiveUserId);
    console.log('📍 studentClassName:', studentClassName);
    
    if (!effectiveUserId || !studentClassName) {
      console.log('❌ Faltam dados básicos - effectiveUserId ou studentClassName');
      return;
    }

    try {
      setLoading(true);
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

      // Filtrar empréstimos dos alunos da turma
      const classLoans = allLoans.filter((loan: any) => studentIds.includes(loan.studentId));
      console.log('📚 Empréstimos da turma filtrados:', classLoans.length);
      console.log('📚 Primeiros 3 empréstimos da turma:', classLoans.slice(0, 3));

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
      const now = new Date();
      const totalLoans = classLoans.length;
      const activeLoans = classLoans.filter((loan: any) => !loan.returnedAt).length;
      const returnedLoans = classLoans.filter((loan: any) => loan.returnedAt).length;
      const overdueLoans = classLoans.filter((loan: any) => 
        !loan.returnedAt && new Date(loan.dueDate.toDate()) < now
      ).length;

      console.log('📊 Estatísticas calculadas:', {
        totalLoans,
        activeLoans,
        returnedLoans,
        overdueLoans
      });

      // Calcular estatísticas por gênero
      const genreStats: { [genre: string]: number } = {};
      classLoans.forEach((loan: any) => {
        const book = books.find((b: any) => b.id === loan.bookId);
        if (book && (book as any).genre) {
          const genre = (book as any).genre;
          genreStats[genre] = (genreStats[genre] || 0) + 1;
        }
      });

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

      // Calcular empréstimos por mês (últimos 6 meses)
      const monthlyStats: { [monthKey: string]: number } = {};
      const monthsToShow = 6;
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyStats[monthName] = 0;
      }

      classLoans.forEach((loan: any) => {
        if (loan.borrowedAt) {
          const loanDate = loan.borrowedAt.toDate();
          const monthName = loanDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          if (monthlyStats.hasOwnProperty(monthName)) {
            monthlyStats[monthName]++;
          }
        }
      });

      const monthlyLoans = Object.entries(monthlyStats).map(([month, count]) => ({
        month,
        count
      }));

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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando estatísticas da turma...</p>
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

  return (
    <div className={styles.classDashboard}>
      <div className={styles.header}>
        <h3>Dashboard da Turma {studentClassName}</h3>
        <p>Estatísticas e desempenho da sua turma</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#4285f4' }}>
            <BookOpenIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Total de Empréstimos</h4>
            <span className={styles.statValue}>{classStats.totalLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#10b981' }}>
            <BookOpenIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Empréstimos Ativos</h4>
            <span className={styles.statValue}>{classStats.activeLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f59e0b' }}>
            <BookOpenIcon />
          </div>
          <div className={styles.statContent}>
            <h4>Devolvidos</h4>
            <span className={styles.statValue}>{classStats.returnedLoans}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#ef4444' }}>
            <BookOpenIcon />
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
          {Object.keys(classStats.genreStats).length > 0 ? (
            <div className={styles.chart}>
              <Pie
                data={{
                  labels: Object.keys(classStats.genreStats),
                  datasets: [
                    {
                      data: Object.values(classStats.genreStats),
                      backgroundColor: [
                        '#4285f4', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
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
