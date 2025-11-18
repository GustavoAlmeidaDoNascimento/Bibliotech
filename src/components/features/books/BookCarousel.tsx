import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BookWithStats } from '../../../services/bookRecommendationService';
import BookCard from './BookCard';
import styles from './BookCarousel.module.css';

export interface BookCarouselProps {
  title: string;
  titleIcon?: React.ReactNode;
  books: BookWithStats[];
  onBookClick?: (bookId: string) => void;
  carouselId?: string | number;
  className?: string;
}

const BookCarousel: React.FC<BookCarouselProps> = ({
  title,
  titleIcon,
  books,
  onBookClick,
  carouselId,
  className
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;

    const scrollAmount = 200;
    const currentScroll = carouselRef.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.section} ${className || ''}`}>
      <h2 className={styles.sectionTitle}>
        {titleIcon}
        {title}
      </h2>
      <div className={styles.carouselContainer}>
        <button
          className={styles.navButton}
          onClick={() => scrollCarousel('left')}
          aria-label="Voltar livros"
        >
          <ChevronLeft size={20} />
        </button>
        <div 
          ref={carouselRef}
          className={styles.booksScroll}
          data-carousel={carouselId}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={onBookClick}
            />
          ))}
        </div>
        <button
          className={styles.navButton}
          onClick={() => scrollCarousel('right')}
          aria-label="Avançar livros"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default BookCarousel;

