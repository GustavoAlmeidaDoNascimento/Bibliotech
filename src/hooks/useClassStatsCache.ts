import { useState, useEffect } from 'react';
import { globalCacheService, ClassStats } from '../services/globalCacheService';

export const useClassStatsCache = (studentClassName: string, userId: string | undefined) => {
  const [cachedData, setCachedDataState] = useState<ClassStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados do cache quando o componente monta
  useEffect(() => {
    if (!userId || !studentClassName) return;

    const cached = globalCacheService.getCachedData(studentClassName, userId);
    if (cached) {
      setCachedDataState(cached);
      setIsLoading(false);
      console.log('✅ Dados carregados do cache global');
    } else {
      setIsLoading(true);
      console.log('🔄 Nenhum cache encontrado, será necessário buscar do servidor');
    }
  }, [studentClassName, userId]);

  return {
    cachedData,
    isLoading,
    setCachedData: (data: ClassStats) => {
      if (userId && studentClassName) {
        globalCacheService.setCachedData(studentClassName, userId, data);
        setCachedDataState(data);
        console.log('💾 Dados salvos no cache global');
      }
    },
    clearCache: () => {
      if (userId && studentClassName) {
        globalCacheService.clearCache(studentClassName, userId);
        setCachedDataState(null);
        console.log('🗑️ Cache limpo');
      }
    },
    clearAllClassStatsCache: () => {
      globalCacheService.clearAllClassStatsCache();
      setCachedDataState(null);
      console.log('🧹 Todos os caches limpos');
    },
    getCacheStats: () => globalCacheService.getCacheStats()
  };
};
