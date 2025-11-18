import React from 'react';
import { BookOpen } from 'lucide-react';
import { BookWithStats } from '../../../services/bookRecommendationService';
import styles from './BookCard.module.css';

export interface BookCardProps {
  book: BookWithStats;
  onClick?: (bookId: string) => void;
  className?: string;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick, className }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(book.id);
    }
  };

  return (
    <div
      className={`${styles.bookCard} ${className || ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.bookCoverWrapper}>
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className={styles.bookCover}
            loading="lazy"
          />
        ) : (
          <div className={styles.bookCoverPlaceholder}>
            <BookOpen size={40} />
          </div>
        )}
        {book.available && (
          <div className={styles.availableBadge}>À pronta-entrega</div>
        )}
      </div>
      <div className={styles.bookInfo}>
        <h3 className={styles.bookTitle}>{book.title}</h3>
        <p className={styles.bookAuthor}>
          {book.authors.length > 0 ? book.authors.join(', ') : 'Autor não informado'}
        </p>
        {book.genres.length > 0 && (
          <div className={styles.bookGenres}>
            {book.genres.slice(0, 2).map((genre: string) => (
              <span key={genre} className={styles.genreTag}>{genre}</span>
            ))}
            {book.genres.length > 2 && (
              <span className={styles.moreGenres}>+{book.genres.length - 2}</span>
            )}
          </div>
        )}
        <div className={styles.bookStats}>
          <BookOpen size={14} />
          <span>{book.loanCount} empréstimos</span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;

