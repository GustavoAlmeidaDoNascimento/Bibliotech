import { renderHook, act } from '@testing-library/react';
import { useDropdown } from './useDropdown';

describe('useDropdown', () => {
  it('should initialize with closed state by default', () => {
    const { result } = renderHook(() => useDropdown());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.dropdownRef.current).toBeNull();
  });

  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useDropdown(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('should open dropdown', () => {
    const { result } = renderHook(() => useDropdown());
    
    act(() => {
      result.current.open();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should close dropdown', () => {
    const { result } = renderHook(() => useDropdown(true));
    
    act(() => {
      result.current.close();
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle dropdown state', () => {
    const { result } = renderHook(() => useDropdown());
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should provide dropdown ref', () => {
    const { result } = renderHook(() => useDropdown());
    expect(result.current.dropdownRef).toBeDefined();
    expect(result.current.dropdownRef.current).toBeNull();
  });
});

