import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Withdrawals.module.css';

interface Student {
  id: string;
  name: string;
  classroom: string;
  contact: string;
}

interface Filters {
  name: string;
  classroom: string;
}

const StudentWithdrawals = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    classroom: ''
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [currentUser]);

  const fetchStudents = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        classroom: doc.data().classroom || '',
        contact: doc.data().contact || ''
      }));
      
      setStudents(fetchedStudents);
      setFilteredStudents(fetchedStudents);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
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

  const applyFilters = () => {
    const nameFilter = filters.name.toLowerCase().trim();
    const classroomFilter = filters.classroom.toLowerCase().trim();
    
    if (!nameFilter && !classroomFilter) {
      setFiltersApplied(false);
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => {
      const matchesName = !nameFilter || student.name.toLowerCase().includes(nameFilter);
      const matchesClassroom = !classroomFilter || student.classroom.toLowerCase().includes(classroomFilter);
      return matchesName && matchesClassroom;
    });
    
    setFilteredStudents(filtered);
    setFiltersApplied(true);
  };

  const clearFilters = () => {
    setFilters({ name: '', classroom: '' });
    setFiltersApplied(false);
    setFilteredStudents(students);
  };

  const handleWithdraw = (studentId: string, studentName: string) => {
    navigate(`/student-withdrawals/${studentId}`, { 
      state: { studentName } 
    });
  };

  const currentStudents = filtersApplied ? filteredStudents : students;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Retiradas de Alunos</h2>
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
              <label htmlFor="classroom">Turma</label>
              <input
                type="text"
                id="classroom"
                value={filters.classroom}
                onChange={(e) => handleFilterChange('classroom', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Filtrar por turma..."
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
        ) : students.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.emptyIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.479m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <h3>Nenhum aluno registrado</h3>
            <p>Nenhum aluno foi cadastrado no sistema.</p>
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
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Turma</th>
                    <th>Contato</th>
                    <th className={styles.actionsColumn}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.map(student => (
                    <tr key={student.id} className={styles.studentRow}>
                      <td>
                        {student.name ? (
                          <Link
                            to={`/students/${student.id}`}
                            className={styles.studentNameLink}
                          >
                            {student.name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{student.classroom || '-'}</td>
                      <td>{student.contact || '-'}</td>
                      <td className={styles.actionsColumn}>
                        <button 
                          className={styles.withdrawButton}
                          onClick={() => handleWithdraw(student.id, student.name)}
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

export default StudentWithdrawals; 