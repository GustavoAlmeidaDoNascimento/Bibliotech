import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, deleteDoc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useInfiniteScroll } from '../../hooks';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './Students.module.css';
import { studentIndexService } from '../../services/studentIndexService';

interface Student {
  id: string;
  name: string;
  classroom: string;
  shift: string;
  contact: string;
  address: string;
  number: string;
  neighborhood: string;
  complement: string;
  notes: string;
  createdAt: any;
}

interface Filters {
  name: string;
  classroom: string;
  shift: string;
}

const Students = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    classroom: '',
    shift: ''
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchStudents = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      setStudents(fetchedStudents);
      setFilteredStudents(fetchedStudents);

      // Sincronizar índice global e garantir campo studentId nas fichas
      if (fetchedStudents.length > 0) {
        void (async () => {
          try {
            await Promise.allSettled(
              fetchedStudents.map(async student => {
                const studentDocRef = doc(db, `users/${currentUser.uid}/students/${student.id}`);

                if (!('studentId' in student)) {
                  try {
                    await updateDoc(studentDocRef, { studentId: student.id });
                  } catch (updateError) {
                    console.warn(`⚠️ Não foi possível atualizar studentId para ${student.id}:`, updateError);
                  }
                }

                await studentIndexService.upsertEntry(student.id, currentUser.uid);
              })
            );
          } catch (indexError) {
            console.warn('⚠️ Erro ao sincronizar índice global de alunos:', indexError);
          }
        })();
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const currentStudents = filtersApplied ? filteredStudents : students;

  // Hook de paginação com scroll infinito
  const {
    displayedItems: displayedStudents,
    isLoading: isLoadingMore,
    loadingRef,
    resetPagination
  } = useInfiniteScroll({
    items: currentStudents,
    itemsPerPage: 30,
    threshold: 200,
    enabled: !loading
  });

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [filtersApplied, filteredStudents, students, resetPagination]);

  const toggleStudentSelection = (studentId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentList = displayedStudents;
    if (selectedStudents.length === currentList.length) {
      // Se todos já estão selecionados, desmarca todos
      setSelectedStudents([]);
    } else {
      // Seleciona todos
      setSelectedStudents(currentList.map(student => student.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!currentUser || !window.confirm('Tem certeza que deseja excluir os alunos selecionados?')) return;

    try {
      setDeleting(true);
      for (const studentId of selectedStudents) {
        const studentRef = doc(db, `users/${currentUser.uid}/students/${studentId}`);
        await deleteDoc(studentRef);
        try {
          await studentIndexService.removeEntry(studentId);
        } catch (indexError) {
          console.warn(`⚠️ Não foi possível remover o aluno ${studentId} do índice global:`, indexError);
        }
      }
      await fetchStudents();
      setSelectedStudents([]);
    } catch (error) {
      console.error('Erro ao excluir alunos:', error);
      alert('Erro ao excluir alunos. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
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
    let result = [...students];
    const hasActiveFilters = Object.values(filters).some(Boolean);
    
    if (!hasActiveFilters) {
      setFilteredStudents([]);
      setFiltersApplied(false);
      return;
    }

    if (filters.name) {
      result = result.filter(student => 
        student.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.classroom) {
      result = result.filter(student => 
        student.classroom.toLowerCase().includes(filters.classroom.toLowerCase())
      );
    }

    if (filters.shift) {
      result = result.filter(student => 
        student.shift.toLowerCase().includes(filters.shift.toLowerCase())
      );
    }

    setFilteredStudents(result);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      classroom: '',
      shift: ''
    });
    setFilteredStudents([]);
    setFiltersApplied(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Alunos</h2>
        <div className={styles.headerActions}>
          {selectedStudents.length > 0 && (
            <>
              <button
                className={styles.selectAllButton}
                onClick={handleSelectAll}
              >
                {selectedStudents.length === displayedStudents.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <button
                className={styles.deleteButton}
                onClick={handleDeleteSelected}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir Selecionados'}
              </button>
            </>
          )}
          {selectedStudents.length === 0 && (
            <>
              <button
                className={styles.filterButton}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <>
                    <XMarkIcon className={styles.buttonIcon} />
                    Ocultar Filtros
                  </>
                ) : (
                  <>
                    <FunnelIcon className={styles.buttonIcon} />
                    Mostrar Filtros
                  </>
                )}
              </button>
              <Link to="/students/register" className={styles.registerButton}>
                Registrar Aluno
              </Link>
            </>
          )}
        </div>
      </div>

      {showFilters && selectedStudents.length === 0 && (
        <div className={styles.filters}>
          <form onSubmit={handleSubmit}>
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label htmlFor="name">Nome:</label>
                <input
                  type="text"
                  id="name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar por nome..."
                />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="classroom">Turma:</label>
                <input
                  type="text"
                  id="classroom"
                  value={filters.classroom}
                  onChange={(e) => handleFilterChange('classroom', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar por turma..."
                />
              </div>
              <div className={styles.filterGroup}>
                <label htmlFor="shift">Turno:</label>
                <select
                  id="shift"
                  value={filters.shift}
                  onChange={(e) => handleFilterChange('shift', e.target.value)}
                  className={styles.selectField}
                >
                  <option value="">Todos os turnos</option>
                  <option value="manhã">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
              </div>
            </div>
            <div className={styles.filterActions}>
              <button type="submit" className={styles.applyFiltersButton}>
                Aplicar Filtros
              </button>
              <button
                type="button"
                className={styles.clearFiltersButton}
                onClick={clearFilters}
              >
                Limpar Filtros
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <p>Carregando alunos...</p>
          </div>
        ) : students.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <h3>Nenhum aluno registrado</h3>
            <p>Clique em "Registrar Aluno" para adicionar seu primeiro aluno.</p>
            <Link to="/students/register" className={styles.registerButton}>
              Registrar Aluno
            </Link>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filtersApplied && filteredStudents.length === 0 ? (
              <div className={styles.noResults}>
                <p>Nenhum aluno encontrado com os filtros aplicados.</p>
                <button
                  className={styles.clearFiltersButton}
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxColumn}>
                        <div className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === displayedStudents.length && displayedStudents.length > 0}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th>Nome</th>
                      <th>Turma</th>
                      <th>Turno</th>
                      <th>Contato</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.map(student => (
                      <tr 
                        key={student.id} 
                        className={`${styles.studentRow} ${selectedStudents.includes(student.id) ? styles.selected : ''}`}
                        onClick={() => handleRowClick(student.id)}
                      >
                        <td 
                          className={styles.checkboxColumn}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStudentSelection(student.id);
                          }}
                        >
                          <div className={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStudentSelection(student.id, e);
                              }}
                              readOnly
                            />
                          </div>
                        </td>
                        <td>{student.name}</td>
                        <td>{student.classroom}</td>
                        <td>{student.shift || '-'}</td>
                        <td>{student.contact || '-'}</td>
                        <td>
                          <div className={styles.actions}>
                            {student.notes || '-'}
                            <div className={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                              <button 
                                className={styles.editButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/students/${student.id}/edit`);
                                }}
                                title="Editar aluno"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.actionIcon}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div ref={loadingRef} className={styles.loadingMore}>
                  {isLoadingMore ? 'Carregando mais alunos...' : ''}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Students; 