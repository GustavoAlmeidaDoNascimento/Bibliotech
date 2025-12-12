import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEducationalLevels } from '../contexts/EducationalLevelsContext';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, UsersIcon } from '@heroicons/react/24/outline';
import styles from './ClassesByLevel.module.css';

interface Student {
  id: string;
  name: string;
  classroom: string;
  shift: string;
  educationalLevelId?: string;
}

interface ClassInfo {
  name: string;
  shift: string;
  educationalLevelId?: string;
  studentsCount: number;
}

const ClassesByLevel: React.FC = () => {
  const { currentUser } = useAuth();
  const { levels, getLevelById } = useEducationalLevels();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingClass, setUpdatingClass] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchClasses = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Buscar todos os alunos para extrair as turmas
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      // Extrair turmas únicas dos alunos
      const classMap = new Map<string, ClassInfo>();
      
      students.forEach(student => {
        const classKey = `${student.classroom}_${student.shift || 'Não informado'}`;
        
        if (classMap.has(classKey)) {
          const existingClass = classMap.get(classKey)!;
          existingClass.studentsCount += 1;
        } else {
          classMap.set(classKey, {
            name: student.classroom,
            shift: student.shift || 'Não informado',
            educationalLevelId: student.educationalLevelId || '',
            studentsCount: 1
          });
        }
      });

      const classesArray = Array.from(classMap.values());
      setClasses(classesArray);

    } catch (err) {
      console.error('Erro ao buscar turmas:', err);
      setError('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [currentUser]);

  const handleClassClick = (className: string, shift: string, event?: React.MouseEvent) => {
    // Prevenir navegação se o clique foi no dropdown
    if (event && (event.target as HTMLElement).closest('select')) {
      return;
    }
    const encodedClassName = encodeURIComponent(className);
    const encodedShift = encodeURIComponent(shift);
    navigate(`/classes/${encodedClassName}/${encodedShift}`);
  };

  const handleLevelChange = async (className: string, shift: string, levelId: string) => {
    if (!currentUser || !levelId) return;

    const classKey = `${className}_${shift}`;
    setUpdatingClass(classKey);
    setError('');
    setSuccess('');

    try {
      // Buscar todos os alunos da turma
      const studentsRef = collection(db, `users/${currentUser.uid}/students`);
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const allStudents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];

      const classStudents = allStudents.filter(student => 
        student.classroom === className && 
        (student.shift || 'Não informado') === shift
      );

      if (classStudents.length === 0) {
        setError('Nenhum aluno encontrado nesta turma');
        return;
      }

      // Atualizar todos os alunos da turma
      const updatePromises = classStudents.map(async (student) => {
        const studentRef = doc(db, `users/${currentUser.uid}/students/${student.id}`);
        return updateDoc(studentRef, {
          educationalLevelId: levelId,
          updatedAt: serverTimestamp()
        });
      });

      // Salvar/atualizar dados da turma na coleção classes
      const classId = `${className}_${shift}`.replace(/[^a-zA-Z0-9]/g, '_');
      const classRef = doc(db, `users/${currentUser.uid}/classes/${classId}`);
      const classData = {
        name: className,
        shift: shift,
        educationalLevelId: levelId,
        studentsCount: classStudents.length,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      const classUpdatePromise = setDoc(classRef, classData, { merge: true });

      await Promise.all([...updatePromises, classUpdatePromise]);

      setSuccess('Nível educacional atribuído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);

      // Recarregar as turmas
      await fetchClasses();
    } catch (err) {
      console.error('Erro ao atualizar nível educacional:', err);
      setError('Erro ao atribuir nível educacional');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingClass(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h3>Turmas por Nível Educacional</h3>
        <div className={styles.loading}>Carregando turmas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3>Turmas por Nível Educacional</h3>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // Organizar turmas por nível
  const levelGroups = new Map<string, ClassInfo[]>();
  const unassignedClasses: ClassInfo[] = [];

  classes.forEach(classInfo => {
    if (classInfo.educationalLevelId) {
      const levelId = classInfo.educationalLevelId;
      if (!levelGroups.has(levelId)) {
        levelGroups.set(levelId, []);
      }
      levelGroups.get(levelId)!.push(classInfo);
    } else {
      unassignedClasses.push(classInfo);
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Turmas por Nível Educacional</h3>
        <div className={styles.summary}>
          <span className={styles.summaryText}>
            {classes.length} {classes.length === 1 ? 'turma' : 'turmas'} encontrada{classes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {success && (
        <div className={styles.successMessage}>{success}</div>
      )}

      {classes.length === 0 ? (
        <div className={styles.emptyState}>
          <AcademicCapIcon className={styles.emptyIcon} />
          <p>Nenhuma turma encontrada.</p>
          <p>As turmas aparecerão aqui quando houver alunos cadastrados.</p>
        </div>
      ) : (
        <div className={styles.levelsContainer}>
          {/* Turmas com nível definido */}
          {levels.map(level => {
            const levelClasses = levelGroups.get(level.id) || [];
            if (levelClasses.length === 0) return null;

            return (
              <div key={level.id} className={styles.levelGroup}>
                <div className={styles.levelHeader}>
                  <div className={styles.levelInfo}>
                    <h4 className={styles.levelName}>{level.name}</h4>
                    {level.abbreviation && (
                      <span className={styles.levelAbbr}>({level.abbreviation})</span>
                    )}
                  </div>
                  <div className={styles.levelStats}>
                    {levelClasses.length} {levelClasses.length === 1 ? 'turma' : 'turmas'}
                  </div>
                </div>
                <div className={styles.classesList}>
                  {levelClasses.map(classInfo => (
                    <div
                      key={`${classInfo.name}_${classInfo.shift}`}
                      className={styles.classCard}
                      onClick={() => handleClassClick(classInfo.name, classInfo.shift)}
                    >
                      <div className={styles.classHeader}>
                        <div className={styles.className}>{classInfo.name}</div>
                        <div className={styles.classShift}>{classInfo.shift}</div>
                      </div>
                      <div className={styles.classStats}>
                        <div className={styles.statItem}>
                          <UsersIcon className={styles.statIcon} />
                          <span>{classInfo.studentsCount} aluno{classInfo.studentsCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Turmas sem nível definido */}
          {unassignedClasses.length > 0 && (
            <div className={styles.levelGroup}>
              <div className={styles.levelHeader}>
                <div className={styles.levelInfo}>
                  <h4 className={styles.levelName}>Sem Nível Definido</h4>
                  <span className={styles.levelDescription}>
                    Selecione um nível no dropdown abaixo ou clique na turma para editá-la
                  </span>
                </div>
                <div className={styles.levelStats}>
                  {unassignedClasses.length} {unassignedClasses.length === 1 ? 'turma' : 'turmas'}
                </div>
              </div>
              <div className={styles.classesList}>
                {unassignedClasses.map(classInfo => {
                  const classKey = `${classInfo.name}_${classInfo.shift}`;
                  const isUpdating = updatingClass === classKey;
                  
                  return (
                    <div
                      key={classKey}
                      className={`${styles.classCard} ${styles.unassignedCard}`}
                      onClick={(e) => handleClassClick(classInfo.name, classInfo.shift, e)}
                    >
                      <div className={styles.classHeader}>
                        <div className={styles.className}>{classInfo.name}</div>
                        <div className={styles.classShift}>{classInfo.shift}</div>
                      </div>
                      <div className={styles.classStats}>
                        <div className={styles.statItem}>
                          <UsersIcon className={styles.statIcon} />
                          <span>{classInfo.studentsCount} aluno{classInfo.studentsCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <div className={styles.levelSelectorContainer} onClick={(e) => e.stopPropagation()}>
                        <label htmlFor={`level-select-${classKey}`} className={styles.levelSelectorLabel}>
                          Nível:
                        </label>
                        <select
                          id={`level-select-${classKey}`}
                          className={styles.levelSelector}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleLevelChange(classInfo.name, classInfo.shift, e.target.value);
                            }
                          }}
                          disabled={isUpdating}
                        >
                          <option value="">Selecione um nível</option>
                          {levels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name} {level.abbreviation && `(${level.abbreviation})`}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <span className={styles.updatingText}>Atualizando...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassesByLevel;
