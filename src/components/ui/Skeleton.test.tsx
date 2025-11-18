import React from 'react';
import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Skeleton', () => {
  it('should render correctly', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender, container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toBeInTheDocument();

    rerender(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toBeInTheDocument();

    rerender(<Skeleton variant="circular" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with custom animation', () => {
    const { rerender, container } = render(<Skeleton animation="pulse" />);
    expect(container.firstChild).toBeInTheDocument();

    rerender(<Skeleton animation="wave" />);
    expect(container.firstChild).toBeInTheDocument();

    rerender(<Skeleton animation="none" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

