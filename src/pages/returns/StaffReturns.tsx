import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Returns.module.css';

interface StaffLoan {
  id: string;
  staffId: string;
  bookId: string;
  loanDate: Timestamp | null;
  loanDateMillis?: number;
  staffName: string;
  bookTitle: string;
}

const ITEMS_PER_PAGE = 10;

const StaffReturns = () => {
  const [loans, setLoans] = useState<StaffLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLoans, setFilteredLoans] = useState<StaffLoan[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean, loanId: string, bookId: string, staffName: string, bookTitle: string}>({
    show: false,
    loanId: '',
    bookId: '',
    staffName: '',
    bookTitle: ''
  });
  
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchLoans();
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = loans.filter(loan => 
        loan.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLoans(filtered);
    } else {
      setFilteredLoans(loans);
    }
  }, [searchQuery, loans]);

  const fetchLoans = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const loansRef = collection(db, `users/${currentUser.uid}/staffLoans`);
      const querySnapshot = await getDocs(loansRef);
      
      const loanPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const loanData = docSnapshot.data();
        
        // Buscar informações do funcionário
        let staffName = 'Funcionário não encontrado';
        try {
          const staffRef = doc(db, `users/${currentUser.uid}/staff/${loanData.staffId}`);
          const staffDoc = await getDoc(staffRef);
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            staffName = staffData.name || 'Nome não disponível';
          }
        } catch (err) {
          console.error('Erro ao buscar dados do funcionário:', err);
        }
        
        // Buscar informações do livro
        let bookTitle = 'Livro não encontrado';
        try {
          const bookRef = doc(db, `users/${currentUser.uid}/books/${loanData.bookId}`);
          const bookDoc = await getDoc(bookRef);
          if (bookDoc.exists()) {
            const bookData = bookDoc.data();
            bookTitle = bookData.title || 'Título não disponível';
          }
        } catch (err) {
          console.error('Erro ao buscar dados do livro:', err);
        }
        
        const rawLoanDate = loanData.loanDate;
        const loanDate: Timestamp | null = rawLoanDate instanceof Timestamp
          ? rawLoanDate
          : (rawLoanDate?.toDate ? rawLoanDate : null);
        let loanDateMillis = 0;
        if (loanDate) {
          loanDateMillis = loanDate.toMillis();
        } else if (typeof rawLoanDate === 'string') {
          const parsed = Date.parse(rawLoanDate);
          loanDateMillis = Number.isNaN(parsed) ? 0 : parsed;
        }

        return {
          id: docSnapshot.id,
          staffId: loanData.staffId,
          bookId: loanData.bookId,
          loanDate,
          loanDateMillis,
          staffName,
          bookTitle
        };
      });
      
      const loansWithDetails = await Promise.all(loanPromises);
      loansWithDetails.sort((a, b) => (b.loanDateMillis || 0) - (a.loanDateMillis || 0));

      setLoans(loansWithDetails);
      setFilteredLoans(loansWithDetails);
      setVisibleCount(ITEMS_PER_PAGE);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar locações:', error);
      setError('Erro ao carregar locações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [searchQuery]);

  const loadMore = () => {
    if (!loading) {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    }
  };

  const handleReturn = (loanId: string, bookId: string, staffName: string, bookTitle: string) => {
    setConfirmDialog({
      show: true,
      loanId,
      bookId,
      staffName,
      bookTitle
    });
  };

  const confirmReturn = async () => {
    if (!currentUser) return;
    
    try {
      const { loanId, bookId } = confirmDialog;
      
      // CORREÇÃO: Remove apenas o registro de locação
      // O sistema de estoque é calculado dinamicamente baseado nos códigos 
      // disponíveis versus códigos emprestados, então não precisamos atualizar
      // o campo 'available' (que é obsoleto)
      
      // Remove o registro de locação do funcionário
      const loanRef = doc(db, `users/${currentUser.uid}/staffLoans/${loanId}`);
      await deleteDoc(loanRef);
      
      // Atualiza a lista na interface
      setLoans(prev => prev.filter(loan => loan.id !== loanId));
      setConfirmDialog({show: false, loanId: '', bookId: '', staffName: '', bookTitle: ''});
      
    } catch (error) {
      console.error('Erro ao devolver livro:', error);
      setError('Erro ao processar devolução. Tente novamente.');
    }
  };

  const closeDialog = () => {
    setConfirmDialog({show: false, loanId: '', bookId: '', staffName: '', bookTitle: ''});
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const displayedLoans = searchQuery ? filteredLoans : filteredLoans.slice(0, visibleCount);
  const hasMore = !searchQuery && filteredLoans.length > displayedLoans.length;

  return (
    <div className={styles.container}>
      <h2>Devoluções de Professores e Funcionários</h2>
      
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Buscar por nome do funcionário ou título do livro..."
          value={searchQuery}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.content}>
        {loading && loans.length === 0 ? (
          <div className={styles.loading}>Carregando locações...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : displayedLoans.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma locação registrada para professores ou funcionários.</p>
          </div>
        ) : (
          <>
            <div className={styles.cardGrid}>
              {displayedLoans.map(loan => (
                <div key={loan.id} className={styles.card}>
                  <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{loan.bookTitle}</h3>
                    </div>
                    <div className={styles.cardBody}>
                      <p><strong>Funcionário:</strong> {loan.staffName}</p>
                      <p>
                        <strong>Emprestado em:</strong> {' '}
                        {loan.loanDate && loan.loanDate.toDate 
                          ? loan.loanDate.toDate().toLocaleDateString('pt-BR') 
                          : 'Data não disponível'}
                      </p>
                    </div>
                    <div className={styles.cardFooter}>
                      <button 
                        className={styles.returnButton}
                        onClick={() => handleReturn(loan.id, loan.bookId, loan.staffName, loan.bookTitle)}
                      >
                        Devolver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {!searchQuery && hasMore && (
              <div className={styles.loadMoreContainer}>
                <button 
                  className={styles.loadMoreButton}
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {confirmDialog.show && (
        <div className={styles.confirmDialog}>
          <div className={styles.dialogContent}>
            <h3>Confirmar Devolução</h3>
            <p>Confirma a devolução do livro "{confirmDialog.bookTitle}" emprestado para {confirmDialog.staffName}?</p>
            <div className={styles.dialogActions}>
              <button 
                className={styles.cancelButton}
                onClick={closeDialog}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmButton}
                onClick={confirmReturn}
              >
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReturns; 