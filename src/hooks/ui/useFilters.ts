import { useState, useCallback, useMemo } from 'react';

export type FilterValue = string | number | boolean | string[] | null | undefined;

export interface FilterConfig<T> {
  [key: string]: FilterValue;
}

export interface UseFiltersOptions<T> {
  items: T[];
  filterFn?: (item: T, filters: FilterConfig<T>) => boolean;
  initialFilters?: FilterConfig<T>;
}

export interface UseFiltersReturn<T> {
  filters: FilterConfig<T>;
  setFilter: (key: string, value: FilterValue) => void;
  setFilters: (filters: FilterConfig<T>) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  filteredItems: T[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * Hook genérico para filtros
 * @param options - Opções de configuração
 * @returns Objeto com filtros, funções de controle e itens filtrados
 */
export function useFilters<T>({
  items,
  filterFn,
  initialFilters = {}
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<FilterConfig<T>>(initialFilters);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const setFilters = useCallback((newFilters: FilterConfig<T>) => {
    setFiltersState(newFilters);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFiltersState(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      if (value === null || value === undefined || value === '') {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    });
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key];
      if (value === null || value === undefined || value === '') {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    }).length;
  }, [filters]);

  // Função padrão de filtro (busca em propriedades do objeto)
  const defaultFilterFn = useCallback((item: T, filterConfig: FilterConfig<T>): boolean => {
    return Object.entries(filterConfig).every(([key, filterValue]) => {
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        return true;
      }

      const itemValue = (item as any)[key];
      
      if (Array.isArray(filterValue)) {
        // Filtro múltiplo (OR - qualquer um dos valores)
        return filterValue.some(fv => {
          if (Array.isArray(itemValue)) {
            return itemValue.some(iv => 
              String(iv).toLowerCase().includes(String(fv).toLowerCase())
            );
          }
          return String(itemValue).toLowerCase().includes(String(fv).toLowerCase());
        });
      }

      if (Array.isArray(itemValue)) {
        return itemValue.some(iv => 
          String(iv).toLowerCase().includes(String(filterValue).toLowerCase())
        );
      }

      return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
    });
  }, []);

  // Filtrar itens
  const filteredItems = useMemo(() => {
    if (!hasActiveFilters) {
      return items;
    }

    const filterFunction = filterFn || defaultFilterFn;
    return items.filter(item => filterFunction(item, filters));
  }, [items, filters, hasActiveFilters, filterFn, defaultFilterFn]);

  return {
    filters,
    setFilter,
    setFilters,
    removeFilter,
    clearFilters,
    filteredItems,
    hasActiveFilters,
    activeFilterCount
  };
}

