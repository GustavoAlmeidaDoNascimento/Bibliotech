import { useState, useEffect } from 'react';

interface UseCounterAnimationOptions {
  duration?: number; // Duração da animação em milissegundos
  startDelay?: number; // Delay antes de iniciar a animação
  easing?: 'linear' | 'easeOut' | 'easeInOut'; // Tipo de easing
}

export const useCounterAnimation = (
  targetValue: number,
  options: UseCounterAnimationOptions = {}
) => {
  const { duration = 2000, startDelay = 0, easing = 'easeOut' } = options;
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        let easedProgress = progress;
        
        // Aplicar easing
        switch (easing) {
          case 'easeOut':
            easedProgress = 1 - Math.pow(1 - progress, 3);
            break;
          case 'easeInOut':
            easedProgress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            break;
          case 'linear':
          default:
            easedProgress = progress;
        }
        
        const newValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
        setCurrentValue(newValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentValue(targetValue);
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [targetValue, duration, startDelay, easing]);

  return { currentValue, isAnimating };
};
