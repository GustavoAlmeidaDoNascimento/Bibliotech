import { useState, useEffect } from 'react';
import { studentProfileCacheService, StudentProfileCacheData } from '../services/studentProfileCacheService';

export const useStudentProfileCache = (studentId: string) => {
  const [cachedData, setCachedDataState] = useState<StudentProfileCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const cached = studentProfileCacheService.getCachedData(studentId);
    if (cached) {
      setCachedDataState(cached);
      setIsLoading(false);
      console.log('✅ Dados do perfil carregados do cache global');
    } else {
      setIsLoading(true);
      console.log('🔄 Nenhum cache de perfil encontrado, será necessário buscar do servidor');
    }
  }, [studentId]);

  return {
    cachedData,
    isLoading,
    setCachedData: (data: StudentProfileCacheData) => {
      if (studentId) {
        studentProfileCacheService.setCachedData(studentId, data);
        setCachedDataState(data);
        console.log('💾 Dados do perfil salvos no cache global');
      }
    },
    clearCache: () => {
      if (studentId) {
        studentProfileCacheService.clearCache(studentId);
        setCachedDataState(null);
        console.log('🗑️ Cache do perfil limpo');
      }
    },
    clearAllProfileCache: () => {
      studentProfileCacheService.clearAllProfileCache();
      setCachedDataState(null);
      console.log('🧹 Todos os caches de perfil limpos');
    },
    getCacheStats: () => studentProfileCacheService.getCacheStats()
  };
};

