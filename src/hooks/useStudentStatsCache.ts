import { useState, useEffect } from 'react';
import { studentStatsCacheService, StudentStatsCacheData } from '../services/studentStatsCacheService';

export const useStudentStatsCache = (studentId: string) => {
  const [cachedData, setCachedDataState] = useState<StudentStatsCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const cached = studentStatsCacheService.getCachedData(studentId);
    if (cached) {
      setCachedDataState(cached);
      setIsLoading(false);
      console.log('✅ Dados das estatísticas carregados do cache global');
    } else {
      setIsLoading(true);
      console.log('🔄 Nenhum cache de estatísticas encontrado, será necessário buscar do servidor');
    }
  }, [studentId]);

  return {
    cachedData,
    isLoading,
    setCachedData: (data: StudentStatsCacheData) => {
      if (studentId) {
        studentStatsCacheService.setCachedData(studentId, data);
        setCachedDataState(data);
        console.log('💾 Dados das estatísticas salvos no cache global');
      }
    },
    clearCache: () => {
      if (studentId) {
        studentStatsCacheService.clearCache(studentId);
        setCachedDataState(null);
        console.log('🗑️ Cache das estatísticas limpo');
      }
    },
    clearAllStatsCache: () => {
      studentStatsCacheService.clearAllStatsCache();
      setCachedDataState(null);
      console.log('🧹 Todos os caches de estatísticas limpos');
    },
    getCacheStats: () => studentStatsCacheService.getCacheStats()
  };
};

