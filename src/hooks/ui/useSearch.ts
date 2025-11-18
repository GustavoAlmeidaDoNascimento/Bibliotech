import { useState, useEffect, useCallback, useMemo } from 'react';

export interface UseSearchOptions<T> {
  items: T[];
  searchFn?: (item: T, searchTerm: string) => boolean;
  debounceMs?: number;
  initialSearchTerm?: string;
}

export interface UseSearchReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredItems: T[];
  isSearching: boolean;
  clearSearch: () => void;
}

/**
 * Hook genérico para busca com debounce
 * @param options - Opções de configuração
 * @returns Objeto com termo de busca, função para atualizar, itens filtrados e estado
 */
export function useSearch<T>({
  items,
  searchFn,
  debounceMs = 300,
  initialSearchTerm = ''
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce do termo de busca
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Função padrão de busca (busca em strings)
  const defaultSearchFn = useCallback((item: T, term: string): boolean => {
    if (!term.trim()) return true;
    
    const searchable = String(item).toLowerCase();
    return searchable.includes(term.toLowerCase());
  }, []);

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const searchFunction = searchFn || defaultSearchFn;
    return items.filter(item => searchFunction(item, debouncedSearchTerm));
  }, [items, debouncedSearchTerm, searchFn, defaultSearchFn]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    clearSearch
  };
}

