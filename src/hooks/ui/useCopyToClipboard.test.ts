import { renderHook, act, waitFor } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

// Mock do navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should copy text to clipboard', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    
    await act(async () => {
      const success = await result.current.copy('test text');
      expect(success).toBe(true);
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    expect(result.current.isCopied).toBe(true);
  });

  it('should reset copied state after delay', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useCopyToClipboard(1000));
    
    await act(async () => {
      await result.current.copy('test');
    });
    
    expect(result.current.isCopied).toBe(true);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(result.current.isCopied).toBe(false);
    });
    
    jest.useRealTimers();
  });

  it('should handle copy errors', async () => {
    const error = new Error('Clipboard error');
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useCopyToClipboard());
    
    await act(async () => {
      const success = await result.current.copy('test');
      expect(success).toBe(false);
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.isCopied).toBe(false);
  });

  it('should reset state manually', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    
    await act(async () => {
      await result.current.copy('test');
    });
    
    expect(result.current.isCopied).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.isCopied).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

