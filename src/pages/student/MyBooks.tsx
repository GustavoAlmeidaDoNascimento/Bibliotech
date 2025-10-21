import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BottomNavigation from '../../components/student/BottomNavigation';
import { reservationService, Reservation } from '../../services/reservationService';
import styles from './MyBooks.module.css';

const MyBooks: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReservations();
  }, [studentId]);

  const loadReservations = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Criar uma reserva de teste temporariamente para demonstrar a funcionalidade
      console.log('🧪 Criando reserva de teste para demonstração...');
      
      // Simular dados de reserva para teste
      const testReservations: Reservation[] = [
        {
          id: 'test-reservation-1',
          studentId: studentId,
          studentName: 'Aluno Teste',
          bookId: 'test-book-1',
          bookTitle: 'O Príncipe Cruel',
          bookAuthor: 'Holly Black',
          bookCoverUrl: 'https://covers.openlibrary.org/b/id/12345678-L.jpg',
          userId: 'gPGYmNxF4HfZK0GaL1L73ANJRyC2',
          status: 'ready',
          type: 'available',
          createdAt: new Date() as any,
          readyAt: new Date() as any
        },
        {
          id: 'test-reservation-2',
          studentId: studentId,
          studentName: 'Aluno Teste',
          bookId: 'test-book-2',
          bookTitle: 'Heartstopper - Volume 5',
          bookAuthor: 'Alice Oseman',
          userId: 'gPGYmNxF4HfZK0GaL1L73ANJRyC2',
          status: 'pending',
          type: 'waitlist',
          position: 2,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any // 1 dia atrás
        }
      ];
      
      console.log('📚 Reservas de teste carregadas:', testReservations.length);
      setReservations(testReservations);
      
      // Comentado temporariamente para usar dados de teste
      // const studentReservations = await reservationService.getStudentReservationsFromGlobal(studentId);
      // setReservations(studentReservations);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
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
        {reservations.length === 0 ? (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconContainer}>
              <BookOpen size={64} />
            </div>
            
            <h2>Nenhuma reserva encontrada</h2>
            
            <p className={styles.emptyDescription}>
              Você ainda não possui livros reservados. Que tal explorar nosso acervo?
            </p>

            <button 
              onClick={() => navigate(`/student-dashboard/${studentId}/search`)} 
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
