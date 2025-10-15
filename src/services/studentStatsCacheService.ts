import { StudentDashboardData } from './studentService';

export interface StudentStatsCacheData {
  dashboardData: StudentDashboardData;
  totalBooksRead: number;
  favoriteGenre: string;
  genrePercentage: number;
  readingSpeed: number;
  bestQuarter: string;
  genresData: { labels: string[]; data: number[] };
  monthlyLoansData: {
    labels: string[];
    borrowed: number[];
    completed: number[];
  };
  quarterlyData: { labels: string[]; data: number[] };
}

interface CacheEntry {
  data: StudentStatsCacheData;
  timestamp: number;
  studentId: string;
}

const CACHE_KEY_PREFIX = 'studentStats_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const studentStatsCacheService = {
  getCacheKey: (studentId: string) => {
    return `${CACHE_KEY_PREFIX}${studentId}`;
  },

  getCachedData: (studentId: string): StudentStatsCacheData | null => {
    try {
      const cacheKey = studentStatsCacheService.getCacheKey(studentId);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheEntry: CacheEntry = JSON.parse(cached);
      const now = Date.now();
      const isExpired = now - cacheEntry.timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('❌ Erro ao ler cache das estatísticas:', error);
      return null;
    }
  },

  setCachedData: (studentId: string, data: StudentStatsCacheData) => {
    try {
      const cacheKey = studentStatsCacheService.getCacheKey(studentId);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        studentId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('❌ Erro ao salvar cache das estatísticas:', error);
    }
  },

  clearCache: (studentId: string) => {
    try {
      const cacheKey = studentStatsCacheService.getCacheKey(studentId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache das estatísticas:', error);
    }
  },

  clearAllStatsCache: () => {
    try {
      const keys = Object.keys(localStorage);
      const statsKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      statsKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('❌ Erro ao limpar todos os caches de estatísticas:', error);
    }
  },

  getCacheStats: () => {
    const keys = Object.keys(localStorage);
    const statsKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    return {
      totalEntries: statsKeys.length,
      entries: statsKeys.map(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheEntry: CacheEntry = JSON.parse(cached);
          return {
            key,
            timestamp: cacheEntry.timestamp,
            expiresIn: (cacheEntry.timestamp + CACHE_DURATION - Date.now()) / 1000,
            studentId: cacheEntry.studentId
          };
        }
        return { key, status: 'invalid' };
      })
    };
  }
};

