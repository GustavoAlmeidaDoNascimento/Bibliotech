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
import styles from './Loans.module.css';

interface StaffLoan {
  id: string;
  staffId: string;
  bookId: string;
  loanDate: Timestamp | null;
  loanDateMillis?: number;
  staffName: string;
  bookTitle: string;
}

interface Book {
  id: string;
  title: string;
  available: boolean;
  description?: string;
}

interface Staff {
  id: string;
  name: string;
}

const StaffLoans = () => {
  const [loans, setLoans] = useState<StaffLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLoans, setFilteredLoans] = useState<StaffLoan[]>([]);
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
      setError('');
    } catch (error) {
      console.error('Erro ao buscar locações:', error);
      setError('Erro ao carregar locações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Locações de Professores e Funcionários</h2>
      </div>
      
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.searchIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome do funcionário ou título do livro..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando locações...</p>
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button 
              className={styles.closeButton}
              onClick={() => setError('')}
            >
              &times;
            </button>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.emptyIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3>Nenhuma locação encontrada</h3>
            <p>Nenhuma locação registrada para professores ou funcionários.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Livro</th>
                  <th>Data do Empréstimo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map(loan => (
                  <tr key={loan.id} className={styles.loanRow}>
                    <td>{loan.staffName}</td>
                    <td>{loan.bookTitle}</td>
                    <td>
                      {loan.loanDate && loan.loanDate.toDate 
                        ? loan.loanDate.toDate().toLocaleDateString('pt-BR') 
                        : 'Data não disponível'}
                    </td>
                    <td>
                      <button 
                        className={styles.returnButton}
                        onClick={() => handleReturn(loan.id, loan.bookId, loan.staffName, loan.bookTitle)}
                      >
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDialog.show && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Devolução</h3>
            <p>Confirma a devolução do livro "{confirmDialog.bookTitle}" emprestado para {confirmDialog.staffName}?</p>
            <div className={styles.modalActions}>
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

export default StaffLoans; 