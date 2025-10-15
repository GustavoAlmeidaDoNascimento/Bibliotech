import { StudentDashboardData } from './studentService';

export interface StudentProfileCacheData {
  dashboardData: StudentDashboardData;
}

interface CacheEntry {
  data: StudentProfileCacheData;
  timestamp: number;
  studentId: string;
}

const CACHE_KEY_PREFIX = 'studentProfile_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const studentProfileCacheService = {
  getCacheKey: (studentId: string) => {
    return `${CACHE_KEY_PREFIX}${studentId}`;
  },

  getCachedData: (studentId: string): StudentProfileCacheData | null => {
    try {
      const cacheKey = studentProfileCacheService.getCacheKey(studentId);
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
      console.error('❌ Erro ao ler cache do perfil:', error);
      return null;
    }
  },

  setCachedData: (studentId: string, data: StudentProfileCacheData) => {
    try {
      const cacheKey = studentProfileCacheService.getCacheKey(studentId);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        studentId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('❌ Erro ao salvar cache do perfil:', error);
    }
  },

  clearCache: (studentId: string) => {
    try {
      const cacheKey = studentProfileCacheService.getCacheKey(studentId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('❌ Erro ao limpar cache do perfil:', error);
    }
  },

  clearAllProfileCache: () => {
    try {
      const keys = Object.keys(localStorage);
      const profileKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      profileKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('❌ Erro ao limpar todos os caches de perfil:', error);
    }
  },

  getCacheStats: () => {
    const keys = Object.keys(localStorage);
    const profileKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    return {
      totalEntries: profileKeys.length,
      entries: profileKeys.map(key => {
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

