import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { BookOpenIcon as Book, UsersIcon as Users, ArrowTrendingUpIcon as TrendingUp } from '@heroicons/react/24/outline';
import { useCounterAnimation } from '../../hooks/useCounterAnimation';

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 120, 212, 0.2);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(0, 120, 212, 0.4);
    transform: translateY(-4px);
  }
  
  svg {
    width: 40px;
    height: 40px;
    color: #0078d4;
    margin-bottom: 16px;
  }
  
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #0078d4;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.95rem;
  color: #94a3b8;
`;

interface AnimatedStatCardProps {
  icon: React.ReactNode;
  targetValue: number;
  label: string;
  delay?: number;
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ 
  icon, 
  targetValue, 
  label, 
  delay = 0 
}) => {
  const { currentValue } = useCounterAnimation(targetValue, {
    duration: 2000,
    startDelay: delay,
    easing: 'easeOut'
  });

  return (
    <StatCard whileHover={{ scale: 1.05 }}>
      {icon}
      <StatNumber>{currentValue.toLocaleString()}+</StatNumber>
      <StatLabel>{label}</StatLabel>
    </StatCard>
  );
};

const AnimatedStatsGrid: React.FC = () => {
  return (
    <StatsGrid
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <AnimatedStatCard
        icon={<Book />}
        targetValue={2330}
        label="Livros registrados"
        delay={800}
      />
      
      <AnimatedStatCard
        icon={<Users />}
        targetValue={605}
        label="Leitores registrados"
        delay={1000}
      />
      
      <AnimatedStatCard
        icon={<TrendingUp />}
        targetValue={221}
        label="Leitores ativos"
        delay={1200}
      />
    </StatsGrid>
  );
};

export default AnimatedStatsGrid;
