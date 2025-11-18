import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookCarousel from './BookCarousel';
import { BookWithStats } from '../../../services/bookRecommendationService';

const mockBooks: BookWithStats[] = [
  {
    id: '1',
    title: 'Book One',
    authors: ['Author One'],
    genres: ['Fiction'],
    loanCount: 5,
    available: true,
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Book Two',
    authors: ['Author Two'],
    genres: ['Adventure'],
    loanCount: 3,
    available: false,
    createdAt: new Date()
  }
];

describe('BookCarousel', () => {
  it('should render correctly', () => {
    render(<BookCarousel title="Test Carousel" books={mockBooks} />);
    expect(screen.getByText(/test carousel/i)).toBeInTheDocument();
  });

  it('should render all books', () => {
    render(<BookCarousel title="Test Carousel" books={mockBooks} />);
    expect(screen.getByText(/book one/i)).toBeInTheDocument();
    expect(screen.getByText(/book two/i)).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<BookCarousel title="Test Carousel" books={mockBooks} />);
    expect(screen.getByLabelText(/voltar livros/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/avançar livros/i)).toBeInTheDocument();
  });

  it('should not render when books array is empty', () => {
    const { container } = render(<BookCarousel title="Test Carousel" books={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call onBookClick when a book is clicked', async () => {
    const handleBookClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <BookCarousel 
        title="Test Carousel" 
        books={mockBooks} 
        onBookClick={handleBookClick}
      />
    );
    
    const bookOne = screen.getByText(/book one/i).closest('div[role="button"]');
    if (bookOne) {
      await user.click(bookOne);
      expect(handleBookClick).toHaveBeenCalledWith('1');
    }
  });

  it('should render with title icon', () => {
    const icon = <span data-testid="icon">📚</span>;
    render(<BookCarousel title="Test Carousel" books={mockBooks} titleIcon={icon} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const { container } = render(
      <BookCarousel title="Test Carousel" books={mockBooks} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

