import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTags } from '../../contexts/TagsContext';
import { useDistinctCodes } from '../../hooks/useDistinctCodes';
import AutocompleteInput from '../../components/AutocompleteInput';
import TagAutocomplete from '../../components/TagAutocomplete';

import styles from './RegisterBook.module.css'; // Reusando os estilos do RegisterBook

interface WriteOffInfo {
  code: string;
  reason: string;
  date: Date;
}

interface BookForm {
  codes: string[];
  writtenOffCodes?: WriteOffInfo[]; // Códigos que foram baixados com motivo
  title: string;
  genres: string[];
  tags: string[]; // Array de IDs das tags
  authors: string;
  publisher: string;
  acquisitionDate: string;
  shelf: string;
  collection: string;
  quantity: number;
  description: string;
}

interface LoanHistory {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookCode?: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned';
  createdAt: Date;
}

const EditBook = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [formData, setFormData] = useState<BookForm>({
    codes: [],
    writtenOffCodes: [],
    title: '',
    genres: [],
    tags: [],
    authors: '',
    publisher: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    shelf: '',
    collection: '',
    quantity: 1,
    description: ''
  });
  
  const [currentCode, setCurrentCode] = useState('');
  const [currentGenre, setCurrentGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [borrowedCodes, setBorrowedCodes] = useState<string[]>([]);
  const [showCodeMenu, setShowCodeMenu] = useState<string | null>(null);
  const [restorableCodeStatus, setRestorableCodeStatus] = useState<{[key: string]: boolean}>({});
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [codeToWriteOff, setCodeToWriteOff] = useState<string>('');
  const [writeOffReason, setWriteOffReason] = useState('');
  
  const { currentUser } = useAuth();
  const { genres, addGenre, capitalizeTag } = useTags();
  const useDistinctCodesEnabled = useDistinctCodes();
  const navigate = useNavigate();

  // Função helper para limpar mensagens quando o formulário é modificado
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Função para buscar códigos que estão emprestados
  const fetchBorrowedCodes = async () => {
    if (!currentUser || !bookId) return;

    try {
      // Buscar empréstimos ativos de alunos
      const studentLoansRef = collection(db, `users/${currentUser.uid}/loans`);
      const studentLoansQuery = query(
        studentLoansRef,
        where('bookId', '==', bookId),
        where('status', '==', 'active')
      );
      
      // Buscar empréstimos de funcionários
      const staffLoansRef = collection(db, `users/${currentUser.uid}/staffLoans`);
      const staffLoansQuery = query(
        staffLoansRef,
        where('bookId', '==', bookId)
      );
      
      const [studentLoansSnap, staffLoansSnap] = await Promise.all([
        getDocs(studentLoansQuery),
        getDocs(staffLoansQuery)
      ]);
      
      const borrowedCodesList = [
        ...studentLoansSnap.docs.map(doc => doc.data().bookCode),
        ...staffLoansSnap.docs.map(doc => doc.data().bookCode)
      ].filter(code => code); // Remove valores undefined/null
      
      
      setBorrowedCodes(borrowedCodesList);
    } catch (err) {
      console.error('Erro ao buscar códigos emprestados:', err);
      
      // Fallback: usar dados do histórico para extrair códigos emprestados ativos
      try {
        const borrowedCodesFromHistory = loanHistory
          .filter(loan => loan.status === 'active')
          .map(loan => loan.bookCode)
          .filter((code): code is string => Boolean(code));
        
        setBorrowedCodes(borrowedCodesFromHistory);
      } catch (fallbackErr) {
        console.error('Erro no fallback de códigos emprestados:', fallbackErr);
      }
    }
  };

  // Função para verificar status de restauração dos códigos baixados
  const updateRestorableStatus = async (writtenOffCodes: WriteOffInfo[]) => {
    if (!currentUser || !bookId || !writtenOffCodes.length) return;

    try {
      const status: {[key: string]: boolean} = {};
      
      for (const writeOffInfo of writtenOffCodes) {
        status[writeOffInfo.code] = await canRestoreCode(writeOffInfo.code);
      }
      
      setRestorableCodeStatus(status);
    } catch (err) {
      console.error('Erro ao verificar status de restauração:', err);
    }
  };

  const fetchLoanHistory = async () => {
    if (!currentUser || !bookId) return;

    try {
      setLoadingHistory(true);
      console.log(`Buscando histórico para o livro: ${bookId}, usuário: ${currentUser.uid}`);
      
      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const q = query(
        loansRef,
        where('bookId', '==', bookId)
      );
      
      const loansSnap = await getDocs(q);
      console.log(`Total de documentos encontrados na consulta: ${loansSnap.docs.length}`);
      
      // Vamos também fazer uma consulta de todos os loans para debug
      const allLoansQuery = query(loansRef);
      const allLoansSnap = await getDocs(allLoansQuery);
      console.log(`Total de loans na coleção: ${allLoansSnap.docs.length}`);
      
      // Verificar alguns documentos para debug
      if (allLoansSnap.docs.length > 0) {
        allLoansSnap.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`Documento ${index + 1}:`, {
            id: doc.id,
            bookId: data.bookId,
            bookTitle: data.bookTitle,
            studentName: data.studentName
          });
        });
      }
      
      const historyData = loansSnap.docs.map(doc => {
        const data = doc.data();
        
        // Converter timestamps para Dates
        const borrowDate = data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date();
        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date();
        const returnDate = data.returnDate?.toDate ? data.returnDate.toDate() : undefined;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        
        return {
          id: doc.id,
          ...data,
          borrowDate,
          dueDate,
          returnDate,
          createdAt
        };
      }) as LoanHistory[];
      
      // Ordenar no lado do cliente por data de criação (mais recente primeiro)
      historyData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      setLoanHistory(historyData);
      
      console.log(`Histórico encontrado para o livro ${bookId}:`, historyData.length, 'registros');
      if (historyData.length > 0) {
        console.log('Primeiro registro:', historyData[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico de retiradas:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.codeWrapper}`)) {
        setShowCodeMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchBook = async () => {
      if (!currentUser || !bookId) return;

      try {
        const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const bookData = bookSnap.data();
          
          // Compatibilidade com versão antiga (code -> codes)
          const formattedData = {
            ...bookData,
            codes: bookData.codes || (bookData.code ? [bookData.code] : []),
            // Migração: converter formato antigo para novo
            writtenOffCodes: (bookData.writtenOffCodes || []).map((item: any) => {
              if (typeof item === 'string') {
                // Formato antigo: apenas string
                return { code: item, reason: 'Motivo não informado', date: new Date() };
              } else {
                // Formato novo: objeto completo
                return item;
              }
            }),
            // Converte array de autores para string se necessário (compatibilidade)
            authors: Array.isArray(bookData.authors) 
              ? bookData.authors.join(', ') 
              : (bookData.authors || ''),
            // Garante que tags seja um array
            tags: bookData.tags || [],
            // Garante que description seja uma string (compatibilidade com livros antigos)
            description: bookData.description || ''
          } as BookForm;
          
          setFormData(formattedData);
          
          // Adiciona os gêneros às listas de sugestões
          formattedData.genres.forEach(addGenre);
          
          // Buscar histórico de retiradas e códigos emprestados após carregar o livro
          await Promise.all([fetchLoanHistory(), fetchBorrowedCodes()]);
          
          // Verificar status de restauração dos códigos baixados
          if (formattedData.writtenOffCodes && formattedData.writtenOffCodes.length > 0) {
            await updateRestorableStatus(formattedData.writtenOffCodes);
          }
        } else {
          setError('Livro não encontrado');
          navigate('/books');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Erro ao carregar dados do livro');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [currentUser, bookId, navigate]); // Removido addGenre das dependências

  // Recarregar códigos emprestados quando o histórico for carregado
  useEffect(() => {
    if (currentUser && bookId && loanHistory.length > 0) {
      fetchBorrowedCodes();
    }
  }, [currentUser, bookId, loanHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Só processa o submit se for intencional (através do botão)
    if (!isSubmittingForm) {
      return;
    }
    
    if (!formData.codes.length || !formData.title) {
      setError('Pelo menos um código e o título são campos obrigatórios');
      setIsSubmittingForm(false);
      return;
    }

    if (!currentUser || !bookId) {
      setError('Você precisa estar logado para editar livros');
      setIsSubmittingForm(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const bookData = {
        ...formData,
        // Se useDistinctCodes estiver ativado, a quantidade é o número de códigos
        quantity: useDistinctCodesEnabled ? formData.codes.length : formData.quantity,
        updatedAt: serverTimestamp(),
      };

      const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
      await updateDoc(bookRef, bookData);
      
      // Não redirecionar mais automaticamente - usuário permanece na página
      setError(''); // Limpar qualquer erro anterior
      setSuccess('Livro atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating book:', err);
      if (err instanceof Error) {
        setError(`Erro ao atualizar livro: ${err.message}`);
      } else {
        setError('Erro ao atualizar livro. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
      setIsSubmittingForm(false);
    }
  };

  const handleGenreSelect = (genre: string) => {
    const capitalizedGenre = capitalizeTag(genre);
    if (!formData.genres.includes(capitalizedGenre)) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, capitalizedGenre]
      }));
      addGenre(capitalizedGenre);
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  // Funções para gerenciar tags
  const handleTagSelect = (tagId: string) => {
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
    }
  };

  const handleTagRemove = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };

  const formatDate = (date: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatDateTime = (date: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusText = (loan: LoanHistory) => {
    if (loan.status === 'returned') return 'Devolvido';
    return 'Retirado';
  };

  const getStatusClass = (loan: LoanHistory) => {
    return loan.status === 'returned' ? styles.statusReturned : styles.statusActive;
  };

  // Função para determinar o estilo de um código
  const getCodeStyle = (code: string) => {
    // Comparação mais robusta - converte ambos para string
    const isBorrowed = borrowedCodes.some(borrowedCode => 
      String(borrowedCode).trim() === String(code).trim()
    );
    
    if (isBorrowed) {
      return 'borrowed'; // Amarelo - código retirado
    }
    return 'available'; // Azul normal - código disponível
  };

  // Função para determinar o estilo de um código baixado
  const getWrittenOffCodeStyle = () => {
    return 'writtenOff'; // Cinza - código baixado
  };

  // Função para verificar se um código pode ser restaurado
  const canRestoreCode = async (code: string): Promise<boolean> => {
    if (!currentUser || !bookId) return false;
    
    try {
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const allBooksQuery = query(booksRef);
      const allBooksSnapshot = await getDocs(allBooksQuery);
      
      return !allBooksSnapshot.docs.some(doc => {
        // Pular o livro atual
        if (doc.id === bookId) return false;
        
        const bookData = doc.data();
        const bookCodes = bookData.codes || [];
        const writtenOffCodes = (bookData.writtenOffCodes || []).map((item: any) => 
          typeof item === 'string' ? item : item.code
        );
        
        // Verificar se o código está ativo (não baixado) em outro livro
        const activeCodes = bookCodes.filter((bookCode: string) => !writtenOffCodes.includes(bookCode));
        
        return activeCodes.some((activeCode: string) => activeCode.toLowerCase() === code.toLowerCase());
      });
    } catch (err) {
      console.error('Erro ao verificar se código pode ser restaurado:', err);
      return false;
    }
  };

  // Função para adicionar código
  const handleAddCode = () => {
    const code = currentCode.trim();
    if (code && !formData.codes.includes(code)) {
      setFormData(prev => ({
        ...prev,
        codes: [...prev.codes, code]
      }));
      setCurrentCode('');
    }
  };

  // Função para abrir modal de baixa
  const openWriteOffModal = (code: string) => {
    setCodeToWriteOff(code);
    setWriteOffReason('');
    setShowWriteOffModal(true);
    setShowCodeMenu(null);
  };

  // Função para confirmar baixa com motivo
  const confirmWriteOff = async () => {
    if (!writeOffReason.trim()) {
      setError('Por favor, informe o motivo da baixa.');
      return;
    }
    
    await writeOffCode(codeToWriteOff, writeOffReason.trim());
    setShowWriteOffModal(false);
    setCodeToWriteOff('');
    setWriteOffReason('');
  };

  // Função para dar baixa em um código
  const writeOffCode = async (code: string, reason: string) => {
    if (!currentUser || !bookId) return;
    
    try {
      // Verificar se o código está emprestado
      if (borrowedCodes.includes(code)) {
        setError('Não é possível dar baixa em um código que está emprestado. Aguarde a devolução.');
        return;
      }
      
      const newWriteOffInfo: WriteOffInfo = {
        code,
        reason,
        date: new Date()
      };

      setFormData(prev => ({
        ...prev,
        codes: prev.codes.filter(c => c !== code),
        writtenOffCodes: [...(prev.writtenOffCodes || []), newWriteOffInfo]
      }));
      
      // Salvar no banco imediatamente
      const bookData = {
        ...formData,
        codes: formData.codes.filter(c => c !== code),
        writtenOffCodes: [...(formData.writtenOffCodes || []), newWriteOffInfo],
        updatedAt: serverTimestamp(),
      };
      
      const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
      await updateDoc(bookRef, bookData);
      
      // Atualizar status de restauração para o novo código baixado
      await updateRestorableStatus([...(formData.writtenOffCodes || []), newWriteOffInfo]);
      
      setShowCodeMenu(null);
    } catch (err) {
      console.error('Erro ao dar baixa no código:', err);
      setError('Erro ao dar baixa no código. Tente novamente.');
    }
  };

  // Função para desfazer baixa (desbaixar)
  const restoreCode = async (code: string) => {
    if (!currentUser || !bookId) return;
    
    try {
      // Verificar se já existe um código igual ativo em outro livro
      const booksRef = collection(db, `users/${currentUser.uid}/books`);
      const allBooksQuery = query(booksRef);
      const allBooksSnapshot = await getDocs(allBooksQuery);
      
      let codeAlreadyExists = false;
      let conflictingBookTitle = '';
      
      allBooksSnapshot.docs.forEach(doc => {
        // Pular o livro atual
        if (doc.id === bookId) return;
        
        const bookData = doc.data();
        const bookCodes = bookData.codes || [];
        const writtenOffCodes = (bookData.writtenOffCodes || []).map((item: any) => 
          typeof item === 'string' ? item : item.code
        );
        
        // Verificar se o código está ativo (não baixado) em outro livro
        const activeCodes = bookCodes.filter((bookCode: string) => !writtenOffCodes.includes(bookCode));
        
        if (activeCodes.some((activeCode: string) => activeCode.toLowerCase() === code.toLowerCase())) {
          codeAlreadyExists = true;
          conflictingBookTitle = bookData.title || 'Livro sem título';
        }
      });
      
      if (codeAlreadyExists) {
        setError(`Não é possível restaurar o código "${code}" pois já existe um código igual ativo no livro "${conflictingBookTitle}".`);
        setShowCodeMenu(null);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        codes: [...prev.codes, code],
        writtenOffCodes: (prev.writtenOffCodes || []).filter(item => item.code !== code)
      }));
      
      // Salvar no banco imediatamente
      const bookData = {
        ...formData,
        codes: [...formData.codes, code],
        writtenOffCodes: (formData.writtenOffCodes || []).filter(item => item.code !== code),
        updatedAt: serverTimestamp(),
      };
      
      const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
      await updateDoc(bookRef, bookData);
      
      // Atualizar status de restauração dos códigos baixados restantes
      const remainingWrittenOffCodes = (formData.writtenOffCodes || []).filter(item => item.code !== code);
      if (remainingWrittenOffCodes.length > 0) {
        await updateRestorableStatus(remainingWrittenOffCodes);
      }
      
      setShowCodeMenu(null);
    } catch (err) {
      console.error('Erro ao restaurar código:', err);
      setError('Erro ao restaurar código. Tente novamente.');
    }
  };

  // Função para excluir código permanentemente
  const deleteCodePermanently = async (code: string) => {
    if (!currentUser || !bookId) return;
    
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o código "${code}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      // Verificar se o código está emprestado
      if (borrowedCodes.includes(code)) {
        setError('Não é possível excluir um código que está emprestado. Aguarde a devolução.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        codes: prev.codes.filter(c => c !== code),
        writtenOffCodes: (prev.writtenOffCodes || []).filter(item => item.code !== code)
      }));
      
      // Salvar no banco imediatamente
      const bookData = {
        ...formData,
        codes: formData.codes.filter(c => c !== code),
        writtenOffCodes: (formData.writtenOffCodes || []).filter(item => item.code !== code),
        updatedAt: serverTimestamp(),
      };
      
      const bookRef = doc(db, `users/${currentUser.uid}/books/${bookId}`);
      await updateDoc(bookRef, bookData);
      
      setShowCodeMenu(null);
    } catch (err) {
      console.error('Erro ao excluir código:', err);
      setError('Erro ao excluir código. Tente novamente.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Editar Livro</h2>
        <button 
          className={styles.cancelButton}
          onClick={() => navigate('/books')}
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        <div className={styles.formGrid}>
          <div className={styles.mainSection}>
            <div className={styles.formGroup}>
              <label htmlFor="codes">Códigos * (cada exemplar tem seu código)</label>
              <div className={styles.codeInputWrapper}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    id="codes"
                    value={currentCode}
                    onChange={e => setCurrentCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCode();
                      }
                    }}
                    placeholder="Digite o código do exemplar"
                  />
                  <button
                    type="button"
                    onClick={handleAddCode}
                    className={styles.addCodeButton}
                    disabled={!currentCode.trim()}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <div className={styles.codesList}>
                {/* Códigos ativos */}
                {formData.codes.map(code => (
                  <div key={code} className={styles.codeWrapper}>
                    <span 
                      className={`${styles.codeTag} ${styles[getCodeStyle(code)]}`}
                      onClick={() => setShowCodeMenu(showCodeMenu === code ? null : code)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                      title={borrowedCodes.includes(code) ? 'Código retirado' : 'Código disponível - Clique para opções'}
                    >
                    {code}
                    </span>
                    
                    {showCodeMenu === code && (
                      <div className={styles.codeMenu}>
                        <button
                          type="button"
                          onClick={() => openWriteOffModal(code)}
                          className={styles.menuItem}
                          disabled={borrowedCodes.includes(code)}
                        >
                          <span className={styles.menuIcon}>↓</span>
                          Dar Baixa
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCodePermanently(code)}
                          className={styles.menuItemDanger}
                          disabled={borrowedCodes.includes(code)}
                        >
                          <span className={styles.menuIcon}>⌫</span>
                          Excluir
                        </button>

                      </div>
                    )}
                  </div>
                ))}
                
                {/* Códigos baixados */}
                {formData.writtenOffCodes && formData.writtenOffCodes.map(writeOffInfo => (
                  <div key={`written-off-${writeOffInfo.code}`} className={styles.codeWrapper}>
                    <span 
                      className={`${styles.codeTag} ${styles[getWrittenOffCodeStyle()]}`}
                      onClick={() => setShowCodeMenu(showCodeMenu === `written-off-${writeOffInfo.code}` ? null : `written-off-${writeOffInfo.code}`)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                      title="Código baixado - Clique para opções"
                    >
                      {writeOffInfo.code}
                    </span>
                    
                    {showCodeMenu === `written-off-${writeOffInfo.code}` && (
                      <div className={styles.codeMenu}>
                        <button
                          type="button"
                          className={styles.menuItem}
                          title={`Motivo: ${writeOffInfo.reason}\nData: ${new Date(writeOffInfo.date).toLocaleDateString('pt-BR')}`}
                        >
                          <span className={styles.menuIcon}>ⓘ</span>
                          Motivo
                          <span className={styles.menuIcon}>→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => restoreCode(writeOffInfo.code)}
                          className={styles.menuItem}
                          disabled={restorableCodeStatus[writeOffInfo.code] === false}
                          title={restorableCodeStatus[writeOffInfo.code] === false ? 'Não é possível restaurar: código já existe em outro livro' : 'Restaurar código'}
                        >
                          <span className={styles.menuIcon}>↑</span>
                          Restaurar
                          {restorableCodeStatus[writeOffInfo.code] === false && <span className={styles.blockedIcon}>⊘</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCodePermanently(writeOffInfo.code)}
                          className={styles.menuItemDanger}
                        >
                          <span className={styles.menuIcon}>⌫</span>
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCodeMenu(null)}
                          className={styles.menuItemCancel}
                        >
                          <span className={styles.menuIcon}>×</span>
                          Cancelar
                    </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {formData.codes.length === 0 && (
                <div className={styles.emptyCodesMessage}>
                  Adicione pelo menos um código para o livro
                </div>
              )}
              
              {/* Legenda dos códigos */}
              {(formData.codes.length > 0 || (formData.writtenOffCodes && formData.writtenOffCodes.length > 0)) && (
                <div className={styles.codeLegend}>
                  <small>
                    <strong>Legenda:</strong> 
                    <span className={styles.legendItem}><span className={styles.legendColor} style={{backgroundColor: 'var(--primary-color)'}}></span> Disponível</span>
                    <span className={styles.legendItem}><span className={styles.legendColor} style={{backgroundColor: '#f59e0b'}}></span> Retirado</span>
                    <span className={styles.legendItem}><span className={styles.legendColor} style={{backgroundColor: '#6b7280'}}></span> Baixado</span><br />
                    • Clique nos códigos para ver opções
                  </small>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Título do Livro *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={e => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  clearMessages();
                }}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="authors">Autores</label>
                <input
                  type="text"
                  id="authors"
                  value={formData.authors}
                  onChange={e => setFormData(prev => ({ ...prev, authors: e.target.value }))}
                  placeholder="Ex: João Silva, Maria Santos"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="collection">Coleção</label>
                <input
                  type="text"
                  id="collection"
                  value={formData.collection}
                  onChange={e => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                className={styles.descriptionTextarea}
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite uma breve descrição do livro, sinopse ou observações (opcional)"
                rows={4}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="acquisitionDate">Data de Aquisição</label>
                <input
                  type="date"
                  id="acquisitionDate"
                  value={formData.acquisitionDate}
                  onChange={e => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="shelf">Prateleira</label>
                <input
                  type="text"
                  id="shelf"
                  value={formData.shelf}
                  onChange={e => setFormData(prev => ({ ...prev, shelf: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.formGroup}>
              <AutocompleteInput
                id="genres"
                label="Gêneros/Classes"
                value={currentGenre}
                onChange={setCurrentGenre}
                onSelect={handleGenreSelect}
                suggestions={genres}
                placeholder="Digite para buscar ou adicionar"
              />
              <div className={styles.tags}>
                {formData.genres.map(genre => (
                  <span key={genre} className={styles.tag}>
                    {genre}
                    <button
                      type="button"
                      onClick={() => removeGenre(genre)}
                      className={styles.removeTag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <TagAutocomplete
                id="tags"
                label="Tags"
                selectedTags={formData.tags}
                onTagSelect={handleTagSelect}
                onTagRemove={handleTagRemove}
                placeholder="Digite para buscar ou criar tags..."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="publisher">Editora</label>
              <input
                type="text"
                id="publisher"
                value={formData.publisher}
                onChange={e => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
              />
            </div>

            {!useDistinctCodesEnabled && (
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantidade</label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
                <p className={styles.helpText}>
                  Número de exemplares disponíveis deste título
                </p>
              </div>
            )}
            
            {useDistinctCodesEnabled && (
              <div className={styles.formGroup}>
                <label>Quantidade Calculada</label>
                <div className={styles.calculatedQuantity}>
                  {formData.codes.length} exemplar(es)
                </div>
                <p className={styles.helpText}>
                  A quantidade é calculada automaticamente pelo número de códigos adicionados
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
            onClick={() => setIsSubmittingForm(true)}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* Seção de Histórico de Retiradas */}
      <div className={styles.historySection}>
        <h3>Histórico de Retiradas</h3>
        
        {loadingHistory ? (
          <div className={styles.loading}>Carregando histórico...</div>
        ) : loanHistory.length > 0 ? (
          <div className={styles.historyList}>
            {loanHistory.map(loan => (
              <div 
                key={loan.id} 
                className={styles.historyCard}
                onClick={() => navigate(`/student-loan-detail/${loan.id}`)}
                style={{ cursor: 'pointer' }}
                title="Clique para ver detalhes da retirada"
              >
                <div className={styles.historyHeader}>
                  <div className={styles.studentName}>
                  <span 
                    style={{
                      cursor: 'pointer',
                      color: '#4a90e2',
                      borderBottom: '1px dotted #4a90e2',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/students/${loan.studentId}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2c5aa0';
                      e.currentTarget.style.borderBottomStyle = 'solid';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#4a90e2';
                      e.currentTarget.style.borderBottomStyle = 'dotted';
                    }}
                    title={`Ir para o perfil de ${loan.studentName}`}
                  >
                    {loan.studentName}
                  </span>
                </div>
                  <span className={`${styles.statusTag} ${getStatusClass(loan)}`}>
                    {getStatusText(loan)}
                  </span>
                </div>
                <div className={styles.historyDetails}>
                  <div className={styles.historyDate}>
                    <span>Retirado em: {formatDateTime(loan.borrowDate)}</span>
                    <span>Prazo para devolução: {formatDate(loan.dueDate)}</span>
                    {loan.returnDate ? (
                      <span>Devolvido em: {formatDateTime(loan.returnDate)}</span>
                    ) : (
                      <span style={{ color: '#4a90e2', fontWeight: '500' }}>Locação ainda ativa</span>
                    )}
                    {loan.bookCode && (
                      <span>Código: <strong>{loan.bookCode}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyHistory}>
            <p>Este livro ainda não foi retirado.</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Baixa */}
      {showWriteOffModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Baixa do Código</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setShowWriteOffModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>Você está dando baixa no código: <strong>{codeToWriteOff}</strong></p>
              <p>Por favor, informe o motivo da baixa:</p>
              
              <textarea
                className={styles.reasonTextarea}
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                placeholder="Ex: Livro perdido, danificado, roubado..."
                maxLength={500}
                rows={4}
              />
              
              <div className={styles.characterCount}>
                {writeOffReason.length}/500 caracteres
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowWriteOffModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmButton}
                onClick={confirmWriteOff}
                disabled={!writeOffReason.trim()}
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBook; 