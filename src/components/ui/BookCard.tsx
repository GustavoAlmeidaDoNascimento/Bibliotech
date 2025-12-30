import React from 'react';
import { BookOpen } from 'lucide-react';
import styles from './BookCard.module.css';

export interface BookCardProps {
  id: string;
  title: string;
  authors?: string[];
  genres?: string[];
  coverUrl?: string;
  loanCount?: number;
  available?: boolean;
  onClick?: (bookId: string) => void;
  className?: string;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  authors = [],
  genres = [],
  coverUrl,
  loanCount = 0,
  available = false,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div
      className={`${styles.bookCard} ${className}`}
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
        {coverUrl ? (
          <img src={coverUrl} alt={title} className={styles.bookCover} />
        ) : (
          <div className={styles.bookCoverPlaceholder}>
            <BookOpen size={40} />
          </div>
        )}
        {available && (
          <div className={styles.availableBadge}>À pronta-entrega</div>
        )}
      </div>
      <div className={styles.bookInfo}>
        <h3 className={styles.bookTitle}>{title}</h3>
        <p className={styles.bookAuthor}>
          {authors.length > 0 ? authors.join(', ') : 'Autor não informado'}
        </p>
        {genres.length > 0 && (
          <div className={styles.bookGenres}>
            {genres.slice(0, 2).map((genre: string) => (
              <span key={genre} className={styles.genreTag}>
                {genre}
              </span>
            ))}
            {genres.length > 2 && (
              <span className={styles.moreGenres}>+{genres.length - 2}</span>
            )}
          </div>
        )}
        <div className={styles.bookStats}>
          <BookOpen size={14} />
          <span>{loanCount} empréstimos</span>
        </div>
      </div>
    </div>
  );
};

export default BookCard;

