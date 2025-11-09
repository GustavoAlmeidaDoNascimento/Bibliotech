import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, updateDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpenIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import styles from './Withdrawals.module.css';

interface Staff {
  id: string;
  name: string;
  position: string;
  contact?: string;
}

interface Book {
  id: string;
  code?: string;
  codes?: string[];
  title: string;
  authors?: string[] | string;
  publisher?: string;
  availableCodes?: string[]; // Códigos disponíveis calculados dinamicamente
  description?: string;
}

interface LocationState {
  staffName: string;
  bookTitle: string;
  bookId: string;
}

const StaffWithdrawalConfirmation = () => {
  const { staffId, bookId } = useParams<{ staffId: string; bookId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const [staff, setStaff] = useState<Staff | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  
  const { currentUser } = useAuth();

  // Função para calcular códigos disponíveis
  const calculateAvailableCodes = async (bookData: Book): Promise<string[]> => {
    if (!currentUser || !bookData.id) return [];
      
    const allCodes = bookData.codes && bookData.codes.length > 0 ? bookData.codes : (bookData.code ? [bookData.code] : []);
    if (allCodes.length === 0) return [];

    try {
      // Buscar empréstimos ativos para este livro (tanto de alunos quanto de funcionários)
      const [studentLoans, staffLoans] = await Promise.all([
        // Empréstimos de alunos (apenas ativos)
        getDocs(query(
          collection(db, `users/${currentUser.uid}/loans`),
          where('bookId', '==', bookData.id),
          where('status', '==', 'active')
        )),
        // Empréstimos de funcionários (todos, pois não têm status)
        getDocs(query(
          collection(db, `users/${currentUser.uid}/staffLoans`),
          where('bookId', '==', bookData.id)
        ))
      ]);
      
      // Extrair códigos que estão emprestados (apenas empréstimos ativos)
      const borrowedCodes = [
        ...studentLoans.docs.map(doc => doc.data().bookCode),
        ...staffLoans.docs.map(doc => doc.data().bookCode)
      ].filter(code => code); // Remove valores undefined/null
      
      // Retornar códigos que não estão emprestados
      const availableCodes = allCodes.filter(code => !borrowedCodes.includes(code));
      
      return availableCodes;
    } catch (error) {
      console.error('Erro ao calcular códigos disponíveis:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!currentUser || !staffId || !bookId) {
      navigate('/staff-withdrawals');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do funcionário
        const staffDoc = await getDoc(doc(db, `users/${currentUser.uid}/staff/${staffId}`));
        if (!staffDoc.exists()) {
          throw new Error('Funcionário não encontrado');
        }
        const staffData = staffDoc.data();
        setStaff({
          id: staffDoc.id,
          name: staffData.name || '',
          position: staffData.position || '',
          contact: staffData.contact || ''
        });

        // Buscar dados do livro
        const bookDoc = await getDoc(doc(db, `users/${currentUser.uid}/books/${bookId}`));
        if (!bookDoc.exists()) {
          throw new Error('Livro não encontrado');
        }
        const bookData = bookDoc.data();
        
        const bookInfo = {
          id: bookDoc.id,
          code: bookData.code || '',
          codes: bookData.codes || [],
          title: bookData.title || '',
          authors: bookData.authors || [],
          publisher: bookData.publisher || ''
        };
        
        // Calcular códigos disponíveis
        const availableCodes = await calculateAvailableCodes(bookInfo);
        
        setBook({
          ...bookInfo,
          availableCodes
        });
        
        // Se há apenas um código disponível, selecioná-lo automaticamente
        if (availableCodes.length === 1) {
          setSelectedCode(availableCodes[0]);
        }

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, staffId, bookId, navigate]);

  const handleConfirm = async () => {
    if (!currentUser || !staff || !book || !selectedCode) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Verificar se ainda há exemplares disponíveis
      if (!book.availableCodes || book.availableCodes.length === 0) {
        setError('Não há exemplares disponíveis deste livro');
        return;
      }
      
      // Verificar se o código selecionado ainda está disponível
      if (!book.availableCodes.includes(selectedCode)) {
        setError('O código selecionado não está mais disponível');
        return;
      }
      
      // Registrar o empréstimo para funcionário
      const staffLoansRef = collection(db, `users/${currentUser.uid}/staffLoans`);
      await addDoc(staffLoansRef, {
        staffId: staff.id,
        staffName: staff.name,
        bookId: book.id,
        bookTitle: book.title,
        bookCode: selectedCode, // Código específico do exemplar
        loanDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      // Redirecionar para a página de staff withdrawals
      navigate('/staff-withdrawals', { 
        state: { 
          success: true,
          message: `Livro "${book.title}" (código: ${selectedCode}) emprestado com sucesso para ${staff.name}` 
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
    navigate(`/staff-withdrawals/${staffId}`, { 
      state: { staffName: staff?.name } 
    });
  };

  // Função para exibir os códigos
  const getDisplayCode = (book: Book): string => {
    if (book.codes && book.codes.length > 0) {
      return book.codes.length > 1 ? `${book.codes.length} cópias` : book.codes[0];
    }
    return book.code || '-';
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
        <h2>Confirmar Empréstimo</h2>
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
              <h4>Funcionário</h4>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nome:</span>
                <span className={styles.detailValue}>{staff?.name}</span>
              </div>
              {staff?.position && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cargo:</span>
                  <span className={styles.detailValue}>{staff.position}</span>
                </div>
              )}
              {staff?.contact && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Contato:</span>
                  <span className={styles.detailValue}>{staff.contact}</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailSection}>
              <h4>Livro</h4>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Título:</span>
                <span className={styles.detailValue}>{book?.title}</span>
              </div>
              
              {/* Seleção de código quando há múltiplos códigos disponíveis */}
              {book?.availableCodes && book.availableCodes.length > 1 && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Código do exemplar:</span>
                  <select 
                    value={selectedCode || ''} 
                    onChange={(e) => setSelectedCode(e.target.value)}
                    className={styles.codeSelect}
                  >
                    <option value="">Selecione um código</option>
                    {book.availableCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Mostrar código quando há apenas um disponível */}
              {book?.availableCodes && book.availableCodes.length === 1 && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Código:</span>
                  <span className={styles.detailValue}>{book.availableCodes[0]}</span>
                </div>
              )}
              
              {book?.availableCodes && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Exemplares disponíveis:</span>
                  <span className={styles.detailValue}>{book.availableCodes.length}</span>
                </div>
              )}
              
              {book?.authors && (Array.isArray(book.authors) ? book.authors.length > 0 : book.authors) && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Autores:</span>
                  <span className={styles.detailValue}>{Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</span>
                </div>
              )}
              {book?.publisher && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Editora:</span>
                  <span className={styles.detailValue}>{book.publisher}</span>
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
              <XMarkIcon width={20} height={20} />
              Cancelar
            </button>
            <button 
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={processing || !selectedCode || (book?.availableCodes?.length === 0)}
            >
              {processing ? 'Processando...' : (
                <>
                  <CheckIcon width={20} height={20} />
                  Confirmar Retirada
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffWithdrawalConfirmation; 