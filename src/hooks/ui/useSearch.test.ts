import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  const mockItems = ['apple', 'banana', 'cherry', 'date'];

  it('should initialize with empty search term', () => {
    const { result } = renderHook(() => useSearch({ items: mockItems }));
    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredItems).toEqual(mockItems);
  });

  it('should initialize with custom search term', () => {
    const { result } = renderHook(() => 
      useSearch({ items: mockItems, initialSearchTerm: 'app' })
    );
    expect(result.current.searchTerm).toBe('app');
  });

  it('should filter items based on search term', async () => {
    const { result } = renderHook(() => useSearch({ items: mockItems, debounceMs: 100 }));
    
    act(() => {
      result.current.setSearchTerm('app');
    });
    
    expect(result.current.isSearching).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    }, { timeout: 200 });
    
    expect(result.current.filteredItems).toEqual(['apple']);
  });

  it('should clear search', async () => {
    const { result } = renderHook(() => useSearch({ items: mockItems, debounceMs: 100 }));
    
    act(() => {
      result.current.setSearchTerm('app');
    });
    
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    }, { timeout: 200 });
    
    act(() => {
      result.current.clearSearch();
    });
    
    await waitFor(() => {
      expect(result.current.searchTerm).toBe('');
      expect(result.current.filteredItems).toEqual(mockItems);
    }, { timeout: 200 });
  });

  it('should use custom search function', async () => {
    const customItems = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 35 }
    ];
    
    const customSearchFn = (item: typeof customItems[0], term: string) => {
      return item.name.toLowerCase().includes(term.toLowerCase());
    };
    
    const { result } = renderHook(() => 
      useSearch({ items: customItems, searchFn: customSearchFn, debounceMs: 100 })
    );
    
    act(() => {
      result.current.setSearchTerm('john');
    });
    
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    }, { timeout: 200 });
    
    expect(result.current.filteredItems).toEqual([{ name: 'John', age: 30 }]);
  });
});

