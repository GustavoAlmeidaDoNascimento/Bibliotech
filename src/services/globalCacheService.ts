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
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

class GlobalCacheService {
  private static instance: GlobalCacheService;
  private cache: Map<string, CacheData> = new Map();

  private constructor() {
    this.loadFromLocalStorage();
  }

  static getInstance(): GlobalCacheService {
    if (!GlobalCacheService.instance) {
      GlobalCacheService.instance = new GlobalCacheService();
    }
    return GlobalCacheService.instance;
  }

  private getCacheKey(className: string, uid: string): string {
    return `${CACHE_KEY_PREFIX}${uid}_${className}`;
  }

  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const classStatsKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      classStatsKeys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const cacheData: CacheData = JSON.parse(cached);
            this.cache.set(key, cacheData);
            console.log('📦 Cache carregado do localStorage:', key);
          } catch (error) {
            console.error('❌ Erro ao carregar cache do localStorage:', error);
            localStorage.removeItem(key);
          }
        }
      });
      
      console.log(`📦 ${this.cache.size} itens de cache carregados do localStorage`);
    } catch (error) {
      console.error('❌ Erro ao carregar cache do localStorage:', error);
    }
  }

  private saveToLocalStorage(key: string, data: CacheData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Cache salvo no localStorage:', key);
    } catch (error) {
      console.error('❌ Erro ao salvar cache no localStorage:', error);
    }
  }

  getCachedData(className: string, uid: string): ClassStats | null {
    const cacheKey = this.getCacheKey(className, uid);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      console.log('📦 Nenhum cache encontrado para:', cacheKey);
      return null;
    }

    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_DURATION;

    if (isExpired) {
      console.log('⏰ Cache expirado para:', cacheKey);
      this.cache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log('✅ Cache válido encontrado para:', cacheKey);
    return cached.data;
  }

  setCachedData(className: string, uid: string, data: ClassStats): void {
    const cacheKey = this.getCacheKey(className, uid);
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
      studentClassName: className,
      userId: uid
    };

    this.cache.set(cacheKey, cacheData);
    this.saveToLocalStorage(cacheKey, cacheData);
    console.log('💾 Dados salvos no cache global:', cacheKey);
  }

  clearCache(className: string, uid: string): void {
    const cacheKey = this.getCacheKey(className, uid);
    this.cache.delete(cacheKey);
    localStorage.removeItem(cacheKey);
    console.log('🗑️ Cache removido:', cacheKey);
  }

  clearAllClassStatsCache(): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      this.cache.delete(key);
      localStorage.removeItem(key);
      console.log('🗑️ Cache removido:', key);
    });
    
    console.log('🧹 Todos os caches de turma foram limpos');
  }

  getCacheStats(): { totalItems: number; keys: string[] } {
    return {
      totalItems: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const globalCacheService = GlobalCacheService.getInstance();
export type { ClassStats };
