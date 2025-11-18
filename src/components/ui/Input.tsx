import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS, SIZES, BREAKPOINTS, ANIMATION_DURATION } from '../../constants';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: 'small' | 'medium' | 'large';
}

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${props => props.fullWidth && css`width: 100%;`}
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${COLORS.TEXT.PRIMARY};
`;

const StyledInput = styled.input<{ 
  error?: string; 
  inputSize?: InputProps['inputSize'];
  fullWidth?: boolean;
}>`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  padding: ${props => {
    switch (props.inputSize) {
      case 'small':
        return '0.5rem 0.75rem';
      case 'large':
        return '1rem 1.25rem';
      default:
        return '0.75rem 1rem';
    }
  }};
  font-size: ${props => {
    switch (props.inputSize) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default:
        return '1rem';
    }
  }};
  border: 1px solid ${props => props.error ? COLORS.ERROR : '#d1d5db'};
  border-radius: ${SIZES.BORDER_RADIUS};
  background: ${COLORS.BACKGROUND.PRIMARY};
  color: ${COLORS.TEXT.PRIMARY};
  transition: all ${ANIMATION_DURATION.SHORT}s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? COLORS.ERROR : COLORS.PRIMARY};
    box-shadow: 0 0 0 3px ${props => props.error ? `${COLORS.ERROR}20` : `${COLORS.PRIMARY}20`};
  }
  
  &:disabled {
    background: ${COLORS.BACKGROUND.SECONDARY};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &::placeholder {
    color: ${COLORS.TEXT.SECONDARY};
  }
  
  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    width: 100%;
  }
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.ERROR};
  margin-top: -0.25rem;
`;

const HelperText = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.TEXT.SECONDARY};
  margin-top: -0.25rem;
`;

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  inputSize = 'medium',
  className,
  ...props
}) => {
  return (
    <InputWrapper fullWidth={fullWidth} className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <StyledInput
        {...props}
        error={error}
        inputSize={inputSize}
        fullWidth={fullWidth}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error || helperText 
            ? `${props.id}-${error ? 'error' : 'helper'}`
            : undefined
        }
      />
      {error && (
        <ErrorText id={`${props.id}-error`} role="alert">
          {error}
        </ErrorText>
      )}
      {!error && helperText && (
        <HelperText id={`${props.id}-helper`}>
          {helperText}
        </HelperText>
      )}
    </InputWrapper>
  );
};

export default Input;

