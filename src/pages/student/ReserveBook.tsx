import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, BookOpen, Calendar, Check, X, Loader } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import { reservationService } from '../../services/reservationService';
import { studentService } from '../../services/studentService';
import { feedbackService } from '../../services/feedbackService';
import { feedbackCampaignService } from '../../services/feedbackCampaignService';
import FeedbackPopup from '../../components/feedback/FeedbackPopup';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './ReserveBook.module.css';

interface BookData {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  available: boolean;
  availableCopies: number;
  totalCopies: number;
  userId: string;
}

const ReserveBook: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [book, setBook] = useState<BookData | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [allCopiesReserved, setAllCopiesReserved] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  useEffect(() => {
    loadData();
  }, [studentId, bookId]);

  const loadData = async () => {
    if (!studentId || !bookId) return;

    try {
      setLoading(true);
      
      // Buscar dados do aluno
      const studentData = await studentService.findStudentById(studentId);
      if (!studentData) {
        setError('Aluno não encontrado');
        return;
      }
      setStudent(studentData);

      // Buscar dados do livro
      const bookData = await studentService.getBookById(bookId, studentData.userId);
      if (!bookData) {
        setError('Livro não encontrado');
        return;
      }

      // CORREÇÃO: Verificar se o livro está EMPRESTADO (retirado) vs RESERVADO
      // - Se está emprestado → verificar se ainda há "vagas" na fila de espera
      // - Se não está emprestado mas todas as cópias foram RESERVADAS → não permitir reserva
      
      let allReserved = false;
      try {
        // Primeiro, verificar se o livro está emprestado (retirado)
        const activeLoans = await studentService.getActiveLoansByBook(bookId, studentData.userId);
        const isLoaned = activeLoans.length > 0;
        
        console.log('🔍 Verificando disponibilidade do livro:', {
          bookId,
          totalCopies: bookData.totalCopies,
          availableCopies: bookData.availableCopies,
          isLoaned,
          activeLoansCount: activeLoans.length
        });
        
        // Buscar reservas ativas do livro
        const activeReservations = await reservationService.getActiveReservationsByBook(
          studentData.userId,
          bookId
        );
        const readyReservations = activeReservations.filter(res => res.status === 'ready');
        const pendingReservations = activeReservations.filter(res => res.status === 'pending');
        
        // Verificar se o aluno já tem uma reserva ativa para este livro
        const studentReservation = activeReservations.find(res => res.studentId === studentId);
        
        console.log('📊 Verificando reservas:', {
          readyReservationsCount: readyReservations.length,
          pendingReservationsCount: pendingReservations.length,
          availableCopies: bookData.availableCopies,
          activeLoansCount: activeLoans.length,
          studentHasReservation: !!studentReservation
        });
        
        // CASO 1: Livro emprestado - verificar se há vagas na fila de espera
        if (isLoaned && !studentReservation) {
          // Cada cópia emprestada pode ter 1 reserva 'pending' (fila de espera)
          // Se já tem reservas 'pending' >= empréstimos ativos, não permite mais reservas
          if (pendingReservations.length >= activeLoans.length) {
            allReserved = true;
            setAllCopiesReserved(true);
            setError('Todas as vagas na fila de espera já foram preenchidas.');
          }
        }
        // CASO 2: Livro não emprestado - verificar se todas as cópias foram reservadas
        else if (!isLoaned && bookData.availableCopies > 0 && !studentReservation) {
          // Se todas as cópias disponíveis foram reservadas (status 'ready')
          if (readyReservations.length >= bookData.availableCopies) {
            allReserved = true;
            setAllCopiesReserved(true);
            setError('Todas as cópias deste livro já foram reservadas por outros alunos.');
          }
        }
      } catch (reservationError) {
        console.error('Erro ao verificar reservas/empréstimos:', reservationError);
        // Continuar normalmente se houver erro na verificação
      }

      setBook({
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        available: bookData.available,
        availableCopies: bookData.availableCopies,
        totalCopies: bookData.totalCopies,
        userId: studentData.userId
      });

      // Mostrar confirmação apenas se não todas as cópias estiverem reservadas
      if (!allReserved) {
        setShowConfirmation(true);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!book || !student || allCopiesReserved) return;

    try {
      setCreating(true);
      setError('');

      await reservationService.createReservation(
        student.userId,
        studentId!,
        student.name,
        bookId!,
        book.title,
        book.author,
        book.coverUrl,
        book.availableCopies > 0
      );

      setSuccess(true);
      setShowConfirmation(false);

      // Verificar se deve mostrar popup de feedback
      const shouldAsk = await feedbackCampaignService.shouldAskFeedback(student.userId, studentId!);
      
      if (shouldAsk) {
        // Mostrar popup de feedback após 1 segundo
        setTimeout(() => {
          setShowFeedbackPopup(true);
        }, 1000);
      } else {
        // Redirecionar direto se não deve perguntar
        setTimeout(() => {
          navigate(`/student-dashboard/${studentId}/home`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      setError(error.message || 'Erro ao criar reserva. Tente novamente.');
      setCreating(false);
    }
  };

  const handleCancelReservation = () => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const handleFeedbackSubmit = async (rating: 1 | 2 | 3 | 4 | 5, comment: string) => {
    if (!student || !book) return;

    try {
      // Buscar informações da escola
      let schoolName = 'Escola não identificada';
      let schoolPlan: string | null = null;

      try {
        // Buscar configurações da escola para pegar o nome (caminho correto: settings/library)
        const settingsRef = doc(db, `users/${student.userId}/settings/library`);
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          schoolName = settingsData.schoolName || 'Biblioteca';
          console.log('✅ Nome da escola encontrado:', schoolName);
        } else {
          console.warn('⚠️ Configurações da escola não encontradas');
        }

        // Buscar plano da escola
        schoolPlan = await studentService.getSchoolSubscriptionPlan(student.userId);
        console.log('📋 Plano da escola:', schoolPlan);
      } catch (error) {
        console.error('❌ Erro ao buscar dados da escola:', error);
      }

      await feedbackService.createFeedback(
        'reservation',
        rating,
        comment,
        studentId!,
        student.name,
        student.userId,
        schoolName,
        schoolPlan || undefined,
        {
          bookId: book.id,
          bookTitle: book.title,
        }
      );

      console.log('✅ Feedback enviado com sucesso');
      
      // Marcar que o aluno deu feedback
      try {
        await feedbackCampaignService.markFeedbackGiven(student.userId, studentId!);
        console.log('✅ Status de feedback atualizado');
      } catch (feedbackError) {
        console.error('⚠️ Erro ao atualizar status de feedback (mas o feedback foi salvo):', feedbackError);
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    } finally {
      // Redirecionar após envio ou erro
      setShowFeedbackPopup(false);
      navigate(`/student-dashboard/${studentId}/home`);
    }
  };

  const handleFeedbackSkip = async () => {
    try {
      // Marcar que o popup foi mostrado mas não respondeu
      await feedbackCampaignService.markFeedbackAsked(student.userId, studentId!);
      console.log('📝 Feedback marcado como perguntado (não respondido)');
    } catch (error) {
      console.error('Erro ao marcar feedback como perguntado:', error);
    }
    
    setShowFeedbackPopup(false);
    navigate(`/student-dashboard/${studentId}/home`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={24} />
            </button>
            <h1>Carregando...</h1>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <Loader size={48} className={styles.spinner} />
            <p>Carregando informações...</p>
          </div>
        </main>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  if (error && !book) {
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
            <X size={64} className={styles.errorIcon} />
            <h2>Erro ao carregar</h2>
            <p>{error}</p>
            <button onClick={handleBack} className={styles.backButton}>
              Voltar
            </button>
          </div>
        </main>
        <BottomNavigation studentId={studentId || ''} activePage="home" />
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Reserva Confirmada!</h1>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <Check size={64} />
            </div>
            <h2>Reserva realizada com sucesso!</h2>
            <p className={styles.successMessage}>
              {book?.availableCopies && book.availableCopies > 0 ? (
                <>
                  ✅ Seu livro está pronto para retirada!<br/>
                  Você poderá pegá-lo na biblioteca quando quiser.
                </>
              ) : (
                <>
                  📋 Você entrou na fila de espera!<br/>
                  Quando o livro for devolvido, você será notificado.
                </>
              )}
            </p>
            {!showFeedbackPopup && (
              <p className={styles.redirectMessage}>
                Aguarde...
              </p>
            )}
          </div>
        </main>
        <BottomNavigation studentId={studentId || ''} activePage="home" />

        {/* Feedback Popup */}
        {showFeedbackPopup && (
          <FeedbackPopup
            onSubmit={handleFeedbackSubmit}
            onSkip={handleFeedbackSkip}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1>Reservar Livro</h1>
        </div>
      </header>

      <main className={styles.main}>
        {allCopiesReserved && book && (
          <div className={styles.confirmationContainer}>
            {/* Book Preview */}
            <div className={styles.bookPreview}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
              ) : (
                <div className={styles.coverPlaceholder}>
                  <BookOpen size={48} />
                </div>
              )}
              <div className={styles.bookInfo}>
                <h2>{book.title}</h2>
                <p>{book.author || 'Autor não informado'}</p>
              </div>
            </div>

            {/* All Copies Reserved Message */}
            <div className={styles.confirmationMessage}>
              <div className={styles.iconContainer}>
                <Calendar size={48} className={styles.calendarIcon} />
              </div>
              
              <h3>Todas as cópias já foram reservadas</h3>
              
              <p className={styles.description}>
                <strong>Este livro ainda não foi retirado, mas todas as cópias já foram reservadas por outros alunos.</strong><br/><br/>
                Quando uma cópia for disponibilizada (cancelamento de reserva ou retirada), você poderá reservá-la. Por enquanto, não é possível fazer nova reserva.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <X size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button 
                onClick={handleCancelReservation}
                className={styles.cancelButton}
              >
                <X size={20} />
                Voltar
              </button>
              <button 
                onClick={handleConfirmReservation}
                className={styles.confirmButton}
                disabled={creating || allCopiesReserved}
              >
                {creating ? (
                  <>
                    <Loader size={20} className={styles.spinner} />
                    Entrando na fila...
                  </>
                ) : (
                  <>
                    <Calendar size={20} />
                    {allCopiesReserved ? 'Não disponível' : 'Entrar na fila de espera'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!allCopiesReserved && showConfirmation && book && (
          <div className={styles.confirmationContainer}>
            {/* Book Preview */}
            <div className={styles.bookPreview}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className={styles.bookCover} />
              ) : (
                <div className={styles.coverPlaceholder}>
                  <BookOpen size={48} />
                </div>
              )}
              <div className={styles.bookInfo}>
                <h2>{book.title}</h2>
                <p>{book.author || 'Autor não informado'}</p>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className={styles.confirmationMessage}>
              <div className={styles.iconContainer}>
                {book.availableCopies > 0 ? (
                  <Heart size={48} className={styles.heartIcon} />
                ) : (
                  <Calendar size={48} className={styles.calendarIcon} />
                )}
              </div>
              
              <h3>
                {book.availableCopies > 0 
                  ? 'Reservar este livro?' 
                  : 'Entrar na fila de espera?'
                }
              </h3>
              
              <p className={styles.description}>
                {book.availableCopies > 0 ? (
                  <>
                    ✅ <strong>Este livro está disponível!</strong><br/>
                    Você poderá pegá-lo na biblioteca quando quiser.
                  </>
                ) : (
                  <>
                    📋 <strong>Este livro está emprestado.</strong><br/>
                    Você entrará na fila de espera e será notificado quando for devolvido.<br/>
                    <em>Você receberá uma notificação via WhatsApp</em>
                  </>
                )}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <X size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button 
                onClick={handleCancelReservation}
                className={styles.cancelButton}
                disabled={creating}
              >
                <X size={20} />
                Não, voltar
              </button>
              <button 
                onClick={handleConfirmReservation}
                className={styles.confirmButton}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader size={20} className={styles.spinner} />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Sim, reservar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default ReserveBook;
