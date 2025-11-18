import React from 'react';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('should render correctly', () => {
    render(<Badge>Badge</Badge>);
    expect(screen.getByText(/badge/i)).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText(/primary/i)).toBeInTheDocument();

    rerender(<Badge variant="default">Default</Badge>);
    expect(screen.getByText(/default/i)).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText(/success/i)).toBeInTheDocument();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText(/error/i)).toBeInTheDocument();

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText(/warning/i)).toBeInTheDocument();

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText(/info/i)).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Badge size="small">Small</Badge>);
    expect(screen.getByText(/small/i)).toBeInTheDocument();

    rerender(<Badge size="medium">Medium</Badge>);
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    rerender(<Badge size="large">Large</Badge>);
    expect(screen.getByText(/large/i)).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(<Badge className="custom-class">Badge</Badge>);
    expect(screen.getByText(/badge/i)).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText(/test badge/i)).toBeInTheDocument();
  });
});

