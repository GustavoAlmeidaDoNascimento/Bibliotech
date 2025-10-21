import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService, Reservation } from '../../services/reservationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './Reservations.module.css';

const Reservations: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, [currentUser]);

  const loadReservations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservations(currentUser.uid);
      setReservations(data);
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

  const handleMarkAsDone = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowConfirmModal(true);
  };

  const handleConfirmDone = async () => {
    if (!selectedReservation) return;

    try {
      await reservationService.deleteReservation(currentUser!.uid, selectedReservation.id);
      
      // Atualizar lista local
      setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
      
      setShowConfirmModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Erro ao marcar reserva como concluída:', error);
    }
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setSelectedReservation(null);
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
            <div key={reservation.id} className={styles.reservationItem}>
              <div className={styles.bookInfo}>
                <img 
                  src={reservation.bookCoverUrl || '/path/to/default/cover.jpg'} 
                  alt={reservation.bookTitle}
                  className={styles.bookCover}
                />
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
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.doneButton}
                  onClick={() => handleMarkAsDone(reservation)}
                  title="Marcar como retirado"
                >
                  ✅ Feito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação */}
      {showConfirmModal && selectedReservation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Retirada</h3>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.confirmationInfo}>
                <img 
                  src={selectedReservation.bookCoverUrl || '/path/to/default/cover.jpg'} 
                  alt={selectedReservation.bookTitle}
                  className={styles.modalBookCover}
                />
                <div className={styles.modalBookDetails}>
                  <h4>{selectedReservation.bookTitle}</h4>
                  <p><strong>Aluno:</strong> {selectedReservation.studentName}</p>
                  <p><strong>Reservado em:</strong> {formatDate(selectedReservation.createdAt)}</p>
                </div>
              </div>
              
              <p className={styles.confirmationText}>
                O aluno <strong>{selectedReservation.studentName}</strong> já retirou o livro 
                <strong> "{selectedReservation.bookTitle}"</strong>?
              </p>
              
              <p className={styles.warningText}>
                ⚠️ Esta ação irá remover a reserva permanentemente do sistema.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancelModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleConfirmDone}
              >
                Sim, livro foi retirado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;