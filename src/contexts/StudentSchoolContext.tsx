import React, { createContext, useContext, useState, useCallback } from 'react';

interface StudentSchoolCache {
  [studentId: string]: {
    schoolId: string;
    cachedAt: number;
  };
}

interface StudentSchoolContextType {
  getSchoolId: (studentId: string) => string | null;
  setSchoolId: (studentId: string, schoolId: string) => void;
  clearCache: (studentId?: string) => void;
}

const StudentSchoolContext = createContext<StudentSchoolContextType | undefined>(undefined);

const CACHE_KEY = 'bibliotech_student_school_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export const StudentSchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<StudentSchoolCache>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const getSchoolId = useCallback((studentId: string): string | null => {
    const cached = cache[studentId];
    if (!cached) return null;

    // Verificar se o cache ainda é válido
    const now = Date.now();
    if (now - cached.cachedAt > CACHE_DURATION) {
      console.log(`⏰ Cache expirado para aluno ${studentId}`);
      return null;
    }

    console.log(`✅ Usando escola em cache: ${cached.schoolId} para aluno ${studentId}`);
    return cached.schoolId;
  }, [cache]);

  const setSchoolId = useCallback((studentId: string, schoolId: string) => {
    const newCache = {
      ...cache,
      [studentId]: {
        schoolId,
        cachedAt: Date.now()
      }
    };
    
    setCache(newCache);
    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    console.log(`💾 Escola ${schoolId} salva em cache para aluno ${studentId}`);
  }, [cache]);

  const clearCache = useCallback((studentId?: string) => {
    if (studentId) {
      const newCache = { ...cache };
      delete newCache[studentId];
      setCache(newCache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      console.log(`🗑️ Cache removido para aluno ${studentId}`);
    } else {
      setCache({});
      localStorage.removeItem(CACHE_KEY);
      console.log(`🗑️ Todo cache removido`);
    }
  }, [cache]);

  return (
    <StudentSchoolContext.Provider value={{ getSchoolId, setSchoolId, clearCache }}>
      {children}
    </StudentSchoolContext.Provider>
  );
};

export const useStudentSchool = () => {
  const context = useContext(StudentSchoolContext);
  if (!context) {
    throw new Error('useStudentSchool deve ser usado dentro de StudentSchoolProvider');
  }
  return context;
};

