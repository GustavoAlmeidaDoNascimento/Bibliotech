import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
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

  const handleClassClick = (className: string, shift: string) => {
    const encodedClassName = encodeURIComponent(className);
    const encodedShift = encodeURIComponent(shift);
    navigate(`/classes/${encodedClassName}/${encodedShift}`);
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
                    Configure o nível destas turmas clicando nelas para editá-las
                  </span>
                </div>
                <div className={styles.levelStats}>
                  {unassignedClasses.length} {unassignedClasses.length === 1 ? 'turma' : 'turmas'}
                </div>
              </div>
              <div className={styles.classesList}>
                {unassignedClasses.map(classInfo => (
                  <div
                    key={`${classInfo.name}_${classInfo.shift}`}
                    className={`${styles.classCard} ${styles.unassignedCard}`}
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
          )}
        </div>
      )}
    </div>
  );
};

export default ClassesByLevel;
