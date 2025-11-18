import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS, SIZES, ANIMATION_DURATION } from '../../constants';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

const StyledBadge = styled.span<{ 
  variant: BadgeProps['variant'];
  size: BadgeProps['size'];
  clickable: boolean;
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: ${props => {
    switch (props.size) {
      case 'small':
        return '0.25rem 0.5rem';
      case 'large':
        return '0.5rem 1rem';
      default:
        return '0.375rem 0.75rem';
    }
  }};
  font-size: ${props => {
    switch (props.size) {
      case 'small':
        return '0.75rem';
      case 'large':
        return '1rem';
      default:
        return '0.875rem';
    }
  }};
  font-weight: 500;
  border-radius: ${SIZES.BORDER_RADIUS};
  transition: all ${ANIMATION_DURATION.SHORT}s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background: ${COLORS.PRIMARY};
          color: ${COLORS.TEXT.LIGHT};
        `;
      case 'success':
        return css`
          background: ${COLORS.SUCCESS};
          color: ${COLORS.TEXT.LIGHT};
        `;
      case 'warning':
        return css`
          background: ${COLORS.WARNING};
          color: ${COLORS.TEXT.DARK};
        `;
      case 'error':
        return css`
          background: ${COLORS.ERROR};
          color: ${COLORS.TEXT.LIGHT};
        `;
      case 'info':
        return css`
          background: ${COLORS.SECONDARY};
          color: ${COLORS.TEXT.LIGHT};
        `;
      default:
        return css`
          background: ${COLORS.BACKGROUND.SECONDARY};
          color: ${COLORS.TEXT.PRIMARY};
          border: 1px solid #d1d5db;
        `;
    }
  }}
  
  ${props => props.clickable && css`
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }
  `}
`;

const RemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  opacity: 0.7;
  transition: opacity ${ANIMATION_DURATION.SHORT}s ease;
  font-size: 1rem;
  line-height: 1;
  
  &:hover {
    opacity: 1;
  }
  
  &:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'medium',
  children,
  className,
  onClick,
  removable = false,
  onRemove
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <StyledBadge
      variant={variant}
      size={size}
      clickable={!!onClick || removable}
      onClick={onClick}
      className={className}
    >
      {children}
      {removable && (
        <RemoveButton
          onClick={handleRemove}
          aria-label="Remover"
          type="button"
        >
          ×
        </RemoveButton>
      )}
    </StyledBadge>
  );
};

export default Badge;

