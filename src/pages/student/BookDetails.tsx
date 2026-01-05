import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Tag, Clock, Heart, CheckCircle, X } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { studentService } from '../../services/studentService';
import { reservationService, Reservation } from '../../services/reservationService';
import { inferTierFromPlanValue, formatPlanDisplayName } from '../../services/subscriptionService';
import FeatureBlock from '../../components/ui/FeatureBlock';
import styles from './BookDetails.module.css';

interface BookWithGenres {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  tags: string[];
  genres?: string[];
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  userId: string;
  description?: string;
  synopsis?: string;
  coverUrl?: string;
  createdAt: any;
  updatedAt: any;
}

const BookDetails: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  const [book, setBook] = useState<BookWithGenres | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAlreadyReserved, setIsAlreadyReserved] = useState(false);
  const [reservationStatus, setReservationStatus] = useState<'pending' | 'ready' | 'completed' | 'cancelled' | 'expired' | null>(null);
  const [allCopiesReserved, setAllCopiesReserved] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [showFeatureBlock, setShowFeatureBlock] = useState(false);

  useEffect(() => {
    if (!studentId || !bookId) {
      navigate(`/student-dashboard/${studentId}/home`);
      return;
    }

    const loadBookDetails = async () => {
      try {
        // Buscar dados do aluno para obter schoolId
        const student = await studentService.findStudentById(studentId);
        if (!student) {
          console.error('Aluno não encontrado');
          setError('Aluno não encontrado');
          setLoading(false);
          return;
        }

        // Buscar plano da escola
        const plan = await studentService.getSchoolSubscriptionPlan(student.userId);
        setSubscriptionPlan(plan);

        // Buscar detalhes do livro
        const bookData = await studentService.getBookById(bookId, student.userId);
        if (bookData) {
          setBook(bookData);
          
          // Verificar se o aluno já reservou este livro
          const reservedByStudent = await checkIfBookIsReserved(studentId, bookId, student.userId);
          
          // CORREÇÃO: Verificar se todas as cópias foram RESERVADAS (não emprestadas)
          // CASO 1: Livro emprestado → verificar vagas na fila de espera
          // CASO 2: Livro não emprestado → verificar se todas as cópias foram reservadas
          if (!reservedByStudent) {
            try {
              // Verificar se o livro está emprestado (retirado)
              const activeLoans = await studentService.getActiveLoansByBook(bookId, student.userId);
              const isLoaned = activeLoans.length > 0;
              
              // Buscar reservas ativas
              const activeReservations = await reservationService.getActiveReservationsByBook(
                student.userId,
                bookId
              );
              const readyReservations = activeReservations.filter(
                res => res.status === 'ready' && res.studentId !== studentId
              );
              const pendingReservations = activeReservations.filter(
                res => res.status === 'pending' && res.studentId !== studentId
              );
              
              // CASO 1: Livro emprestado - verificar se há vagas na fila de espera
              if (isLoaned) {
                // Cada cópia emprestada pode ter 1 reserva 'pending' (fila de espera)
                // Se já tem reservas 'pending' >= empréstimos ativos, não permite mais reservas
                if (pendingReservations.length >= activeLoans.length) {
                  setAllCopiesReserved(true);
                }
              }
              // CASO 2: Livro não emprestado - verificar se todas as cópias foram reservadas
              else if (bookData.availableCopies > 0) {
                // Verificar se todas as cópias disponíveis já foram reservadas por outros alunos
                if (readyReservations.length >= bookData.availableCopies) {
                  setAllCopiesReserved(true);
                }
              }
            } catch (reservationError) {
              console.error('Erro ao verificar reservas/empréstimos:', reservationError);
            }
          }
        } else {
          setError('Livro não encontrado');
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do livro:', error);
        setError('Erro ao carregar detalhes do livro');
      } finally {
        setLoading(false);
      }
    };

    const checkIfBookIsReserved = async (studentId: string, bookId: string, schoolId: string): Promise<boolean> => {
      try {
        console.log('🔍 Verificando se o livro já foi reservado pelo aluno:', { studentId, bookId });
        
        // Buscar reservas do aluno usando a nova função que tenta ambas as coleções
        const reservations = await reservationService.getStudentReservations(studentId, schoolId);
        
        // Verificar se existe uma reserva para este livro
        const existingReservation = reservations.find(reservation => reservation.bookId === bookId);
        
        if (existingReservation) {
          console.log('✅ Livro já reservado pelo aluno:', existingReservation);
          setIsAlreadyReserved(true);
          setReservationStatus(existingReservation.status);
          return true;
        } else {
          console.log('📚 Livro não foi reservado pelo aluno ainda');
          setIsAlreadyReserved(false);
          setReservationStatus(null);
          return false;
        }
      } catch (error) {
        console.error('Erro ao verificar reservas do aluno:', error);
        // Em caso de erro, assumir que não foi reservado para não bloquear o usuário
        setIsAlreadyReserved(false);
        setReservationStatus(null);
        return false;
      }
    };

    loadBookDetails();
  }, [studentId, bookId, navigate]);

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/home`);
  };

  const planTier = useMemo(
    () => inferTierFromPlanValue(subscriptionPlan ?? null),
    [subscriptionPlan]
  );

  const isReservationsBlocked = useMemo(
    () => planTier === 'basic' || planTier === 'intermediate' || planTier === 'unknown',
    [planTier]
  );

  const planDisplayName = useMemo(
    () => formatPlanDisplayName(subscriptionPlan ?? null),
    [subscriptionPlan]
  );

  const handleReserve = () => {
    if (isAlreadyReserved) {
      console.log('⚠️ Tentativa de reservar livro já reservado bloqueada');
      return;
    }
    if (allCopiesReserved) {
      console.log('⚠️ Todas as cópias já foram reservadas');
      return;
    }
    // Se o plano não permite reservas, mostrar o feature blocker
    if (isReservationsBlocked) {
      console.log('⚠️ Tentativa de reservar livro bloqueada pelo plano');
      setShowFeatureBlock(true);
      // Scroll suave para o feature blocker
      setTimeout(() => {
        const featureBlock = document.querySelector(`.${styles.featureBlockWrapper}`);
        if (featureBlock) {
          featureBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    navigate(`/student-dashboard/${studentId}/reserve/${bookId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Header Skeleton */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.backButtonSkeleton}></div>
            <div className={styles.headerTitleSkeleton}></div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className={styles.main}>
          <div className={styles.bookContainer}>
            {/* Cover Section Skeleton */}
            <div className={styles.coverSection}>
              <div className={styles.bookCoverSkeleton}></div>
            </div>

            {/* Book Info Skeleton */}
            <div className={styles.bookInfo}>
              {/* Title Skeleton */}
              <div className={styles.bookTitleSkeleton}></div>
              
              {/* Author Skeleton */}
              <div className={styles.bookAuthorSkeleton}></div>

              {/* Genres Section Skeleton */}
              <div className={styles.tagsSection}>
                <div className={styles.sectionTitleSkeleton}></div>
                <div className={styles.tagsListSkeleton}>
                  <div className={styles.tagSkeleton}></div>
                  <div className={styles.tagSkeleton}></div>
                </div>
              </div>

              {/* Synopsis Section Skeleton */}
              <div className={styles.synopsisSection}>
                <div className={styles.sectionTitleSkeleton}></div>
                <div className={styles.synopsisSkeleton}>
                  <div className={styles.synopsisLineSkeleton}></div>
                  <div className={styles.synopsisLineSkeleton}></div>
                  <div className={styles.synopsisLineSkeleton}></div>
                  <div className={styles.synopsisLineSkeletonShort}></div>
                </div>
              </div>

              {/* Stats Section Skeleton */}
              <div className={styles.statsSection}>
                <div className={styles.sectionTitleSkeleton}></div>
                <div className={styles.statsListSkeleton}>
                  <div className={styles.statItemSkeleton}>
                    <div className={styles.statLabelSkeleton}></div>
                    <div className={styles.statValueSkeleton}></div>
                  </div>
                  <div className={styles.statItemSkeleton}>
                    <div className={styles.statLabelSkeleton}></div>
                    <div className={styles.statValueSkeleton}></div>
                  </div>
                  <div className={styles.statItemSkeleton}>
                    <div className={styles.statLabelSkeleton}></div>
                    <div className={styles.statValueSkeleton}></div>
                  </div>
                </div>
              </div>

              {/* Reserve Button Skeleton */}
              <div className={styles.reserveButtonSkeleton}></div>

              {/* Reserve Info Skeleton */}
              <div className={styles.reserveInfoSkeleton}>
                <div className={styles.reserveInfoLineSkeleton}></div>
                <div className={styles.reserveInfoLineSkeletonShort}></div>
              </div>
            </div>
          </div>
        </main>

        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <h1>Erro</h1>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <BookOpen size={64} className={styles.errorIcon} />
            <h2>Livro não encontrado</h2>
            <p>{error || 'O livro solicitado não foi encontrado.'}</p>
            <button onClick={handleBack} className={styles.backToHomeButton}>
              Voltar ao Início
            </button>
          </div>
        </main>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1>Detalhes do Livro</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.bookContainer}>
          {/* Cover Section */}
          <div className={styles.coverSection}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <BookOpen size={64} />
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className={styles.bookInfo}>
            <h2 className={styles.bookTitle}>{book.title}</h2>
            <p className={styles.bookAuthor}>
              <User size={16} />
              {book.author || 'Autor não informado'}
            </p>

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <div className={styles.tagsSection}>
                <h3>
                  <Tag size={16} />
                  Gêneros
                </h3>
                <div className={styles.tagsList}>
                  {book.genres.map((genre, index) => (
                    <span key={index} className={styles.tag}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {book.synopsis && (
              <div className={styles.synopsisSection}>
                <h3>
                  <BookOpen size={16} />
                  Sinopse
                </h3>
                <p className={styles.synopsis}>{book.synopsis}</p>
              </div>
            )}

            {/* Book Stats */}
            <div className={styles.statsSection}>
              <h3>
                <Clock size={16} />
                Informações
              </h3>
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Disponível:</span>
                  <span className={styles.statValue}>
                    {book.available ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Cópias totais:</span>
                  <span className={styles.statValue}>{book.totalCopies}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Cópias disponíveis:</span>
                  <span className={styles.statValue}>{book.availableCopies}</span>
                </div>
              </div>
            </div>

            {/* Reserve Button */}
            <button 
              onClick={handleReserve}
              className={`${styles.reserveButton} ${isAlreadyReserved || allCopiesReserved ? styles.reserveButtonDisabled : ''}`}
              disabled={isAlreadyReserved || allCopiesReserved}
            >
              {isAlreadyReserved ? (
                <>
                  <CheckCircle size={20} />
                  Você já reservou esse livro
                </>
              ) : allCopiesReserved ? (
                <>
                  <X size={20} />
                  Todas as cópias reservadas
                </>
              ) : (
                <>
                  <Heart size={20} />
                  {book.availableCopies > 0 ? 'Reservar para mim' : 'Entrar na fila de espera'}
                </>
              )}
            </button>

            <div className={styles.reserveInfo}>
              {isAlreadyReserved ? (
                <div className={styles.alreadyReservedInfo}>
                  <p className={styles.alreadyReservedMessage}>
                    ✅ <strong>Você já possui uma reserva para este livro!</strong><br/>
                    Status: {reservationStatus === 'ready' ? 'Pronto para retirada' : 
                             reservationStatus === 'pending' ? 'Aguardando disponibilidade' : 
                             reservationStatus === 'completed' ? 'Retirado' : 
                             reservationStatus === 'cancelled' ? 'Cancelado' :
                             reservationStatus === 'expired' ? 'Expirado' : 'Status desconhecido'}
                  </p>
                  <p className={styles.alreadyReservedDetails}>
                    Acesse "Meus Livros Reservados" para acompanhar o status da sua reserva.
                  </p>
                </div>
              ) : allCopiesReserved ? (
                <div className={styles.waitlistInfo}>
                  <p className={styles.waitlistMessage}>
                    ⚠️ <strong>Todas as cópias deste livro já foram reservadas por outros alunos.</strong>
                  </p>
                  <p className={styles.waitlistDetails}>
                    Este livro ainda não foi retirado, mas todas as cópias já estão reservadas. Quando uma cópia for disponibilizada (cancelamento de reserva ou retirada), você poderá reservá-la.
                  </p>
                </div>
              ) : book.availableCopies > 0 ? (
                <p className={styles.availableMessage}>
                  ✅ Este livro está disponível à pronta entrega! Você pode reservá-lo para pegar quando quiser.
                </p>
              ) : (
                <div className={styles.waitlistInfo}>
                  <p className={styles.waitlistMessage}>
                    📋 Este livro está emprestado. Ao reservar, você entrará na fila de espera.
                  </p>
                  <p className={styles.waitlistDetails}>
                    Quando o livro for devolvido, você será notificado via whatsapp para pegá-lo antes dos outros.
                  </p>
                </div>
              )}
            </div>

            {/* Feature Block - aparece quando o usuário clica no botão e o plano não permite */}
            {showFeatureBlock && (
              <div className={styles.featureBlockWrapper}>
                <FeatureBlock
                  planDisplayName={planDisplayName}
                  featureName="Reservas de livros disponíveis no plano Avançado"
                  description="Reserve livros direto do seu celular e garanta seu lugar na fila dos livros mais disputados da biblioteca."
                  highlights={[
                    'Reserve livros de qualquer lugar, a qualquer momento',
                    'Receba notificações quando sua reserva estiver pronta',
                    'Garanta prioridade nos livros mais populares',
                    'Organize suas leituras com antecedência'
                  ]}
                  upgradeUrl="https://bibliotech.tech/#planos"
                  buttonText="Converse com sua escola sobre o plano Avançado"
                  footnoteText="Solicite à sua escola a atualização para o plano Bibliotech Avançado e aproveite esta e outras funcionalidades."
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default BookDetails;