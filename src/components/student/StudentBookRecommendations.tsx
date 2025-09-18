import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recommendationService, RecommendationSection, BookRecommendation } from '../../services/RecommendationService';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, StarIcon } from '@heroicons/react/24/outline';
import styles from './StudentBookRecommendations.module.css';

interface StudentBookRecommendationsProps {
  userId: string;
  studentId: string;
  onBookClick?: (bookId: string) => void;
}

const StudentBookRecommendations: React.FC<StudentBookRecommendationsProps> = ({
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
        <div className={styles.header}>
          <StarIcon className={styles.headerIcon} />
          <div>
            <h3>Recomendações para Você</h3>
            <p>Descobrindo livros perfeitos para seu perfil...</p>
          </div>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Carregando recomendações personalizadas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <StarIcon className={styles.headerIcon} />
          <div>
            <h3>Recomendações para Você</h3>
            <p>Livros selecionados especialmente para você</p>
          </div>
        </div>
        <div className={styles.errorState}>
          <BookOpenIcon className={styles.errorIcon} />
          <h4>Ops! Algo deu errado</h4>
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
        <div className={styles.header}>
          <StarIcon className={styles.headerIcon} />
          <div>
            <h3>Recomendações para Você</h3>
            <p>Livros selecionados especialmente para você</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <BookOpenIcon className={styles.emptyIcon} />
          <h4>Nenhuma recomendação disponível</h4>
          <p>Continue lendo livros para receber recomendações personalizadas!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StarIcon className={styles.headerIcon} />
        <div>
          <h3>Recomendações para Você</h3>
          <p>Baseado no seu histórico de leitura</p>
        </div>
      </div>
      
      <div className={styles.recommendationsGrid}>
        {recommendations.map((section, sectionIndex) => (
          <StudentRecommendationSection
            key={sectionIndex}
            section={section}
            onBookClick={onBookClick}
          />
        ))}
      </div>
    </div>
  );
};

interface StudentRecommendationSectionProps {
  section: RecommendationSection;
  onBookClick?: (bookId: string) => void;
}

const StudentRecommendationSection: React.FC<StudentRecommendationSectionProps> = ({ section, onBookClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280; // Width of book card + gap
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h4>{section.title}</h4>
          <p>{section.reason}</p>
        </div>
        <div className={styles.scrollControls}>
          <button 
            onClick={() => scroll('left')} 
            className={styles.scrollButton}
            aria-label="Rolar para esquerda"
          >
            <ChevronLeftIcon />
          </button>
          <button 
            onClick={() => scroll('right')} 
            className={styles.scrollButton}
            aria-label="Rolar para direita"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      
      <div className={styles.booksContainer} ref={scrollRef}>
        {section.books.map((book, bookIndex) => (
          <div 
            key={bookIndex} 
            className={styles.bookCard}
            onClick={() => onBookClick?.(book.id)}
          >
            <div className={styles.bookCover}>
              <BookOpenIcon className={styles.bookIcon} />
            </div>
            <div className={styles.bookInfo}>
              <h5 className={styles.bookTitle}>{book.title}</h5>
              <p className={styles.bookAuthor}>
                {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Autor não informado'}
              </p>
              <div className={styles.bookMeta}>
                <span className={styles.bookGenre}>
                  {Array.isArray(book.genres) ? book.genres[0] : book.genres || 'Gênero não informado'}
                </span>
                {book.borrowCount > 0 && (
                  <span className={styles.bookPopularity}>
                    {book.borrowCount} empréstimo{book.borrowCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentBookRecommendations;
