import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recommendationService, RecommendationSection } from '../../services/RecommendationService';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import styles from './BookRecommendations.module.css';

interface BookRecommendationsProps {
  userId: string;
  studentId: string;
  onBookClick?: (bookId: string) => void;
}

const BookRecommendations: React.FC<BookRecommendationsProps> = ({
  userId,
  studentId,
  onBookClick
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recs = await recommendationService.getRecommendationsForStudent(userId, studentId);
      setRecommendations(recs);
    } catch (err) {
      console.error('Erro ao carregar recomendações:', err);
      setError('Não foi possível carregar as recomendações');
    } finally {
      setLoading(false);
    }
  }, [userId, studentId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h3>Recomendações para o Aluno</h3>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.skeleton}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonBooks}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.skeletonBook}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h3>Recomendações para o Aluno</h3>
        </div>
        <div className={styles.errorState}>
          <BookOpenIcon className={styles.errorIcon} />
          <p>{error}</p>
          <button onClick={loadRecommendations} className={styles.retryButton}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h3>Recomendações para o Aluno</h3>
        </div>
        <div className={styles.emptyState}>
          <BookOpenIcon className={styles.emptyIcon} />
          <p>Nenhuma recomendação disponível no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <h3>Recomendações para o Aluno</h3>
      </div>
      
      {recommendations.map((section, sectionIndex) => (
        <RecommendationRow
          key={sectionIndex}
          section={section}
          onBookClick={onBookClick}
        />
      ))}
    </div>
  );
};

interface RecommendationRowProps {
  section: RecommendationSection;
  onBookClick?: (bookId: string) => void;
}

const RecommendationRow: React.FC<RecommendationRowProps> = ({
  section,
  onBookClick
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [section.books]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240; // Largura de ~1.5 cards
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleBookClick = (bookId: string) => {
    if (onBookClick) {
      onBookClick(bookId);
    }
  };

  return (
    <div className={styles.recommendationRow}>
      <div className={styles.rowHeader}>
        <h4>{section.title}</h4>
        <span className={styles.rowSubtitle}>{section.reason}</span>
      </div>
      
      <div className={styles.scrollWrapper}>
        {canScrollLeft && (
          <button
            className={`${styles.scrollButton} ${styles.scrollLeft}`}
            onClick={() => scroll('left')}
            aria-label="Rolar para a esquerda"
          >
            <ChevronLeftIcon />
          </button>
        )}
        
        <div
          ref={scrollContainerRef}
          className={styles.booksContainer}
        >
          {section.books.map((book) => (
            <div
              key={book.id}
              className={styles.bookCard}
              onClick={() => handleBookClick(book.id)}
            >
              <div className={styles.bookCover}>
                <div className={styles.bookCoverPlaceholder}>
                  <BookOpenIcon className={styles.bookIcon} />
                </div>
              </div>
              
              <div className={styles.bookInfo}>
                <h5 className={styles.bookTitle} title={book.title}>
                  {book.title}
                </h5>
                
                {book.authors && book.authors.length > 0 && (
                  <p className={styles.bookAuthor} title={book.authors.join(', ')}>
                    {book.authors.join(', ')}
                  </p>
                )}
                
                {book.genres && book.genres.length > 0 && (
                  <div className={styles.bookGenres}>
                    {book.genres.slice(0, 2).map((genre, index) => (
                      <span key={index} className={styles.genreTag}>
                        {genre}
                      </span>
                    ))}
                    {book.genres.length > 2 && (
                      <span className={styles.moreGenres}>
                        +{book.genres.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                <div className={styles.popularityInfo}>
                  <span className={styles.borrowCount}>
                    {book.borrowCount} empréstimo{book.borrowCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {canScrollRight && (
          <button
            className={`${styles.scrollButton} ${styles.scrollRight}`}
            onClick={() => scroll('right')}
            aria-label="Rolar para a direita"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default BookRecommendations;
