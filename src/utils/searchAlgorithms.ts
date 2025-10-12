/**
 * Algoritmos de busca otimizados para o sistema de biblioteca
 */

/**
 * Busca binária para encontrar um código exato em um array ordenado
 * Complexidade: O(log n)
 */
export const binarySearchCode = (
  sortedCodes: string[], 
  searchCode: string
): boolean => {
  let left = 0;
  let right = sortedCodes.length - 1;
  const searchLower = searchCode.toLowerCase();

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midCode = sortedCodes[mid].toLowerCase();

    if (midCode === searchLower) {
      return true;
    }

    if (midCode < searchLower) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return false;
};

/**
 * Busca binária modificada para substring em array ordenado
 * Encontra o índice onde começar a busca linear
 * Complexidade: O(log n) + O(k) onde k é o número de matches
 */
export const binarySearchSubstring = (
  sortedArray: string[],
  searchTerm: string
): boolean => {
  if (sortedArray.length === 0 || !searchTerm) return false;

  const searchLower = searchTerm.toLowerCase();
  let left = 0;
  let right = sortedArray.length - 1;

  // Encontrar o primeiro elemento que pode conter o termo
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = sortedArray[mid].toLowerCase();

    if (midValue < searchLower) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  // Busca linear a partir do ponto encontrado (limitada)
  const maxCheck = Math.min(left + 50, sortedArray.length); // Limitar busca linear
  for (let i = left; i < maxCheck; i++) {
    if (sortedArray[i].toLowerCase().includes(searchLower)) {
      return true;
    }
    // Se passou do prefixo, não há mais matches possíveis
    if (!sortedArray[i].toLowerCase().startsWith(searchLower[0])) {
      break;
    }
  }

  return false;
};

/**
 * Algoritmo de busca otimizado usando índice invertido
 * Pré-processa os dados para busca rápida
 */
export class SearchIndex<T> {
  private index: Map<string, Set<T>> = new Map();

  /**
   * Adiciona um item ao índice
   */
  addItem(item: T, searchableText: string): void {
    const words = this.tokenize(searchableText);
    
    words.forEach(word => {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word)!.add(item);
    });
  }

  /**
   * Busca itens que contenham o termo
   */
  search(searchTerm: string): Set<T> {
    const words = this.tokenize(searchTerm);
    if (words.length === 0) return new Set();

    // Pegar o conjunto de resultados da primeira palavra
    let results = this.index.get(words[0]) || new Set();

    // Intersectar com os resultados das outras palavras
    for (let i = 1; i < words.length; i++) {
      const wordResults = this.index.get(words[i]) || new Set();
      const resultsArray = Array.from(results);
      results = new Set(resultsArray.filter(x => wordResults.has(x)));
    }

    return results;
  }

  /**
   * Tokeniza o texto em palavras para indexação
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Limpa o índice
   */
  clear(): void {
    this.index.clear();
  }
}

/**
 * Cache LRU (Least Recently Used) para resultados de busca
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move para o final (mais recente)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // Remove se já existe
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Adiciona no final
    this.cache.set(key, value);

    // Remove o mais antigo se exceder o tamanho
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Função de debounce para otimizar chamadas de filtro
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Algoritmo de busca fuzzy (aproximada) usando distância de Levenshtein simplificada
 * Útil para typos e aproximações
 */
export const fuzzyMatch = (text: string, pattern: string): boolean => {
  const textLower = text.toLowerCase();
  const patternLower = pattern.toLowerCase();

  let textIndex = 0;
  let patternIndex = 0;

  while (textIndex < textLower.length && patternIndex < patternLower.length) {
    if (textLower[textIndex] === patternLower[patternIndex]) {
      patternIndex++;
    }
    textIndex++;
  }

  return patternIndex === patternLower.length;
};

/**
 * Normaliza strings para comparação (remove acentos, espaços extras, etc)
 */
export const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normaliza espaços
};

