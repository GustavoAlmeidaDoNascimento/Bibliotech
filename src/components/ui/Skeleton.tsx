import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { COLORS, SIZES, ANIMATION_DURATION } from '../../constants';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const wave = keyframes`
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const StyledSkeleton = styled.div<{
  width?: string | number;
  height?: string | number;
  variant: SkeletonProps['variant'];
  animation: SkeletonProps['animation'];
}>`
  background: ${COLORS.BACKGROUND.SECONDARY};
  border-radius: ${props => {
    switch (props.variant) {
      case 'circular':
        return '50%';
      case 'rectangular':
        return SIZES.BORDER_RADIUS;
      default:
        return '4px';
    }
  }};
  width: ${props => {
    if (props.width) {
      return typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    return props.variant === 'circular' ? '40px' : '100%';
  }};
  height: ${props => {
    if (props.height) {
      return typeof props.height === 'number' ? `${props.height}px` : props.height;
    }
    return props.variant === 'circular' ? '40px' : '1rem';
  }};
  
  ${props => {
    switch (props.animation) {
      case 'pulse':
        return css`
          animation: ${pulse} ${ANIMATION_DURATION.MEDIUM * 2}s ease-in-out infinite;
        `;
      case 'wave':
        return css`
          position: relative;
          overflow: hidden;
          
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            animation: ${wave} ${ANIMATION_DURATION.MEDIUM * 2}s ease-in-out infinite;
          }
        `;
      default:
        return '';
    }
  }}
`;

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className
}) => {
  return (
    <StyledSkeleton
      width={width}
      height={height}
      variant={variant}
      animation={animation}
      className={className}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

export default Skeleton;

