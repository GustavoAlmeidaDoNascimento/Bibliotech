import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  where, 
  getDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import styles from './Withdrawals.module.css';

interface Staff {
  id: string;
  name: string;
  position: string;
  contact?: string;
}

interface Filters {
  name: string;
  position: string;
}

const StaffWithdrawals = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaffList, setFilteredStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    position: ''
  });
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffData();
  }, [currentUser]);

  useEffect(() => {
    if (filters.name.trim() === '' && filters.position.trim() === '') {
      setFilteredStaffList(staffList);
      setFiltersApplied(false);
    }
  }, [filters, staffList]);

  const fetchStaffData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const staffRef = collection(db, `users/${currentUser.uid}/staff`);
      const q = query(staffRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const fetchedStaff = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      
      setStaffList(fetchedStaff);
      setFilteredStaffList(fetchedStaff);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      setError('Erro ao carregar lista de funcionários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const normalize = (value?: string) =>
    (value || '').toString().toLowerCase().trim();

  const applyFilters = () => {
    const nameFilter = normalize(filters.name);
    const positionFilter = normalize(filters.position);
    
    if (!nameFilter && !positionFilter) {
      setFiltersApplied(false);
      setFilteredStaffList(staffList);
      return;
    }
    
    const filtered = staffList.filter(staff => {
      const matchesName = !nameFilter || normalize(staff.name).includes(nameFilter);
      const matchesPosition = !positionFilter || normalize(staff.position).includes(positionFilter);
      return matchesName && matchesPosition;
    });
    
    setFilteredStaffList(filtered);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({ name: '', position: '' });
    setFiltersApplied(false);
    setFilteredStaffList(staffList);
  };

  const handleWithdraw = (staffId: string, staffName: string) => {
    navigate(`/staff-withdrawals/${staffId}`, { 
      state: { staffName } 
    });
  };

  const currentStaff = filtersApplied ? filteredStaffList : staffList;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Retiradas para Professores e Funcionários</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            {filtersApplied ? 'Filtros Aplicados' : 'Mostrar Filtros'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button 
            className={styles.dismissButton}
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}

      {showFilters && (
        <div className={styles.filters}>
          <form onSubmit={handleSubmit} className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filtrar por nome..."
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="position">Cargo</label>
              <input
                type="text"
                id="position"
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filtrar por cargo..."
              />
            </div>
          </form>

          <div className={styles.filterActions}>
            <button
              className={styles.applyFiltersButton}
              onClick={applyFilters}
            >
              Aplicar Filtros
            </button>
            <button
              className={styles.clearFiltersButton}
              onClick={clearFilters}
              disabled={!filtersApplied}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : staffList.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.emptyIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.479m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <h3>Nenhum professor ou funcionário registrado</h3>
            <p>Nenhum professor ou funcionário foi cadastrado no sistema.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filtersApplied && filteredStaffList.length === 0 ? (
              <div className={styles.noResults}>
                <p>Nenhum professor ou funcionário encontrado com os filtros aplicados.</p>
                <button
                  className={styles.clearFiltersButton}
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Contato</th>
                    <th className={styles.actionsColumn}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStaff.map(staff => (
                    <tr key={staff.id} className={styles.staffRow}>
                      <td>{staff.name}</td>
                      <td>{staff.position || '-'}</td>
                      <td>{staff.contact || '-'}</td>
                      <td className={styles.actionsColumn}>
                        <button 
                          className={styles.withdrawButton}
                          onClick={() => handleWithdraw(staff.id, staff.name)}
                        >
                          <BookOpenIcon className={styles.buttonIcon} />
                          Retirar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffWithdrawals; 