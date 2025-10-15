import { useState, useEffect } from 'react';

interface ClassStats {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  genreStats: { [genre: string]: number };
  studentRanking: Array<{ studentId: string; studentName: string; totalBooks: number }>;
  monthlyLoans: Array<{ month: string; count: number }>;
}

interface CacheData {
  data: ClassStats;
  timestamp: number;
  studentClassName: string;
  userId: string;
}

const CACHE_KEY_PREFIX = 'classStats_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useClassStatsCache = (studentClassName: string, userId: string | undefined) => {
  const [cachedData, setCachedDataState] = useState<ClassStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCacheKey = (className: string, uid: string) => {
    return `${CACHE_KEY_PREFIX}${uid}_${className}`;
  };

  const getCachedData = (className: string, uid: string): ClassStats | null => {
    try {
      const cacheKey = getCacheKey(className, uid);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log('📦 Nenhum cache encontrado para:', cacheKey);
        return null;
      }

      const cacheData: CacheData = JSON.parse(cached);
      const now = Date.now();
      const isExpired = now - cacheData.timestamp > CACHE_DURATION;

      if (isExpired) {
        console.log('⏰ Cache expirado para:', cacheKey);
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log('✅ Cache válido encontrado para:', cacheKey);
      return cacheData.data;
    } catch (error) {
      console.error('❌ Erro ao ler cache:', error);
      return null;
    }
  };

  const setCachedData = (className: string, uid: string, data: ClassStats) => {
    try {
      const cacheKey = getCacheKey(className, uid);
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
        studentClassName: className,
        userId: uid
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Dados salvos no cache:', cacheKey);
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
    }
  };

  const clearCache = (className: string, uid: string) => {
    try {
      const cacheKey = getCacheKey(className, uid);
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Cache removido:', cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  };

  const clearAllClassStatsCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const classStatsKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      classStatsKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Cache removido:', key);
      });
      
      console.log('🧹 Todos os caches de turma foram limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar todos os caches:', error);
    }
  };

  // Carregar dados do cache quando o componente monta
  useEffect(() => {
    if (!userId || !studentClassName) return;

    const cached = getCachedData(studentClassName, userId);
    if (cached) {
      setCachedDataState(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [studentClassName, userId]);

  return {
    cachedData,
    isLoading,
    setCachedData: (data: ClassStats) => {
      if (userId && studentClassName) {
        setCachedData(studentClassName, userId, data);
        setCachedDataState(data);
      }
    },
    clearCache: () => {
      if (userId && studentClassName) {
        clearCache(studentClassName, userId);
        setCachedDataState(null);
      }
    },
    clearAllClassStatsCache
  };
};
