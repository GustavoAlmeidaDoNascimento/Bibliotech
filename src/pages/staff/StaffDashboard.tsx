import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './StaffDashboard.module.css';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  contact?: string;
  notes?: string;
}

interface StaffLoan {
  id: string;
  staffId: string;
  bookId: string;
  bookTitle: string;
  loanDate: Timestamp | null;
  loanDateMillis: number;
}

const StaffDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loans, setLoans] = useState<StaffLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser || !id) return;
    fetchStaffAndLoans();
  }, [currentUser, id]);

  const fetchStaffAndLoans = async () => {
    if (!currentUser || !id) return;
    try {
      setLoading(true);
      setError('');

      const staffRef = doc(db, `users/${currentUser.uid}/staff/${id}`);
      const staffSnap = await getDoc(staffRef);
      if (!staffSnap.exists()) {
        setError('Professor/funcionário não encontrado');
        setStaff(null);
        setLoans([]);
        return;
      }
      const staffData = { id: staffSnap.id, ...staffSnap.data() } as StaffMember;
      setStaff(staffData);

      const loansRef = collection(db, `users/${currentUser.uid}/staffLoans`);
      const q = query(loansRef, where('staffId', '==', id));
      const loansSnap = await getDocs(q);

      const loanPromises = loansSnap.docs.map(async (docSnapshot) => {
        const loanData = docSnapshot.data();
        let bookTitle = 'Livro não encontrado';
        try {
          const bookRef = doc(db, `users/${currentUser.uid}/books/${loanData.bookId}`);
          const bookDoc = await getDoc(bookRef);
          if (bookDoc.exists()) {
            bookTitle = bookDoc.data()?.title || bookTitle;
          }
        } catch {
          // ignore
        }
        const rawLoanDate = loanData.loanDate;
        const loanDate: Timestamp | null =
          rawLoanDate instanceof Timestamp
            ? rawLoanDate
            : rawLoanDate?.toDate
              ? rawLoanDate
              : null;
        let loanDateMillis = 0;
        if (loanDate?.toMillis) {
          loanDateMillis = loanDate.toMillis();
        } else if (typeof rawLoanDate === 'string') {
          const parsed = Date.parse(rawLoanDate);
          loanDateMillis = Number.isNaN(parsed) ? 0 : parsed;
        }
        return {
          id: docSnapshot.id,
          staffId: loanData.staffId,
          bookId: loanData.bookId,
          bookTitle,
          loanDate,
          loanDateMillis,
        };
      });

      const loansWithDetails = await Promise.all(loanPromises);
      loansWithDetails.sort((a, b) => b.loanDateMillis - a.loanDateMillis);
      setLoans(loansWithDetails);
    } catch (err) {
      console.error('Erro ao carregar dados do professor/funcionário:', err);
      setError('Erro ao carregar dados. Tente novamente.');
      setStaff(null);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => navigate('/staff');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Professor/funcionário não encontrado'}</p>
          <button type="button" className={styles.backButton} onClick={navigateBack}>
            Voltar para a Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div>
            <h2>{staff.name}</h2>
            <p className={styles.subtitle}>Cargo: {staff.role}</p>
            {staff.contact && (
              <p className={styles.subtitle}>Contato: {staff.contact}</p>
            )}
          </div>
        </div>
        <div className={styles.headerButtons}>
          <button
            type="button"
            className={styles.backButton}
            onClick={navigateBack}
            title="Voltar para a lista de professores e funcionários"
          >
            <span aria-hidden="true" className={styles.backButtonIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </span>
            Voltar para a Lista
          </button>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => navigate(`/staff/${id}/edit`)}
            title="Editar professor/funcionário"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.editIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </button>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Histórico de retiradas</h3>
        <p className={styles.sectionDescription}>
          Livros atualmente em poder deste professor/funcionário. As devoluções são registradas em Locações de Professores e Funcionários.
        </p>
        {loans.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma retirada em aberto.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Livro</th>
                  <th>Data da retirada</th>
                  <th className={styles.actionsColumn}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className={styles.loanRow}>
                    <td>{loan.bookTitle}</td>
                    <td>
                      {loan.loanDate?.toDate
                        ? loan.loanDate.toDate().toLocaleDateString('pt-BR')
                        : 'Data não disponível'}
                    </td>
                    <td className={styles.actionsColumn}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => navigate('/staff-loans')}
                        title="Ir para locações para registrar devolução"
                      >
                        Ver em Locações
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default StaffDashboard;
