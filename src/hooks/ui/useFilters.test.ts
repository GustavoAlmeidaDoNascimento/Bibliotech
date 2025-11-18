import { renderHook, act } from '@testing-library/react';
import { useFilters } from './useFilters';

describe('useFilters', () => {
  const mockItems = [
    { name: 'Apple', category: 'fruit', price: 1 },
    { name: 'Carrot', category: 'vegetable', price: 2 },
    { name: 'Banana', category: 'fruit', price: 1.5 }
  ];

  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useFilters({ items: mockItems }));
    expect(result.current.filters).toEqual({});
    expect(result.current.filteredItems).toEqual(mockItems);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should initialize with custom filters', () => {
    const { result } = renderHook(() => 
      useFilters({ items: mockItems, initialFilters: { category: 'fruit' } })
    );
    expect(result.current.filters).toEqual({ category: 'fruit' });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should set a filter', () => {
    const { result } = renderHook(() => useFilters({ items: mockItems }));
    
    act(() => {
      result.current.setFilter('category', 'fruit');
    });
    
    expect(result.current.filters.category).toBe('fruit');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should remove a filter', () => {
    const { result } = renderHook(() => 
      useFilters({ items: mockItems, initialFilters: { category: 'fruit' } })
    );
    
    act(() => {
      result.current.removeFilter('category');
    });
    
    expect(result.current.filters.category).toBeUndefined();
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => 
      useFilters({ items: mockItems, initialFilters: { category: 'fruit', price: 1 } })
    );
    
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter items based on active filters', () => {
    const { result } = renderHook(() => useFilters({ items: mockItems }));
    
    act(() => {
      result.current.setFilter('category', 'fruit');
    });
    
    expect(result.current.filteredItems).toEqual([
      { name: 'Apple', category: 'fruit', price: 1 },
      { name: 'Banana', category: 'fruit', price: 1.5 }
    ]);
  });

  it('should count active filters', () => {
    const { result } = renderHook(() => useFilters({ items: mockItems }));
    
    act(() => {
      result.current.setFilter('category', 'fruit');
      result.current.setFilter('price', 1);
    });
    
    expect(result.current.activeFilterCount).toBe(2);
  });

  it('should use custom filter function', () => {
    const customFilterFn = (item: typeof mockItems[0], filters: any) => {
      if (filters.minPrice) {
        return item.price >= filters.minPrice;
      }
      return true;
    };
    
    const { result } = renderHook(() => 
      useFilters({ items: mockItems, filterFn: customFilterFn })
    );
    
    act(() => {
      result.current.setFilter('minPrice', 1.5);
    });
    
    expect(result.current.filteredItems).toEqual([
      { name: 'Carrot', category: 'vegetable', price: 2 },
      { name: 'Banana', category: 'fruit', price: 1.5 }
    ]);
  });
});

