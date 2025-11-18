import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  it('should render correctly', () => {
    render(<Input id="test-input" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input id="test-input" label="Nome" />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Input id="test-input" error="Campo obrigatório" />);
    expect(screen.getByText(/campo obrigatório/i)).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(<Input id="test-input" helperText="Digite seu nome completo" />);
    expect(screen.getByText(/digite seu nome completo/i)).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const user = userEvent.setup();
    render(<Input id="test-input" />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'Teste');
    expect(input).toHaveValue('Teste');
  });

  it('should render with different input sizes', () => {
    const { rerender } = render(<Input id="test-input" inputSize="small" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input id="test-input" inputSize="medium" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<Input id="test-input" inputSize="large" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with fullWidth prop', () => {
    render(<Input id="test-input" fullWidth />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input id="test-input" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should render with placeholder', () => {
    render(<Input id="test-input" placeholder="Digite aqui" />);
    expect(screen.getByPlaceholderText(/digite aqui/i)).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(<Input id="test-input" className="custom-class" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

