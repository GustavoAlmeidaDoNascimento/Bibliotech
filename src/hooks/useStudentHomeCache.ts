import { useState, useEffect } from 'react';
import { catalogCacheService, CatalogCacheData } from '../services/catalogCacheService';

export const useStudentHomeCache = (studentId: string) => {
  const [cachedData, setCachedDataState] = useState<CatalogCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const cached = catalogCacheService.getCachedData(studentId);
    if (cached) {
      setCachedDataState(cached);
      setIsLoading(false);
      console.log('✅ Dados do catálogo carregados do cache global');
    } else {
      setIsLoading(true);
      console.log('🔄 Nenhum cache de catálogo encontrado, será necessário buscar do servidor');
    }
  }, [studentId]);

  return {
    cachedData,
    isLoading,
    setCachedData: (data: CatalogCacheData) => {
      if (studentId) {
        catalogCacheService.setCachedData(studentId, data);
        setCachedDataState(data);
        console.log('💾 Dados do catálogo salvos no cache global');
      }
    },
    clearCache: () => {
      if (studentId) {
        catalogCacheService.clearCache(studentId);
        setCachedDataState(null);
        console.log('🗑️ Cache do catálogo limpo');
      }
    },
    clearAllCatalogCache: () => {
      catalogCacheService.clearAllCatalogCache();
      setCachedDataState(null);
      console.log('🧹 Todos os caches do catálogo limpos');
    },
    getCacheStats: () => catalogCacheService.getCacheStats()
  };
};

