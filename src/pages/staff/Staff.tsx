import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Staff.module.css';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: string;
  contact: string;
  email: string;
  notes: string;
  createdAt: any;
}

interface Filters {
  name: string;
  role: string;
}

const Staff = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaffMembers, setFilteredStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffMembers, setSelectedStaffMembers] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    role: ''
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffMembers();
  }, [currentUser]);

  const fetchStaffMembers = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const staffRef = collection(db, `users/${currentUser.uid}/staff`);
      const q = query(staffRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedStaffMembers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      
      setStaffMembers(fetchedStaffMembers);
      setFilteredStaffMembers(fetchedStaffMembers);
    } catch (error) {
      console.error('Erro ao buscar professores e funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffMemberSelection = (staffMemberId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedStaffMembers(prev => {
      if (prev.includes(staffMemberId)) {
        return prev.filter(id => id !== staffMemberId);
      } else {
        return [...prev, staffMemberId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentList = filtersApplied ? filteredStaffMembers : staffMembers;
    if (selectedStaffMembers.length === currentList.length) {
      // Se todos já estão selecionados, desmarca todos
      setSelectedStaffMembers([]);
    } else {
      // Seleciona todos
      setSelectedStaffMembers(currentList.map(staffMember => staffMember.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!currentUser || !window.confirm('Tem certeza que deseja excluir os professores/funcionários selecionados?')) return;

    try {
      setDeleting(true);
      for (const staffMemberId of selectedStaffMembers) {
        const staffMemberRef = doc(db, `users/${currentUser.uid}/staff/${staffMemberId}`);
        await deleteDoc(staffMemberRef);
      }
      await fetchStaffMembers();
      setSelectedStaffMembers([]);
      setFiltersApplied(false);
      setFilters({ name: '', role: '' });
    } catch (error) {
      console.error('Erro ao excluir professores/funcionários:', error);
      alert('Erro ao excluir professores/funcionários. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = (staffMemberId: string) => {
    navigate(`/staff/${staffMemberId}`);
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

  const applyFilters = () => {
    const nameFilter = filters.name.toLowerCase().trim();
    const roleFilter = filters.role.toLowerCase().trim();
    
    if (!nameFilter && !roleFilter) {
      setFiltersApplied(false);
      setFilteredStaffMembers(staffMembers);
      return;
    }
    
    const filtered = staffMembers.filter(staffMember => {
      const matchesName = !nameFilter || staffMember.name.toLowerCase().includes(nameFilter);
      const matchesRole = !roleFilter || staffMember.role.toLowerCase().includes(roleFilter);
      return matchesName && matchesRole;
    });
    
    setFilteredStaffMembers(filtered);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({ name: '', role: '' });
    setFiltersApplied(false);
    setFilteredStaffMembers(staffMembers);
  };

  const currentStaffMembers = filtersApplied ? filteredStaffMembers : staffMembers;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Cadastro de Professores e Funcionários</h2>
        <div className={styles.headerActions}>
          {selectedStaffMembers.length > 0 && (
            <>
              <button
                className={styles.selectAllButton}
                onClick={handleSelectAll}
              >
                {selectedStaffMembers.length === currentStaffMembers.length && currentStaffMembers.length > 0 
                  ? 'Desmarcar Todos' 
                  : 'Selecionar Todos'}
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteSelected}
                disabled={deleting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.buttonIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                {deleting ? 'Excluindo...' : 'Excluir Selecionados'}
              </button>
            </>
          )}
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            {filtersApplied ? 'Filtros Aplicados' : 'Mostrar Filtros'}
          </button>
          <Link to="/staff/register" className={styles.registerButton}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.buttonIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Registrar Professor/Funcionário
          </Link>
        </div>
      </div>

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
              <label htmlFor="role">Cargo</label>
              <input
                type="text"
                id="role"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
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
        ) : staffMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.emptyIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.479m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <h3>Nenhum professor ou funcionário registrado</h3>
            <p>Clique em "Registrar Professor/Funcionário" para adicionar seu primeiro registro.</p>
            <Link to="/staff/register" className={styles.registerButton}>
              Registrar Professor/Funcionário
            </Link>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filtersApplied && filteredStaffMembers.length === 0 ? (
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
                    <th className={styles.checkboxColumn}>
                      <div className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={selectedStaffMembers.length === currentStaffMembers.length && currentStaffMembers.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th>Nome</th>
                    <th>Cargo</th>
                    <th>Contato</th>
                    <th>Observações</th>
                    <th className={styles.actionsColumn}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStaffMembers.map(staffMember => (
                    <tr 
                      key={staffMember.id} 
                      className={`${styles.staffRow} ${selectedStaffMembers.includes(staffMember.id) ? styles.selected : ''}`}
                      onClick={() => handleRowClick(staffMember.id)}
                    >
                      <td 
                        className={styles.checkboxColumn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStaffMemberSelection(staffMember.id);
                        }}
                      >
                        <div className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={selectedStaffMembers.includes(staffMember.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStaffMemberSelection(staffMember.id, e);
                            }}
                            readOnly
                          />
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.nameLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/staff/${staffMember.id}`);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2c5aa0';
                            e.currentTarget.style.borderBottomStyle = 'solid';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#4a90e2';
                            e.currentTarget.style.borderBottomStyle = 'dotted';
                          }}
                          title={`Ir para o perfil de ${staffMember.name}`}
                        >
                          {staffMember.name}
                        </span>
                      </td>
                      <td>{staffMember.role}</td>
                      <td>{staffMember.contact || '-'}</td>
                      <td>{staffMember.notes || '-'}</td>
                      <td className={styles.actionsColumn}>
                        <button 
                          className={styles.editButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/staff/${staffMember.id}/edit`);
                          }}
                          title="Editar professor/funcionário"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.actionIcon}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
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

export default Staff; 