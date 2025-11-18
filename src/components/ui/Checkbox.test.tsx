import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('should render correctly', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Checkbox label="Aceito os termos" />);
    expect(screen.getByLabelText(/aceito os termos/i)).toBeInTheDocument();
  });

  it('should be checked when checked prop is true', () => {
    render(<Checkbox checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should not be checked when checked prop is false', () => {
    render(<Checkbox checked={false} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('should handle onChange events', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Checkbox onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('should not call onChange when disabled', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Checkbox disabled onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    
    await user.click(checkbox);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    render(<Checkbox className="custom-class" />);
    expect(screen.getByRole('checkbox').closest('label')).toHaveClass('custom-class');
  });
});

