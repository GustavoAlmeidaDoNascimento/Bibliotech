import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookCard from './BookCard';
import { BookWithStats } from '../../../services/bookRecommendationService';

const mockBook: BookWithStats = {
  id: '1',
  title: 'Test Book',
  authors: ['Author One', 'Author Two'],
  genres: ['Fiction', 'Adventure', 'Drama'],
  loanCount: 5,
  available: true,
  createdAt: new Date(),
  coverUrl: 'https://example.com/cover.jpg'
};

const mockBookWithoutCover: BookWithStats = {
  id: '2',
  title: 'Book Without Cover',
  authors: [],
  genres: [],
  loanCount: 0,
  available: false,
  createdAt: new Date()
};

describe('BookCard', () => {
  it('should render correctly', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/test book/i)).toBeInTheDocument();
  });

  it('should display book title', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/test book/i)).toBeInTheDocument();
  });

  it('should display authors', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/author one, author two/i)).toBeInTheDocument();
  });

  it('should display "Autor não informado" when no authors', () => {
    render(<BookCard book={mockBookWithoutCover} />);
    expect(screen.getByText(/autor não informado/i)).toBeInTheDocument();
  });

  it('should display loan count', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/5 empréstimos/i)).toBeInTheDocument();
  });

  it('should display available badge when book is available', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/à pronta-entrega/i)).toBeInTheDocument();
  });

  it('should not display available badge when book is not available', () => {
    render(<BookCard book={mockBookWithoutCover} />);
    expect(screen.queryByText(/à pronta-entrega/i)).not.toBeInTheDocument();
  });

  it('should display book cover when coverUrl is provided', () => {
    render(<BookCard book={mockBook} />);
    const img = screen.getByAltText(/test book/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('should display placeholder when coverUrl is not provided', () => {
    render(<BookCard book={mockBookWithoutCover} />);
    expect(screen.queryByAltText(/book without cover/i)).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<BookCard book={mockBook} onClick={handleClick} />);
    const card = screen.getByRole('button');
    
    await user.click(card);
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('should display genres', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/fiction/i)).toBeInTheDocument();
    expect(screen.getByText(/adventure/i)).toBeInTheDocument();
  });

  it('should display "+X" when there are more than 2 genres', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText(/\+1/i)).toBeInTheDocument();
  });
});

