import { useState, useCallback } from 'react';

export interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  isCopied: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook para copiar texto para área de transferência
 * @param resetDelay - Tempo em ms para resetar o estado de "copiado" (padrão: 2000ms)
 * @returns Objeto com função de cópia, estado e função de reset
 */
export function useCopyToClipboard(resetDelay: number = 2000): UseCopyToClipboardReturn {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Tentar usar a API moderna do clipboard primeiro
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        
        // Resetar após delay
        setTimeout(() => {
          setIsCopied(false);
        }, resetDelay);
        
        return true;
      }
      
      // Fallback: método tradicional usando textarea temporário
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, resetDelay);
          return true;
        } else {
          throw new Error('Falha ao copiar usando execCommand');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao copiar';
      setError(errorMessage);
      console.error('Erro ao copiar para área de transferência:', err);
      return false;
    }
  }, [resetDelay]);

  const reset = useCallback(() => {
    setIsCopied(false);
    setError(null);
  }, []);

  return {
    copy,
    isCopied,
    error,
    reset
  };
}

