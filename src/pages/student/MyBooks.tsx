import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, AlertCircle, Calendar, Lock, ArrowUpRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNavigation from '../../components/student/BottomNavigation';
import { reservationService, Reservation } from '../../services/reservationService';
import { studentService } from '../../services/studentService';
import { inferTierFromPlanValue, formatPlanDisplayName } from '../../services/subscriptionService';
import styles from './MyBooks.module.css';

const MyBooks: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [studentId]);

  const loadReservations = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📚 Carregando reservas do aluno:', studentId);
      
      // Buscar dados do aluno para obter schoolId
      const student = await studentService.findStudentById(studentId);
      if (!student) {
        throw new Error('Aluno não encontrado');
      }
      
      console.log('🏫 Escola do aluno:', student.userId);
      setSchoolId(student.userId);

      // Buscar plano da escola
      const plan = await studentService.getSchoolSubscriptionPlan(student.userId);
      setSubscriptionPlan(plan);

      const tier = inferTierFromPlanValue(plan ?? null);

      // Se plano básico/intermediário/indefinido, não buscar reservas
      if (tier === 'basic' || tier === 'intermediate' || tier === 'unknown') {
        console.log('⛔ Reservas bloqueadas para este plano, nenhuma consulta será feita.');
        setReservations([]);
        setLoading(false);
        return;
      }
      
      // Usar a nova função que tenta buscar de ambas as coleções
      const studentReservations = await reservationService.getStudentReservations(studentId, student.userId);
      
      console.log('✅ Reservas carregadas:', studentReservations.length);
      setReservations(studentReservations);
    } catch (err) {
      console.error('❌ Erro ao carregar reservas:', err);
      setError('Erro ao carregar suas reservas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/profile`);
  };

  const getStatusInfo = (reservation: Reservation) => {
    switch (reservation.status) {
      case 'pending':
        return {
          icon: <Clock size={20} />,
          text: 'Aguardando disponibilidade',
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'ready':
        return {
          icon: <CheckCircle size={20} />,
          text: 'Pronto para retirada',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={20} />,
          text: 'Retirado',
          color: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
      default:
        return {
          icon: <AlertCircle size={20} />,
          text: 'Status desconhecido',
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
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

  const handleCancelClick = (reservationId: string) => {
    setCancelReservationId(reservationId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReservationId || !studentId) return;
    
    try {
      setCancelling(true);
      await reservationService.cancelStudentReservation(
        cancelReservationId,
        studentId,
        schoolId || undefined
      );
      
      // Recarregar reservas após cancelamento
      await loadReservations();
      
      setShowCancelModal(false);
      setCancelReservationId(null);
    } catch (err: any) {
      console.error('❌ Erro ao cancelar reserva:', err);
      setError(err.message || 'Erro ao cancelar reserva. Tente novamente.');
      setShowCancelModal(false);
      setCancelReservationId(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    if (!cancelling) {
      setShowCancelModal(false);
      setCancelReservationId(null);
    }
  };

  const reservationToCancel = cancelReservationId 
    ? reservations.find(r => r.id === cancelReservationId)
    : null;

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <h1>Meus Livros Reservados</h1>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Carregando suas reservas...</p>
          </div>
        </main>

        <BottomNavigation studentId={studentId || ''} activePage="profile" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <h1>Meus Livros Reservados</h1>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.errorContainer}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h2>Erro ao carregar</h2>
            <p>{error}</p>
            <button onClick={loadReservations} className={styles.retryButton}>
              Tentar novamente
            </button>
          </div>
        </main>

        <BottomNavigation studentId={studentId || ''} activePage="profile" />
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
          <h1>Meus Livros Reservados</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isReservationsBlocked ? (
          <div className={styles.featureBlockContainer}>
            <div className={styles.featureBlockBackdrop} aria-hidden="true">
              <div className={styles.backdropList}>
                <div className={styles.backdropListItem}>
                  <div className={styles.backdropCover} />
                  <div className={styles.backdropText}>
                    <span className={styles.backdropTitleLine} />
                    <span className={styles.backdropSubtitleLine} />
                    <span className={styles.backdropMetaLine} />
                  </div>
                </div>
                <div className={styles.backdropListItem}>
                  <div className={styles.backdropCover} />
                  <div className={styles.backdropText}>
                    <span className={styles.backdropTitleLine} />
                    <span className={styles.backdropSubtitleLine} />
                    <span className={styles.backdropMetaLine} />
                  </div>
                </div>
                <div className={styles.backdropListItem}>
                  <div className={styles.backdropCover} />
                  <div className={styles.backdropText}>
                    <span className={styles.backdropTitleLine} />
                    <span className={styles.backdropSubtitleLine} />
                    <span className={styles.backdropMetaLine} />
                  </div>
                </div>
                <div className={styles.backdropListItem}>
                  <div className={styles.backdropCover} />
                  <div className={styles.backdropText}>
                    <span className={styles.backdropTitleLine} />
                    <span className={styles.backdropSubtitleLine} />
                    <span className={styles.backdropMetaLine} />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.featureBlockCard}>
              <div className={styles.featureBlockHeader}>
                <div className={styles.featureBlockIcon}>
                  <Lock size={20} />
                </div>
                <div>
                  <span className={styles.featureBlockBadge}>
                    Plano da escola:{' '}
                    {planDisplayName.includes('Básico') ? (
                      <>
                        Plano <span className={styles.planNameHighlight}>Básico</span>
                      </>
                    ) : (
                      planDisplayName
                    )}
                  </span>
                  <h4>Reservas de livros disponíveis no plano Avançado</h4>
                </div>
              </div>
              <p className={styles.featureBlockDescription}>
                Reserve livros direto do seu celular e garanta seu lugar na fila dos livros mais disputados da biblioteca.
              </p>
              <ul className={styles.featureBlockHighlights}>
                <li>Reserve livros de qualquer lugar, a qualquer momento</li>
                <li>Receba notificações quando sua reserva estiver pronta</li>
                <li>Garanta prioridade nos livros mais populares</li>
                <li>Organize suas leituras com antecedência</li>
              </ul>
              <a
                className={`${styles.featureBlockButton} ${styles.featureBlockButtonAdvanced}`}
                href="https://bibliotech.tech/#planos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Converse com sua escola sobre o plano Avançado
                <ArrowUpRight size={16} />
              </a>
              <span className={styles.featureBlockFootnote}>
                Solicite à sua escola a atualização para o plano Bibliotech Avançado e aproveite esta e outras funcionalidades.
              </span>
            </div>
          </div>
        ) : reservations.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconContainer}>
              <BookOpen size={64} />
            </div>
            
            <h2>Nenhuma reserva encontrada</h2>
            
            <p className={styles.emptyDescription}>
              Você ainda não possui livros reservados. Que tal explorar nosso acervo?
            </p>

            <button 
              onClick={() => navigate(`/student-dashboard/${studentId}/home`)} 
              className={styles.exploreButton}
            >
              Explorar Livros
            </button>
          </div>
        ) : (
          <div className={styles.reservationsContainer}>
            <div className={styles.reservationsHeader}>
              <h2>Suas Reservas ({reservations.length})</h2>
            </div>

            <div className={styles.reservationsList}>
              {reservations.map((reservation) => {
                const statusInfo = getStatusInfo(reservation);
                
                return (
                  <div key={reservation.id} className={styles.reservationCard}>
                    <div className={styles.bookInfo}>
                      <div className={styles.bookCover}>
                        {reservation.bookCoverUrl ? (
                          <img 
                            src={reservation.bookCoverUrl} 
                            alt={reservation.bookTitle}
                            className={styles.bookCoverImage}
                          />
                        ) : (
                          <div className={styles.bookCoverPlaceholder}>
                            <BookOpen size={32} />
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.bookDetails}>
                        <h3 className={styles.bookTitle}>{reservation.bookTitle}</h3>
                        <p className={styles.bookAuthor}>{reservation.bookAuthor || 'Autor não informado'}</p>
                        
                        <div className={styles.reservationDate}>
                          <Calendar size={16} />
                          <span>Reservado em: {formatDate(reservation.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.statusInfo}>
                        <div 
                          className={styles.statusBadge}
                          style={{ 
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color 
                          }}
                        >
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                      </div>

                      <button
                        className={styles.cancelButton}
                        onClick={() => handleCancelClick(reservation.id)}
                        disabled={cancelling}
                      >
                        <X size={18} />
                        <span>Cancelar reserva</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Cancelamento */}
      {showCancelModal && reservationToCancel && (
        <div className={styles.modalOverlay} onClick={handleCancelModalClose}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Cancelar Reserva</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handleCancelModalClose}
                disabled={cancelling}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja cancelar a reserva do livro{' '}
                <strong>"{reservationToCancel.bookTitle}"</strong>?
              </p>
              <p className={styles.modalWarning}>
                Esta ação não pode ser desfeita. O livro retornará ao acervo e você perderá sua posição na fila.
              </p>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelButton}
                onClick={handleCancelModalClose}
                disabled={cancelling}
              >
                Não, manter reserva
              </button>
              <button
                className={styles.modalConfirmButton}
                onClick={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sim, cancelar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation studentId={studentId || ''} activePage="profile" />
    </div>
  );
};

export default MyBooks;
