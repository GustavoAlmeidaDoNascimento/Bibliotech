import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { CheckIcon, XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import styles from './Withdrawals.module.css';

interface Student {
  id: string;
  name: string;
  classroom: string;
}

interface Book {
  id: string;
  codes: string[];
  title: string;
  authors?: string[] | string;
  publisher?: string;
  quantity: number;
  description?: string;
}

interface LocationState {
  studentName: string;
  bookTitle: string;
  selectedCode: string;
}

const WithdrawalConfirmation = () => {
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    if (!currentUser || !studentId || !bookId) {
      navigate('/student-withdrawals');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do aluno
        const studentDoc = await getDoc(doc(db, `users/${currentUser.uid}/students/${studentId}`));
        if (!studentDoc.exists()) {
          throw new Error('Aluno não encontrado');
        }
        const studentData = studentDoc.data();
        setStudent({
          id: studentDoc.id,
          name: studentData.name || '',
          classroom: studentData.classroom || ''
        });

        // Buscar dados do livro
        const bookDoc = await getDoc(doc(db, `users/${currentUser.uid}/books/${bookId}`));
        if (!bookDoc.exists()) {
          throw new Error('Livro não encontrado');
        }
        const bookData = bookDoc.data();
        
        // Compatibilidade com versão antiga (code -> codes)
        const codes = bookData.codes || (bookData.code ? [bookData.code] : []);
        
        setBook({
          id: bookDoc.id,
          codes,
          title: bookData.title || '',
          authors: bookData.authors || [],
          publisher: bookData.publisher || '',
          quantity: bookData.quantity || 0
        });

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, studentId, bookId, navigate]);

  const handleConfirm = async () => {
    if (!currentUser || !student || !book) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Verificar se ainda há exemplares disponíveis
      if (book.quantity <= 0) {
        setError('Não há exemplares disponíveis deste livro');
        return;
      }
      
      // 1. Criar registro de locação
      const loanDurationDays = Math.max(1, settings.loanDuration || 30);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + loanDurationDays);

      const loanData = {
        studentId: student.id,
        studentName: student.name,
        bookId: book.id,
        bookTitle: book.title,
        bookCode: state.selectedCode, // Código específico do exemplar
        borrowDate: serverTimestamp(),
        status: 'active' as const,
        dueDate: Timestamp.fromDate(dueDate),
        loanDurationDays,
        createdAt: serverTimestamp()
      };
      
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      console.log('Salvando nova locação:', loanData);
      const docRef = await addDoc(loansRef, loanData);
      console.log('Locação salva com sucesso, ID:', docRef.id);
      
      // Nota: A quantidade agora é calculada dinamicamente baseada nos códigos disponíveis
      // Não precisamos mais atualizar manualmente o campo quantity
      
      // Redirecionar para a página de locações
      navigate('/student-loans', { 
        state: { 
          message: `Livro "${book.title}" retirado com sucesso por ${student.name}` 
        } 
      });
      
    } catch (error) {
      console.error('Erro ao registrar retirada:', error);
      setError('Erro ao registrar a retirada. Por favor, tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate(`/student-withdrawals/${studentId}`, { 
      state: { studentName: student?.name } 
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loading}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <XMarkIcon className={styles.errorIcon} />
            <h3>Erro</h3>
            <p>{error}</p>
            <button 
              className={styles.backButton}
              onClick={handleCancel}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Confirmar Retirada</h2>
      </div>

      <div className={styles.content}>
        <div className={styles.confirmationContainer}>
          <div className={styles.confirmationHeader}>
            <BookOpenIcon className={styles.confirmationIcon} />
            <h3>Confirmação de Retirada de Livro</h3>
            <p>Verifique os dados abaixo e confirme a retirada</p>
          </div>
          
          <div className={styles.confirmationDetails}>
            <div className={styles.detailSection}>
              <h4>Aluno</h4>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nome:</span>
                <span className={styles.detailValue}>{student?.name}</span>
              </div>
              {student?.classroom && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Turma:</span>
                  <span className={styles.detailValue}>{student.classroom}</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailSection}>
              <h4>Livro</h4>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Título:</span>
                <span className={styles.detailValue}>{book?.title}</span>
              </div>
              {state?.selectedCode && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Código:</span>
                  <span className={styles.detailValue}>{state.selectedCode}</span>
                </div>
              )}
              {book?.authors && (Array.isArray(book.authors) ? book.authors.length > 0 : book.authors) && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Autores:</span>
                  <span className={styles.detailValue}>{Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</span>
                </div>
              )}
              {book?.quantity !== undefined && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Quantidade disponível:</span>
                  <span className={styles.detailValue}>{book.quantity}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.confirmationActions}>
            <button 
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={processing}
            >
              <XMarkIcon className={styles.buttonIcon} />
              Cancelar
            </button>
            <button 
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={processing || (book?.quantity || 0) <= 0}
            >
              <CheckIcon className={styles.buttonIcon} />
              {processing ? 'Processando...' : 'Confirmar Retirada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalConfirmation; 