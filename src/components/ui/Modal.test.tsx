import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText(/test modal/i)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button', { name: /fechar/i });
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()} title="Small" size="small">
        Content
      </Modal>
    );
    expect(screen.getByText(/small/i)).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} title="Medium" size="medium">
        Content
      </Modal>
    );
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} title="Large" size="large">
        Content
      </Modal>
    );
    expect(screen.getByText(/large/i)).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();
  });
});

