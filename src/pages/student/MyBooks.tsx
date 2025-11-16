import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, AlertCircle, Calendar, Lock, ArrowUpRight } from 'lucide-react';
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

      // Buscar plano da escola
      const plan = await studentService.getSchoolSubscriptionPlan(student.userId);
      setSubscriptionPlan(plan);

      const tier = inferTierFromPlanValue(plan ?? null);

      // Se plano básico/indefinido, não buscar reservas
      if (tier === 'basic' || tier === 'unknown') {
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
    () => planTier === 'basic' || planTier === 'unknown',
    [planTier]
  );

  const planDisplayName = useMemo(
    () => formatPlanDisplayName(subscriptionPlan ?? null),
    [subscriptionPlan]
  );

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
                  <h4>Reservas de livros disponíveis no plano Intermediário</h4>
                </div>
              </div>
              <p className={styles.featureBlockDescription}>
                Com o sistema de reservas do Bibliotech você garante seu lugar nos livros mais disputados sem precisar enfrentar fila na biblioteca.
              </p>
              <ul className={styles.featureBlockHighlights}>
                <li>Reserve livros direto do celular, de qualquer lugar</li>
                <li>Veja quando sua reserva estará pronta para retirada</li>
                <li>Garanta prioridade em livros muito disputados da escola</li>
                <li>Evite filas e organize suas leituras com antecedência</li>
              </ul>
              <a
                className={styles.featureBlockButton}
                href="https://bibliotech.tech/#planos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Conhecer plano intermediário
                <ArrowUpRight size={16} />
              </a>
              <span className={styles.featureBlockFootnote}>
                Disponível nos planos Bibliotech Intermediário e Avançado.
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="profile" />
    </div>
  );
};

export default MyBooks;
