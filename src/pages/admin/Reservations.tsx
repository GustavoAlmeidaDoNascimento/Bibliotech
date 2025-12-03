import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService, Reservation } from '../../services/reservationService';
import { studentService } from '../../services/studentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { BookOpen } from 'lucide-react';
import styles from './Reservations.module.css';

interface DisplayReservation extends Reservation {
  bookAvailabilityStatus?: string;
}

const Reservations: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<DisplayReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, [currentUser]);

  const loadReservations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservations(currentUser.uid);

      // Para cada reserva, verificar o status do livro
      const reservationsWithStatus = await Promise.all(data.map(async (res) => {
        let bookAvailabilityStatus = '';
        
        console.log('🔍 Verificando status da reserva:', {
          id: res.id,
          bookTitle: res.bookTitle,
          status: res.status,
          type: res.type
        });
        
        if (res.status === 'ready') {
          bookAvailabilityStatus = 'Pronta entrega';
        } else if (res.status === 'pending') {
          // Se a reserva está pendente, o livro está emprestado
          try {
            const activeLoans = await studentService.getActiveLoansByBook(res.bookId, currentUser.uid);
            console.log('📚 Empréstimos ativos encontrados:', activeLoans.length);
            if (activeLoans.length > 0) {
              bookAvailabilityStatus = `Com: ${activeLoans[0].studentName}`;
            } else {
              bookAvailabilityStatus = 'Indisponível';
            }
          } catch (error) {
            console.error('Erro ao buscar empréstimos ativos:', error);
            bookAvailabilityStatus = 'Status desconhecido';
          }
        } else {
          // Status não reconhecido
          bookAvailabilityStatus = `Status: ${res.status}`;
        }
        
        console.log('✅ Status definido:', bookAvailabilityStatus);
        return { ...res, bookAvailabilityStatus };
      }));

      setReservations(reservationsWithStatus);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não informada';
    
    try {
      // Se for um objeto Timestamp do Firebase
      if (timestamp.toDate) {
        return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      }
      // Se for um número (timestamp em milissegundos)
      if (typeof timestamp === 'number') {
        return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      }
      // Se for uma string de data
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const handleReservationClick = (reservation: DisplayReservation) => {
    navigate(`/reservation-detail/${reservation.id}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Reservas de Livros</h1>
        </div>
        <div className={styles.loading}>
          <p>Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Reservas de Livros</h1>
        <p className={styles.subtitle}>
          {reservations.length === 0 
            ? 'Nenhuma reserva pendente - ótimo trabalho! 🎉' 
            : `${reservations.length} reserva(s) pendente(s)`
          }
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3>Todas as reservas foram atendidas!</h3>
          <p>Não há reservas pendentes no momento.</p>
        </div>
      ) : (
        <div className={styles.reservationsList}>
          {reservations.map((reservation) => (
            <div 
              key={reservation.id} 
              className={styles.reservationItem}
              onClick={() => handleReservationClick(reservation)}
            >
              <div className={styles.bookInfo}>
                <div className={styles.bookCoverWrapper}>
                  {reservation.bookCoverUrl ? (
                    <img 
                      src={reservation.bookCoverUrl} 
                      alt={reservation.bookTitle}
                      className={styles.bookCover}
                    />
                  ) : (
                    <div className={styles.bookCoverPlaceholder}>
                      <BookOpen size={40} />
                    </div>
                  )}
                </div>
                <div className={styles.bookDetails}>
                  <h3 className={styles.bookTitle}>{reservation.bookTitle}</h3>
                  {reservation.bookAuthor && (
                    <p className={styles.bookAuthor}>{reservation.bookAuthor}</p>
                  )}
                </div>
              </div>

              <div className={styles.studentInfo}>
                <div className={styles.studentName}>
                  <strong>{reservation.studentName}</strong>
                </div>
                <div className={styles.reservationDate}>
                  Reservado em: {formatDate(reservation.createdAt)}
                </div>
                <div className={`${styles.bookStatus} ${reservation.status === 'ready' ? styles.statusReady : styles.statusPending}`}>
                  <BookOpenIcon className={styles.statusIcon} />
                  {reservation.bookAvailabilityStatus}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservations;