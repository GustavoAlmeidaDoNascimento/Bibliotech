import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS, SIZES, ANIMATION_DURATION, BREAKPOINTS } from '../../constants';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  id?: string;
  indeterminate?: boolean;
}

const CheckboxWrapper = styled.label<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  
  ${props => props.disabled && css`
    opacity: 0.6;
  `}
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
`;

const StyledCheckbox = styled.span<{
  checked: boolean;
  disabled?: boolean;
  size: CheckboxProps['size'];
  indeterminate?: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => {
    switch (props.size) {
      case 'small':
        return '16px';
      case 'large':
        return '24px';
      default:
        return '20px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small':
        return '16px';
      case 'large':
        return '24px';
      default:
        return '20px';
    }
  }};
  border: 2px solid ${props => {
    if (props.checked || props.indeterminate) {
      return COLORS.PRIMARY;
    }
    return props.disabled ? '#d1d5db' : '#6b7280';
  }};
  border-radius: 4px;
  background: ${props => {
    if (props.checked || props.indeterminate) {
      return COLORS.PRIMARY;
    }
    return COLORS.BACKGROUND.PRIMARY;
  }};
  transition: all ${ANIMATION_DURATION.SHORT}s ease;
  
  ${props => !props.disabled && css`
    &:hover {
      border-color: ${COLORS.PRIMARY};
    }
  `}
  
  &::after {
    content: '';
    position: absolute;
    display: ${props => (props.checked || props.indeterminate) ? 'block' : 'none'};
    ${props => {
      if (props.indeterminate) {
        return css`
          width: 60%;
          height: 2px;
          background: ${COLORS.TEXT.LIGHT};
          border-radius: 1px;
        `;
      } else {
        return css`
          width: 4px;
          height: 8px;
          border: solid ${COLORS.TEXT.LIGHT};
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          margin-top: -2px;
        `;
      }
    }}
  }
`;

const Label = styled.span<{ size: CheckboxProps['size'] }>`
  font-size: ${props => {
    switch (props.size) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default:
        return '1rem';
    }
  }};
  color: ${COLORS.TEXT.PRIMARY};
  
  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    font-size: 0.875rem;
  }
`;

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  size = 'medium',
  className,
  id,
  indeterminate = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <CheckboxWrapper disabled={disabled} className={className} htmlFor={checkboxId}>
      <HiddenInput
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        ref={(input) => {
          if (input) {
            input.indeterminate = indeterminate;
          }
        }}
      />
      <StyledCheckbox
        checked={checked}
        disabled={disabled}
        size={size}
        indeterminate={indeterminate}
      />
      {label && <Label size={size}>{label}</Label>}
    </CheckboxWrapper>
  );
};

export default Checkbox;

