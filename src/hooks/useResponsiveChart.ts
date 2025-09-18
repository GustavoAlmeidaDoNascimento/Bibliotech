import { useState, useEffect } from 'react';

interface ResponsiveChartOptions {
  isMobile: boolean;
  isSmallMobile: boolean;
  chartHeight: number;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  fontSize: number;
  padding: number;
  maxRotation: number;
}

export const useResponsiveChart = (): ResponsiveChartOptions => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isMobile = screenSize.width < 768;
  const isSmallMobile = screenSize.width < 480;
  const isExtraSmall = screenSize.width < 360;

  return {
    isMobile,
    isSmallMobile,
    chartHeight: isExtraSmall ? 160 : isSmallMobile ? 180 : isMobile ? 220 : 300,
    legendPosition: isMobile ? 'bottom' : 'top',
    fontSize: isExtraSmall ? 9 : isSmallMobile ? 10 : isMobile ? 11 : 12,
    padding: isExtraSmall ? 6 : isSmallMobile ? 8 : isMobile ? 10 : 12,
    maxRotation: isSmallMobile ? 45 : 0
  };
};

export default useResponsiveChart;
