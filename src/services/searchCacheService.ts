/**
 * Serviço de cache para buscas de alunos e livros
 * Persiste dados e filtros no localStorage para evitar leituras desnecessárias no banco
 */

interface SearchCacheEntry<T> {
  data: T[];
  filters: Record<string, any>;
  timestamp: number;
  userId: string;
}

const CACHE_KEY_PREFIX = 'searchCache_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export const searchCacheService = {
  /**
   * Gera chave de cache baseada no tipo de busca e userId
   */
  getCacheKey: (type: 'students' | 'books', userId: string): string => {
    return `${CACHE_KEY_PREFIX}${type}_${userId}`;
  },

  /**
   * Obtém dados do cache
   */
  getCachedData: <T>(type: 'students' | 'books', userId: string): SearchCacheEntry<T> | null => {
    try {
      const cacheKey = searchCacheService.getCacheKey(type, userId);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheEntry: SearchCacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      const isExpired = now - cacheEntry.timestamp > CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheEntry;
    } catch (error) {
      console.error(`Erro ao ler cache de busca (${type}):`, error);
      return null;
    }
  },

  /**
   * Salva dados no cache
   */
  setCachedData: <T>(
    type: 'students' | 'books',
    userId: string,
    data: T[],
    filters: Record<string, any> = {}
  ): void => {
    try {
      const cacheKey = searchCacheService.getCacheKey(type, userId);
      const cacheEntry: SearchCacheEntry<T> = {
        data,
        filters,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error(`Erro ao salvar cache de busca (${type}):`, error);
    }
  },

  /**
   * Obtém apenas os filtros salvos
   */
  getCachedFilters: (type: 'students' | 'books', userId: string): Record<string, any> | null => {
    const cached = searchCacheService.getCachedData(type, userId);
    return cached ? cached.filters : null;
  },

  /**
   * Atualiza apenas os filtros no cache (sem atualizar os dados)
   */
  updateFilters: (type: 'students' | 'books', userId: string, filters: Record<string, any>): void => {
    try {
      const cacheKey = searchCacheService.getCacheKey(type, userId);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cacheEntry: SearchCacheEntry<any> = JSON.parse(cached);
        cacheEntry.filters = filters;
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      }
    } catch (error) {
      console.error(`Erro ao atualizar filtros no cache (${type}):`, error);
    }
  },

  /**
   * Limpa o cache de um tipo específico
   */
  clearCache: (type: 'students' | 'books', userId: string): void => {
    try {
      const cacheKey = searchCacheService.getCacheKey(type, userId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Erro ao limpar cache de busca (${type}):`, error);
    }
  },

  /**
   * Limpa todos os caches de busca
   */
  clearAllSearchCache: (userId?: string): void => {
    try {
      const keys = Object.keys(localStorage);
      const searchKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      if (userId) {
        // Limpar apenas caches do usuário específico
        const userSearchKeys = searchKeys.filter(key => key.includes(userId));
        userSearchKeys.forEach(key => localStorage.removeItem(key));
      } else {
        // Limpar todos os caches
        searchKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Erro ao limpar todos os caches de busca:', error);
    }
  },

  /**
   * Verifica se o cache está válido (não expirado)
   */
  isCacheValid: (type: 'students' | 'books', userId: string): boolean => {
    const cached = searchCacheService.getCachedData(type, userId);
    return cached !== null;
  }
};

