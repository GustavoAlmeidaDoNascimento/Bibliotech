import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface CacheMetadata {
  timestamp: number;
  lastUpdate: number;
  lastSyncTimestamp: number; // Timestamp da última sincronização com BD
  version: string;
}

interface DashboardCacheData {
  // Estatísticas principais
  activeLoansCount: number;
  overdueLoansCount: number;
  totalBooksCount: number;
  activeReadersCount: number;
  totalBooksRead: number;
  totalReadersCount: number;
  
  // Dados para gráficos
  genreData: Array<{ genre: string; count: number }>;
  topBooks: Array<{ id: string; title: string; borrowCount: number }>;
  topStudents: Array<{ id: string; name: string; classroom: string; booksRead: number }>;
  classroomPerformance: Array<{ classroom: string; booksRead: number; averageCompletion: number }>;
  monthlyLoanData: {
    labels: string[];
    borrowed: number[];
    returned: number[];
  };
  completionRateData: {
    labels: string[];
    rates: number[];
  };
}

interface CachedDashboard {
  data: DashboardCacheData;
  metadata: CacheMetadata;
}

const CACHE_VERSION = '2.0.0'; // Atualizado para suportar sincronização incremental
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos
const STALE_WHILE_REVALIDATE_DURATION = 30 * 60 * 1000; // 30 minutos

export function useDashboardCache(userId: string) {
  const cacheKey = `dashboard_cache_${userId}`;
  const [cachedData, setCachedData, removeCachedData] = useLocalStorage<CachedDashboard | null>(cacheKey, null);
  const [isStale, setIsStale] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Verifica se o cache está válido
  const isCacheValid = useCallback((cache: CachedDashboard | null): boolean => {
    if (!cache) return false;
    
    // Verifica se a versão é compatível
    if (cache.metadata.version !== CACHE_VERSION) return false;
    
    // Verifica se não expirou completamente
    const now = Date.now();
    const age = now - cache.metadata.timestamp;
    
    return age < STALE_WHILE_REVALIDATE_DURATION;
  }, []);

  // Verifica se o cache está fresco (não stale)
  const isCacheFresh = useCallback((cache: CachedDashboard | null): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const age = now - cache.metadata.timestamp;
    
    return age < CACHE_DURATION;
  }, []);

  // Estado do cache
  const cacheStatus = useCallback(() => {
    if (!cachedData) return 'empty';
    if (!isCacheValid(cachedData)) return 'invalid';
    if (isCacheFresh(cachedData)) return 'fresh';
    return 'stale';
  }, [cachedData, isCacheValid, isCacheFresh]);

  // Salva dados no cache
  const saveToCache = useCallback((data: DashboardCacheData, lastSyncTimestamp?: number) => {
    const now = Date.now();
    const cacheEntry: CachedDashboard = {
      data,
      metadata: {
        timestamp: now,
        lastUpdate: now,
        lastSyncTimestamp: lastSyncTimestamp || now,
        version: CACHE_VERSION
      }
    };
    
    setCachedData(cacheEntry);
    setIsStale(false);
  }, [setCachedData]);

  // Obtém dados do cache se válidos
  const getCachedData = useCallback((): DashboardCacheData | null => {
    const status = cacheStatus();
    
    if (status === 'fresh' || status === 'stale') {
      return cachedData!.data;
    }
    
    return null;
  }, [cachedData, cacheStatus]);

  // Verifica se deve revalidar
  const shouldRevalidate = useCallback((): boolean => {
    const status = cacheStatus();
    return status === 'empty' || status === 'invalid' || status === 'stale';
  }, [cacheStatus]);

  // Invalida cache manualmente
  const invalidateCache = useCallback(() => {
    removeCachedData();
    setIsStale(false);
  }, [removeCachedData]);

  // Marca cache como stale para próxima verificação
  const markAsStale = useCallback(() => {
    if (cachedData) {
      const updatedCache: CachedDashboard = {
        ...cachedData,
        metadata: {
          ...cachedData.metadata,
          lastUpdate: 0 // Força revalidação
        }
      };
      setCachedData(updatedCache);
      setIsStale(true);
    }
  }, [cachedData, setCachedData]);

  // Effect para verificar se cache está stale
  useEffect(() => {
    if (cachedData) {
      const status = cacheStatus();
      setIsStale(status === 'stale');
    }
  }, [cachedData, cacheStatus]);

  return {
    // Dados
    cachedData: getCachedData(),
    
    // Estados
    hasCache: !!cachedData,
    isStale,
    isValidating,
    cacheStatus: cacheStatus(),
    shouldRevalidate: shouldRevalidate(),
    
    // Métodos
    saveToCache,
    invalidateCache,
    markAsStale,
    setIsValidating,
    
    // Metadados
    lastUpdate: cachedData?.metadata.lastUpdate || 0,
    lastSyncTimestamp: cachedData?.metadata.lastSyncTimestamp || 0,
    cacheAge: cachedData ? Date.now() - cachedData.metadata.timestamp : 0
  };
}
