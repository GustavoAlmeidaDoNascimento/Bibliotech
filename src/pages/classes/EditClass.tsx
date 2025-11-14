import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useEducationalLevels } from '../../contexts/EducationalLevelsContext';
import { ArrowLeftIcon, ChartBarIcon, TrophyIcon, BookOpenIcon, LockClosedIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import styles from './EditClass.module.css';
import { useFeatureBlock } from '../../hooks/useFeatureBlocks';
import { FEATURE_BLOCK_KEYS } from '../../config/planFeatures';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface Student {
  id: string;
  name: string;
  classroom: string;
  shift: string;
  contact: string;
  createdAt: any;
}

interface ClassInfo {
  name: string;
  shift: string;
  educationalLevelId?: string;
  studentsCount: number;
  students: Student[];
}

interface Loan {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookGenres?: string[];
  borrowDate: any;
  dueDate: any;
  returnDate?: any;
  status: 'active' | 'returned' | 'overdue';
}

interface Book {
  id: string;
  title: string;
  genres?: string[];
}

interface ClassStats {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  genreStats: { [genre: string]: number };
  studentRanking: Array<{ studentId: string; studentName: string; totalBooks: number }>;
  monthlyLoans: Array<{ month: string; count: number }>;
}

const EditClass: React.FC = () => {
  const { className, shift } = useParams<{ className: string; shift: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { levels, getLevelById } = useEducationalLevels();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const classDashboardFeature = useFeatureBlock(FEATURE_BLOCK_KEYS.BlockClassDashboard);

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    shift: '',
    educationalLevelId: ''
  });

  // Função para buscar dados da turma e alunos
  const fetchClassData = useCallback(async () => {
    if (!currentUser || !className || !shift) return;

    try {
      setLoading(true);
      setError('');

      // Buscar todos os alunos
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const allStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      // Filtrar alunos da turma específica
      const decodedClassName = decodeURIComponent(className);
      const decodedShift = decodeURIComponent(shift);
      
      const classStudents = allStudents.filter(student => 
        student.classroom === decodedClassName && 
        (student.shift || 'Não informado') === decodedShift
      );

      if (classStudents.length === 0) {
        setError('Turma não encontrada ou não possui alunos');
        return;
      }

      // Buscar dados da turma na coleção classes (se existir)
      let educationalLevelId = '';
      try {
        const classesRef = collection(db, `users/${currentUser.uid}/classes`);
        const classQuery = query(classesRef);
        const classesSnapshot = await getDocs(classQuery);
        
        const existingClass = classesSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.name === decodedClassName && data.shift === decodedShift;
        });
        
        if (existingClass) {
          educationalLevelId = existingClass.data().educationalLevelId || '';
        }
      } catch (error) {
        console.log('Erro ao buscar dados da turma:', error);
      }

      const classData: ClassInfo = {
        name: decodedClassName,
        shift: decodedShift,
        educationalLevelId,
        studentsCount: classStudents.length,
        students: classStudents
      };

      setClassInfo(classData);
      setFormData({
        name: decodedClassName,
        shift: decodedShift,
        educationalLevelId
      });

    } catch (err) {
      console.error('Erro ao buscar dados da turma:', err);
      setError('Erro ao carregar dados da turma');
    } finally {
      setLoading(false);
    }
  }, [currentUser, className, shift]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // Função para buscar estatísticas da turma
  const fetchClassStats = useCallback(async () => {
    if (!currentUser || !classInfo) return;

    try {
      setLoadingStats(true);

      // Buscar todos os empréstimos dos alunos da turma
      const studentIds = classInfo.students.map(s => s.id);
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      
      const allLoans = loansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Loan[];

      // Filtrar empréstimos dos alunos da turma
      const classLoans = allLoans.filter(loan => studentIds.includes(loan.studentId));

      // Buscar detalhes dos livros para obter gêneros
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const booksSnapshot = await getDocs(booksRef);
      const books = booksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];

      // Criar mapa de livros para acesso rápido
      const booksMap = books.reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {} as { [key: string]: Book });

      // Calcular estatísticas
      const stats: ClassStats = {
        totalLoans: classLoans.length,
        activeLoans: classLoans.filter(loan => !loan.returnDate).length,
        returnedLoans: classLoans.filter(loan => loan.returnDate).length,
        overdueLoans: classLoans.filter(loan => {
          if (loan.returnDate) return false;
          const dueDate = loan.dueDate?.toDate ? loan.dueDate.toDate() : new Date(loan.dueDate);
          return dueDate < new Date();
        }).length,
        genreStats: {},
        studentRanking: [],
        monthlyLoans: []
      };

      // Calcular estatísticas por gênero
      classLoans.forEach(loan => {
        const book = booksMap[loan.bookId];
        if (book?.genres) {
          book.genres.forEach(genre => {
            stats.genreStats[genre] = (stats.genreStats[genre] || 0) + 1;
          });
        }
      });

      // Calcular ranking de alunos
      const studentLoanCounts = classInfo.students.map(student => {
        const studentLoans = classLoans.filter(loan => loan.studentId === student.id);
        return {
          studentId: student.id,
          studentName: student.name,
          totalBooks: studentLoans.length
        };
      }).sort((a, b) => b.totalBooks - a.totalBooks);

      stats.studentRanking = studentLoanCounts;

      // Calcular empréstimos por mês (últimos 6 meses)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData: { [key: string]: number } = {};
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[monthKey] = 0;
      }

      classLoans.forEach(loan => {
        const borrowDate = loan.borrowDate?.toDate ? loan.borrowDate.toDate() : new Date(loan.borrowDate);
        const monthKey = `${monthNames[borrowDate.getMonth()]} ${borrowDate.getFullYear()}`;
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      });

      stats.monthlyLoans = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));

      setClassStats(stats);

    } catch (err) {
      console.error('Erro ao buscar estatísticas da turma:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [currentUser, classInfo]);

  useEffect(() => {
    if (!classInfo) {
      return;
    }

    if (classDashboardFeature.loading) {
      return;
    }

    if (classDashboardFeature.isBlocked) {
      setClassStats(null);
      setLoadingStats(false);
      return;
    }

      fetchClassStats();
  }, [classInfo, fetchClassStats, classDashboardFeature.loading, classDashboardFeature.isBlocked]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome da turma é obrigatório');
      return;
    }

    if (!currentUser || !classInfo) {
      setError('Dados da turma não carregados');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Atualizar todos os alunos da turma
      const updatePromises = classInfo.students.map(async (student) => {
        const studentRef = doc(db, `users/${currentUser.uid}/students/${student.id}`);
        return updateDoc(studentRef, {
          classroom: formData.name.trim(),
          shift: formData.shift || 'Não informado',
          educationalLevelId: formData.educationalLevelId || '',
          updatedAt: serverTimestamp()
        });
      });

      // Salvar/atualizar dados da turma na coleção classes
      const classId = `${formData.name.trim()}_${formData.shift || 'Não informado'}`.replace(/[^a-zA-Z0-9]/g, '_');
      const classRef = doc(db, `users/${currentUser.uid}/classes/${classId}`);
      const classData = {
        name: formData.name.trim(),
        shift: formData.shift || 'Não informado',
        educationalLevelId: formData.educationalLevelId || '',
        studentsCount: classInfo.students.length,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // Será ignorado se o documento já existir
      };
      
      const classUpdatePromise = setDoc(classRef, classData, { merge: true });

      await Promise.all([...updatePromises, classUpdatePromise]);

      setSuccess('Turma atualizada com sucesso!');
      
      // Atualizar dados locais
      setClassInfo(prev => prev ? {
        ...prev,
        name: formData.name.trim(),
        shift: formData.shift || 'Não informado',
        educationalLevelId: formData.educationalLevelId || ''
      } : null);

      // Não redirecionar mais automaticamente - usuário permanece na página

    } catch (err) {
      console.error('Erro ao atualizar turma:', err);
      setError('Erro ao atualizar turma. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };


  const handleStudentClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Carregando dados da turma...</p>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Turma não encontrada</h3>
          <p>A turma solicitada não foi encontrada ou não possui alunos.</p>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/classes')}
          >
            <ArrowLeftIcon className={styles.buttonIcon} />
            Voltar para Turmas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/classes')}
        >
          <ArrowLeftIcon className={styles.buttonIcon} />
          Voltar
        </button>
        <h2>Editar Turma</h2>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="className">Nome da Turma:</label>
                <input
                  type="text"
                  id="className"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: 1º Ano A, 2º Ano B..."
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="classShift">Turno:</label>
                <select
                  id="classShift"
                  value={formData.shift}
                  onChange={(e) => handleInputChange('shift', e.target.value)}
                  className={styles.selectField}
                >
                  <option value="">Não informado</option>
                  <option value="manhã">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                  <option value="integral">Integral</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="educationalLevel">Nível Educacional:</label>
                <select
                  id="educationalLevel"
                  value={formData.educationalLevelId}
                  onChange={(e) => handleInputChange('educationalLevelId', e.target.value)}
                  className={styles.selectField}
                >
                  <option value="">Selecione um nível</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name} {level.abbreviation && `(${level.abbreviation})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => navigate('/classes')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <div className={styles.studentsSection}>
          <h3>Alunos da Turma ({classInfo.studentsCount})</h3>
          <div className={styles.studentsList}>
            {classInfo.students.length === 0 ? (
              <p className={styles.noStudents}>Nenhum aluno encontrado nesta turma.</p>
            ) : (
              <div className={styles.studentsGrid}>
                {classInfo.students.map(student => (
                  <div 
                    key={student.id} 
                    className={styles.studentCard}
                    onClick={() => handleStudentClick(student.id)}
                  >
                    <div className={styles.studentInfo}>
                      <h4>{student.name}</h4>
                      <p>Contato: {student.contact || 'Não informado'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard da Turma */}
        <div className={styles.dashboardSection}>
          <h3>
            <ChartBarIcon className={styles.sectionIcon} />
            Dashboard da Turma
          </h3>
          
          {classDashboardFeature.loading ? (
            <div className={styles.loadingStats}>
              <p>Verificando permissões do plano...</p>
            </div>
          ) : classDashboardFeature.isBlocked ? (
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
                      Plano atual:{' '}
                      {classDashboardFeature.planDisplayName.includes('Básico') ? (
                        <>
                          Plano <span className={styles.planNameHighlight}>Básico</span>
                        </>
                      ) : (
                        classDashboardFeature.planDisplayName
                      )}
                    </span>
                    <h4>Estatísticas da turma disponíveis no plano Intermediário</h4>
                  </div>
                </div>
                <p className={styles.featureBlockDescription}>
                  Faça o upgrade para o Bibliotech Intermediário pra conhecer todas as turmas como a palma da sua mão.
                </p>
                <ul className={styles.featureBlockHighlights}>
                  <li>Acompanhe métricas e gráficos sobre suas turmas em tempo real</li>
                  <li>Visualize rankings completos e gráficos prontos para reuniões</li>
                  <li>Economize tempo com insights automáticos sobre o engajamento da turma</li>
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
          ) : loadingStats ? (
            <div className={styles.loadingStats}>
              <p>Carregando estatísticas...</p>
            </div>
          ) : classStats ? (
            <div className={styles.dashboardGrid}>
              {/* Cards de Estatísticas */}
              <div className={styles.statsCards}>
                <div className={styles.statsCard}>
                  <div className={styles.statsCardIcon}>
                    <BookOpenIcon className={styles.cardIcon} />
                  </div>
                  <div className={styles.statsCardContent}>
                    <h4>Total de Empréstimos</h4>
                    <p className={styles.statsNumber}>{classStats.totalLoans}</p>
                  </div>
                </div>
                
                <div className={styles.statsCard}>
                  <div className={styles.statsCardIcon} style={{backgroundColor: '#10b981'}}>
                    <BookOpenIcon className={styles.cardIcon} />
                  </div>
                  <div className={styles.statsCardContent}>
                    <h4>Empréstimos Ativos</h4>
                    <p className={styles.statsNumber}>{classStats.activeLoans}</p>
                  </div>
                </div>
                
                <div className={styles.statsCard}>
                  <div className={styles.statsCardIcon} style={{backgroundColor: '#f59e0b'}}>
                    <BookOpenIcon className={styles.cardIcon} />
                  </div>
                  <div className={styles.statsCardContent}>
                    <h4>Devolvidos</h4>
                    <p className={styles.statsNumber}>{classStats.returnedLoans}</p>
                  </div>
                </div>
                
                <div className={styles.statsCard}>
                  <div className={styles.statsCardIcon} style={{backgroundColor: '#ef4444'}}>
                    <BookOpenIcon className={styles.cardIcon} />
                  </div>
                  <div className={styles.statsCardContent}>
                    <h4>Em Atraso</h4>
                    <p className={styles.statsNumber}>{classStats.overdueLoans}</p>
                  </div>
                </div>
              </div>

              {/* Gráfico de Pizza - Empréstimos por Gênero */}
              <div className={styles.chartContainer}>
                <h4>Empréstimos por Gênero</h4>
                {Object.keys(classStats.genreStats).length > 0 ? (
                  <div className={styles.pieChartWrapper}>
                    <Pie
                      data={{
                        labels: Object.keys(classStats.genreStats),
                        datasets: [
                          {
                            data: Object.values(classStats.genreStats),
                            backgroundColor: [
                              '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                              '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
                            ],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true
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
                  <p className={styles.noData}>Nenhum empréstimo encontrado para esta turma.</p>
                )}
              </div>

              {/* Ranking de Alunos */}
              <div className={styles.rankingContainer}>
                <h4>
                  <TrophyIcon className={styles.sectionIcon} />
                  Ranking de Leitores
                </h4>
                {classStats.studentRanking.length > 0 ? (
                  <div className={styles.rankingList}>
                    {classStats.studentRanking.slice(0, 5).map((student, index) => (
                      <div 
                        key={student.studentId} 
                        className={styles.rankingItem}
                        onClick={() => handleStudentClick(student.studentId)}
                      >
                        <div className={styles.rankingPosition}>
                          <span className={`${styles.positionBadge} ${index < 3 ? styles.topThree : ''}`}>
                            {index + 1}º
                          </span>
                        </div>
                        <div className={styles.rankingInfo}>
                          <span className={styles.studentName}>{student.studentName}</span>
                          <span className={styles.bookCount}>
                            {student.totalBooks} {student.totalBooks === 1 ? 'livro' : 'livros'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noData}>Nenhum empréstimo registrado ainda.</p>
                )}
              </div>

              {/* Gráfico de Barras - Empréstimos por Mês */}
              <div className={styles.chartContainer}>
                <h4>Empréstimos por Mês (Últimos 6 meses)</h4>
                <div className={styles.barChartWrapper}>
                  <Bar
                    data={{
                      labels: classStats.monthlyLoans.map(item => item.month),
                      datasets: [
                        {
                          label: 'Empréstimos',
                          data: classStats.monthlyLoans.map(item => item.count),
                          backgroundColor: '#3b82f6',
                          borderColor: '#1d4ed8',
                          borderWidth: 1,
                          borderRadius: 4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.parsed.y} empréstimos`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noData}>
              <p>Não foi possível carregar as estatísticas da turma.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditClass;
