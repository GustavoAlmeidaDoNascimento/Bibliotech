import { StudentDashboardData } from './studentService';
import { RecommendationSection, BookWithStats } from './bookRecommendationService';

export interface CatalogCacheData {
  dashboardData: StudentDashboardData | null;
  recommendationSections: RecommendationSection[];
  allBooks: BookWithStats[];
  showcaseBook?: BookWithStats | null;
}

interface CacheEntry {
  data: CatalogCacheData;
  timestamp: number;
  studentId: string;
}

const CACHE_KEY_PREFIX = 'catalogData_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const catalogCacheService = {
  getCacheKey: (studentId: string) => {
    return `${CACHE_KEY_PREFIX}${studentId}`;
  },

  getCachedData: (studentId: string): CatalogCacheData | null => {
    try {
      const cacheKey = catalogCacheService.getCacheKey(studentId);
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
      console.error('❌ Erro ao ler cache do catálogo:', error);
      return null;
    }
  },

  setCachedData: (studentId: string, data: CatalogCacheData) => {
    try {
      const cacheKey = catalogCacheService.getCacheKey(studentId);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        studentId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('❌ Erro ao salvar cache do catálogo:', error);
    }
  },

  clearCache: (studentId: string) => {
    try {
      const cacheKey = catalogCacheService.getCacheKey(studentId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache do catálogo:', error);
    }
  },

  clearAllCatalogCache: () => {
    try {
      const keys = Object.keys(localStorage);
      const catalogKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      catalogKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('❌ Erro ao limpar todos os caches do catálogo:', error);
    }
  },

  getCacheStats: () => {
    const keys = Object.keys(localStorage);
    const catalogKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    return {
      totalEntries: catalogKeys.length,
      entries: catalogKeys.map(key => {
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

