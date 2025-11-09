import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpenIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import styles from './CodeSelection.module.css';

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
  quantity?: number;
  availableCodes?: string[]; // Códigos disponíveis calculados dinamicamente
  description?: string;
}

interface LocationState {
  studentName: string;
  bookTitle: string;
}

const CodeSelection = () => {
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  
  const { currentUser } = useAuth();

  // Função para calcular códigos disponíveis
  const calculateAvailableCodes = async (bookData: Book): Promise<string[]> => {
    if (!currentUser || !bookData.id) return [];
    
    const allCodes = bookData.codes || [];
    if (allCodes.length === 0) return [];
    
    try {
      // Buscar empréstimos ativos para este livro
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const activeLoansQuery = query(
        loansRef,
        where('bookId', '==', bookData.id),
        where('status', '==', 'active')
      );
      
      const activeLoansSnapshot = await getDocs(activeLoansQuery);
      
      // Extrair códigos que estão emprestados (apenas empréstimos ativos)
      const borrowedCodes = activeLoansSnapshot.docs
        .map(doc => doc.data().bookCode)
        .filter(code => code); // Remove valores undefined/null
      
      // Retornar códigos que não estão emprestados
      const availableCodes = allCodes.filter(code => !borrowedCodes.includes(code));
      
      return availableCodes;
    } catch (error) {
      console.error('Erro ao calcular códigos disponíveis:', error);
      return allCodes;
    }
  };

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
        
        const bookInfo = {
          id: bookDoc.id,
          codes,
          title: bookData.title || '',
          authors: bookData.authors || [],
          publisher: bookData.publisher || '',
          quantity: bookData.quantity || 0
        };
        
        // Calcular códigos disponíveis
        const availableCodes = await calculateAvailableCodes(bookInfo);
        
        setBook({
          ...bookInfo,
          availableCodes
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

  const handleCodeSelect = (code: string) => {
    setSelectedCode(code);
  };

  const handleContinue = () => {
    if (!selectedCode || !student || !book) return;
    
    navigate(`/withdrawal-confirmation/${studentId}/${bookId}`, {
      state: {
        studentName: student.name,
        bookTitle: book.title,
        selectedCode
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error || !book || !student) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Dados não encontrados'}</div>
      </div>
    );
  }

  // Usar códigos disponíveis calculados dinamicamente
  const displayCodes = book.availableCodes || [];
  const filteredCodes = displayCodes.filter(code =>
    code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Selecionar Código do Exemplar</h2>
        <p className={styles.headerSubtitle}>
          Escolha qual exemplar de "{book?.title}" será retirado por {student?.name}
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.codeSelectionContainer}>
          {/* Informações do livro */}
          <div className={styles.selectedBookInfo}>
            <BookOpenIcon className={styles.selectedBookIcon} />
            <div className={styles.selectedBookDetails}>
              <h3>{book?.title}</h3>
              {book?.authors && (Array.isArray(book.authors) ? book.authors.length > 0 : book.authors) && (
                <p>Por: {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</p>
              )}
              <p className={styles.availableCount}>
                {book?.availableCodes?.length} exemplar(es) disponível(eis)
              </p>
            </div>
          </div>

          {/* Campo de pesquisa */}
          {book && book.codes.length > 0 && (
            <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                <MagnifyingGlassIcon className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Pesquisar código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>
          )}

          {/* Lista de códigos */}
          <div className={styles.codesGrid}>
            {filteredCodes.length > 0 ? (
              filteredCodes.map(code => (
                <div
                  key={code}
                  className={`${styles.codeCard} ${selectedCode === code ? styles.selected : ''}`}
                  onClick={() => handleCodeSelect(code)}
                >
                  <div className={styles.codeNumber}>{code}</div>
                  {selectedCode === code && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.noCodes}>
                <p>Nenhum código encontrado com a pesquisa "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Código selecionado */}
          {selectedCode && (
            <div className={styles.selectedInfo}>
              <div className={styles.selectedLabel}>Código selecionado:</div>
              <div className={styles.selectedCode}>{selectedCode}</div>
            </div>
          )}

          {/* Ações */}
          <div className={styles.actions}>
            <button 
              className={styles.backButton}
              onClick={() => navigate(`/student-withdrawals/${studentId}`)}
            >
              Voltar
            </button>
            <button 
              className={styles.nextButton}
              onClick={handleContinue}
              disabled={!selectedCode}
            >
              Avançar
              <ArrowRightIcon className={styles.buttonIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSelection; 