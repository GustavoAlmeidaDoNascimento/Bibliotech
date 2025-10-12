import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

/**
 * Hook para carregar seções/componentes sob demanda usando Intersection Observer
 * Útil para carregar gráficos e dados pesados apenas quando visíveis
 */
export function useLazySection(options: LazyLoadOptions = {}) {
  const { rootMargin = '100px', threshold = 0.1 } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Criar Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          
          // Para de observar após primeira visualização (otimização)
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return {
    elementRef,
    isVisible,
    hasBeenVisible
  };
}

/**
 * Hook para gerenciar múltiplas seções lazy load
 * NOTA: Para uso simples, prefira usar useLazySection() múltiplas vezes
 */
export function useMultipleLazySections(sectionIds: string[]) {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>(
    () => sectionIds.reduce((acc, id) => ({ ...acc, [id]: false }), {})
  );

  const refsMap = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach(sectionId => {
      const element = refsMap.current.get(sectionId);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
            observer.unobserve(element);
          }
        },
        {
          rootMargin: '100px',
          threshold: 0.1
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [sectionIds]);

  const setRef = useCallback((sectionId: string) => {
    return (element: HTMLDivElement | null) => {
      refsMap.current.set(sectionId, element);
    };
  }, []);

  return {
    visibleSections,
    setRef
  };
}



