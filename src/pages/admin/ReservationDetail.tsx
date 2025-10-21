import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reservationService, Reservation } from '../../services/reservationService';
import { studentService } from '../../services/studentService';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import styles from './ReservationDetail.module.css';

interface LoanInfo {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  borrowDate: any;
  dueDate: any;
  status: string;
  daysOverdue?: number;
  daysRemaining?: number;
}

const ReservationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { reservationId } = useParams<{ reservationId: string }>();
  const { currentUser } = useAuth();
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookAvailable, setBookAvailable] = useState(false);
  const [activeLoans, setActiveLoans] = useState<LoanInfo[]>([]);
  const [notifyingReturn, setNotifyingReturn] = useState(false);
  const [notifyingStudent, setNotifyingStudent] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (reservationId && currentUser) {
      loadReservationDetails();
    }
  }, [reservationId, currentUser]);

  const loadReservationDetails = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da reserva
      const reservationData = await reservationService.getReservation(currentUser!.uid, reservationId!);
      if (!reservationData) {
        navigate('/reservations');
        return;
      }
      setReservation(reservationData);

      // Verificar disponibilidade do livro
      await checkBookAvailability(reservationData.bookId, reservationData.userId);
      
    } catch (error) {
      console.error('Erro ao carregar detalhes da reserva:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookAvailability = async (bookId: string, userId: string) => {
    try {
      // Buscar informações do livro
      const bookData = await studentService.getBookById(bookId, userId);
      if (!bookData) return;

      // Se há cópias disponíveis, livro está pronto
      if (bookData.availableCopies > 0) {
        setBookAvailable(true);
        return;
      }

      // Se não há cópias disponíveis, buscar empréstimos ativos
      const loans = await studentService.getActiveLoansByBook(bookId, userId);
      const loansWithInfo: LoanInfo[] = [];

      for (const loan of loans) {
        const student = await studentService.findStudentById(loan.studentId);
        if (student) {
          const borrowDate = loan.borrowDate?.toDate ? loan.borrowDate.toDate() : new Date(loan.borrowDate);
          const dueDate = loan.dueDate?.toDate ? loan.dueDate.toDate() : new Date(loan.dueDate);
          const now = new Date();
          
          const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          const daysRemaining = Math.max(0, Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

          loansWithInfo.push({
            id: loan.id,
            studentId: loan.studentId,
            studentName: student.name,
            bookId: loan.bookId,
            borrowDate,
            dueDate,
            status: loan.status,
            daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
            daysRemaining: daysOverdue === 0 ? daysRemaining : undefined
          });
        }
      }

      setActiveLoans(loansWithInfo);
      setBookAvailable(false);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
    }
  };

  const handleNotifyReturn = async (loanId: string) => {
    try {
      setNotifyingReturn(true);
      setSelectedLoanId(loanId);
      
      // Aqui você implementaria a lógica de envio do WhatsApp
      // Por enquanto, vou simular
      console.log('Notificando devolução para empréstimo:', loanId);
      
    } catch (error) {
      console.error('Erro ao notificar devolução:', error);
    }
  };

  const handleConfirmMessageSent = () => {
    setMessageSent(true);
    setNotifyingReturn(false);
    setSelectedLoanId(null);
  };

  const handleNotifyStudent = async () => {
    try {
      setNotifyingStudent(true);
      
      // Aqui você implementaria a lógica de envio do WhatsApp para o aluno que reservou
      console.log('Notificando aluno que reservou:', reservation?.studentName);
      
    } catch (error) {
      console.error('Erro ao notificar aluno:', error);
    }
  };

  const handleBookRetrieved = async () => {
    if (!reservation) return;
    
    const confirmed = window.confirm('Confirmar que o livro foi retirado pelo aluno?');
    if (!confirmed) return;

    try {
      await reservationService.deleteReservation(currentUser!.uid, reservation.id);
      navigate('/reservations');
    } catch (error) {
      console.error('Erro ao marcar como retirado:', error);
      alert('Erro ao marcar como retirado');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const badges = {
      pending: { label: 'Aguardando', color: styles.badgeWarning },
      ready: { label: 'Pronta', color: styles.badgeSuccess },
      completed: { label: 'Concluída', color: styles.badgeInfo },
      cancelled: { label: 'Cancelada', color: styles.badgeError },
      expired: { label: 'Expirada', color: styles.badgeError }
    };
    return badges[status];
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/reservations')} className={styles.backButton}>
            <ArrowLeftIcon />
            Voltar
          </button>
          <h1>Carregando...</h1>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando detalhes da reserva...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/reservations')} className={styles.backButton}>
            <ArrowLeftIcon />
            Voltar
          </button>
          <h1>Reserva não encontrada</h1>
        </div>
        <div className={styles.error}>
          <ExclamationTriangleIcon className={styles.errorIcon} />
          <p>A reserva solicitada não foi encontrada.</p>
          <button onClick={() => navigate('/reservations')} className={styles.backButton}>
            Voltar para Reservas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => navigate('/reservations')} className={styles.backButton}>
          <ArrowLeftIcon />
          Voltar
        </button>
        <h1>Detalhes da Reserva</h1>
      </div>

      {/* Reservation Info */}
      <div className={styles.reservationCard}>
        <div className={styles.bookInfo}>
          <div className={styles.bookCover}>
            {reservation.bookCoverUrl ? (
              <img src={reservation.bookCoverUrl} alt={reservation.bookTitle} />
            ) : (
              <BookOpenIcon />
            )}
          </div>
          <div className={styles.bookDetails}>
            <h2>{reservation.bookTitle}</h2>
            <p>{reservation.bookAuthor || 'Autor não informado'}</p>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${getStatusBadge(reservation.status).color}`}>
                {getStatusBadge(reservation.status).label}
              </span>
              <span className={styles.badgeType}>
                {reservation.type === 'available' ? 'Disponível' : 'Fila de Espera'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.studentInfo}>
          <div className={styles.infoItem}>
            <UserIcon className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Aluno:</span>
              <span className={styles.infoValue}>{reservation.studentName}</span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <ClockIcon className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Reserva criada em:</span>
              <span className={styles.infoValue}>{formatDate(reservation.createdAt)}</span>
            </div>
          </div>
          
          {/* Book Status moved here */}
          <div className={styles.bookStatusSection}>
            <div className={styles.infoItem}>
              {bookAvailable ? (
                <CheckCircleIcon className={styles.infoIcon} style={{ color: '#10b981' }} />
              ) : (
                <ExclamationTriangleIcon className={styles.infoIcon} style={{ color: '#f59e0b' }} />
              )}
              <div>
                <span className={styles.infoLabel}>Status:</span>
                <span className={styles.infoValue}>
                  {bookAvailable ? 'Pronto para Retirada' : 'Emprestado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Active Loans */}
      {!bookAvailable && activeLoans.length > 0 && (
        <div className={styles.loansCard}>
          <h3>
            <CalendarDaysIcon className={styles.sectionIcon} />
            Livro com Aluno ({activeLoans.length})
          </h3>
          
          <div className={styles.loansList}>
            {activeLoans.map((loan) => (
              <div key={loan.id} className={styles.loanCard}>
                <div className={styles.loanCardHeader}>
                  <div className={styles.studentAvatar}>
                    <UserIcon className={styles.avatarIcon} />
                  </div>
                  <div className={styles.loanCardInfo}>
                    <h4>📚 Livro com {loan.studentName}</h4>
                    <p className={styles.loanStatus}>
                      {loan.daysOverdue ? (
                        <span className={styles.overdue}>
                          ⚠️ {loan.daysOverdue} dias atrasado
                        </span>
                      ) : (
                        <span className={styles.ontime}>
                          ✅ {loan.daysRemaining} dias restantes
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.loanCardActions}>
                  <button
                    className={styles.remindButton}
                    onClick={() => handleNotifyReturn(loan.id)}
                    disabled={messageSent}
                  >
                    <ChatBubbleLeftRightIcon />
                    Lembrar via WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Sent Confirmation */}
      {notifyingReturn && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmação de Envio</h3>
            <p>A mensagem de devolução foi enviada para o aluno?</p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setNotifyingReturn(false)}
              >
                Não
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmMessageSent}
              >
                Sim, foi enviada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actionsCard}>
        <h3>Ações</h3>
        
        {bookAvailable ? (
          <div className={styles.actionItem}>
            <div className={styles.actionCard}>
              <div className={styles.actionCardHeader}>
                <div className={styles.actionIcon}>
                  <ChatBubbleLeftRightIcon />
                </div>
                <div className={styles.actionCardInfo}>
                  <h4>📱 Notificar Aluno que Reservou</h4>
                  <p>O aluno <strong>{reservation.studentName}</strong> reservou este livro</p>
                </div>
              </div>
              <button
                className={styles.notifyStudentButton}
                onClick={handleNotifyStudent}
                disabled={notifyingStudent}
              >
                <ChatBubbleLeftRightIcon />
                {notifyingStudent ? 'Notificando...' : 'Notificar via WhatsApp'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actionItem}>
            <div className={styles.waitingCard}>
              <div className={styles.waitingIcon}>⏳</div>
              <div className={styles.waitingInfo}>
                <h4>Aguardando Devolução</h4>
                <p>O livro está com outro aluno. Após a devolução, você poderá notificar <strong>{reservation.studentName}</strong> que o livro está pronto para retirada.</p>
              </div>
            </div>
          </div>
        )}

        <div className={styles.actionItem}>
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <div className={styles.actionIcon}>
                <CheckCircleIcon />
              </div>
              <div className={styles.actionCardInfo}>
                <h4>✅ Marcar como Retirado</h4>
                <p>O aluno <strong>{reservation.studentName}</strong> já retirou o livro?</p>
              </div>
            </div>
            <button
              className={styles.retrievedButton}
              onClick={handleBookRetrieved}
            >
              <CheckCircleIcon />
              Sim, foi retirado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
