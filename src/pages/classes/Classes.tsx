import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useInfiniteScroll } from '../../hooks';
import { FunnelIcon, XMarkIcon, PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import styles from './Classes.module.css';

interface Student {
  id: string;
  name: string;
  classroom: string;
  shift: string;
  contact: string;
  createdAt: any;
}

interface ClassInfo {
  name: string;
  shift: string;
  studentsCount: number;
  students: Student[];
  createdAt?: any;
}

interface Filters {
  name: string;
  shift: string;
}

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassShift, setNewClassShift] = useState('');
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    shift: ''
  });

  const { currentUser } = useAuth();

  // Função para extrair turmas únicas dos alunos
  const extractClassesFromStudents = useCallback((studentsData: Student[]): ClassInfo[] => {
    const classMap = new Map<string, ClassInfo>();

    studentsData.forEach(student => {
      if (!student.classroom) return;

      const key = `${student.classroom}_${student.shift || 'Não informado'}`;
      
      if (classMap.has(key)) {
        const existingClass = classMap.get(key)!;
        existingClass.studentsCount++;
        existingClass.students.push(student);
      } else {
        classMap.set(key, {
          name: student.classroom,
          shift: student.shift || 'Não informado',
          studentsCount: 1,
          students: [student]
        });
      }
    });

    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

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
      
      
      // Extrair turmas dos alunos
      const extractedClasses = extractClassesFromStudents(fetchedStudents);
      setClasses(extractedClasses);
      setFilteredClasses(extractedClasses);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, extractClassesFromStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const currentClasses = filtersApplied ? filteredClasses : classes;

  // Hook de paginação com scroll infinito
  const {
    displayedItems: displayedClasses,
    isLoading: isLoadingMore,
    loadingRef,
    resetPagination
  } = useInfiniteScroll({
    items: currentClasses,
    itemsPerPage: 20,
    threshold: 200,
    enabled: !loading
  });

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [filtersApplied, filteredClasses, classes, resetPagination]);

  const toggleClassSelection = (className: string, shift: string) => {
    const classKey = `${className}_${shift}`;
    setSelectedClasses(prev => {
      if (prev.includes(classKey)) {
        return prev.filter(key => key !== classKey);
      } else {
        return [...prev, classKey];
      }
    });
  };

  const handleSelectAll = () => {
    const currentList = displayedClasses;
    const currentKeys = currentList.map(cls => `${cls.name}_${cls.shift}`);
    
    if (selectedClasses.length === currentKeys.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(currentKeys);
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

  const applyFilters = () => {
    let result = [...classes];
    const hasActiveFilters = Object.values(filters).some(Boolean);
    
    if (!hasActiveFilters) {
      setFilteredClasses([]);
      setFiltersApplied(false);
      return;
    }

    if (filters.name) {
      result = result.filter(cls => 
        cls.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.shift) {
      result = result.filter(cls => 
        cls.shift.toLowerCase().includes(filters.shift.toLowerCase())
      );
    }

    setFilteredClasses(result);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      shift: ''
    });
    setFilteredClasses([]);
    setFiltersApplied(false);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClassName.trim()) {
      alert('Nome da turma é obrigatório');
      return;
    }

    if (!currentUser) {
      alert('Você precisa estar logado para criar turmas');
      return;
    }

    // Verificar se a turma já existe
    const classExists = classes.some(cls => 
      cls.name.toLowerCase() === newClassName.toLowerCase() && 
      cls.shift.toLowerCase() === newClassShift.toLowerCase()
    );

    if (classExists) {
      alert('Esta turma já existe');
      return;
    }

    try {
      setCreating(true);
      
      // Criar um registro de turma no Firebase
      const classesRef = collection(db, `users/${currentUser.uid}/classes`);
      await addDoc(classesRef, {
        name: newClassName.trim(),
        shift: newClassShift || 'Não informado',
        createdAt: serverTimestamp(),
        studentsCount: 0
      });

      // Recarregar dados
      await fetchStudents();
      
      // Limpar formulário
      setNewClassName('');
      setNewClassShift('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao criar turma:', error);
      alert('Erro ao criar turma. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Turmas</h2>
        <div className={styles.headerActions}>
          {selectedClasses.length > 0 && (
            <>
              <button
                className={styles.selectAllButton}
                onClick={handleSelectAll}
              >
                {selectedClasses.length === displayedClasses.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </button>
            </>
          )}
          {selectedClasses.length === 0 && (
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
              <button
                className={styles.createButton}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <PlusIcon className={styles.buttonIcon} />
                Nova Turma
              </button>
            </>
          )}
        </div>
      </div>

      {showFilters && selectedClasses.length === 0 && (
        <div className={styles.filters}>
          <form onSubmit={handleSubmit}>
            <div className={styles.filterGrid}>
              <div className={styles.filterGroup}>
                <label htmlFor="name">Nome da Turma:</label>
                <input
                  type="text"
                  id="name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar por nome da turma..."
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
                  <option value="integral">Integral</option>
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

      {showCreateForm && (
        <div className={styles.createForm}>
          <form onSubmit={handleCreateClass}>
            <h3>Criar Nova Turma</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="className">Nome da Turma:</label>
                <input
                  type="text"
                  id="className"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex: 1º Ano A, 2º Ano B..."
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="classShift">Turno:</label>
                <select
                  id="classShift"
                  value={newClassShift}
                  onChange={(e) => setNewClassShift(e.target.value)}
                  className={styles.selectField}
                >
                  <option value="">Selecione o turno</option>
                  <option value="manhã">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                  <option value="integral">Integral</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.createButton}
                disabled={creating}
              >
                {creating ? 'Criando...' : 'Criar Turma'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowCreateForm(false);
                  setNewClassName('');
                  setNewClassShift('');
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <p>Carregando turmas...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <AcademicCapIcon className={styles.emptyStateIcon} />
            </div>
            <h3>Nenhuma turma encontrada</h3>
            <p>As turmas são criadas automaticamente quando você cadastra alunos ou você pode criar uma nova turma.</p>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateForm(true)}
            >
              <PlusIcon className={styles.buttonIcon} />
              Criar Primeira Turma
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filtersApplied && filteredClasses.length === 0 ? (
              <div className={styles.noResults}>
                <p>Nenhuma turma encontrada com os filtros aplicados.</p>
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
                            checked={selectedClasses.length === displayedClasses.length && displayedClasses.length > 0}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th>Nome da Turma</th>
                      <th>Turno</th>
                      <th>Quantidade de Alunos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedClasses.map(classInfo => {
                      const classKey = `${classInfo.name}_${classInfo.shift}`;
                      return (
                        <tr 
                          key={classKey}
                          className={`${styles.classRow} ${selectedClasses.includes(classKey) ? styles.selected : ''}`}
                        >
                          <td 
                            className={styles.checkboxColumn}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleClassSelection(classInfo.name, classInfo.shift);
                            }}
                          >
                            <div className={styles.checkbox}>
                              <input
                                type="checkbox"
                                checked={selectedClasses.includes(classKey)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                readOnly
                              />
                            </div>
                          </td>
                          <td className={styles.className}>{classInfo.name}</td>
                          <td className={styles.shift}>{classInfo.shift}</td>
                          <td className={styles.studentsCount}>
                            <span className={styles.badge}>
                              {classInfo.studentsCount} {classInfo.studentsCount === 1 ? 'aluno' : 'alunos'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div ref={loadingRef} className={styles.loadingMore}>
                  {isLoadingMore ? 'Carregando mais turmas...' : ''}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;
