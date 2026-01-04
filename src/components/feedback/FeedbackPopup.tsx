import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './FeedbackPopup.module.css';

interface FeedbackPopupProps {
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, comment: string) => void;
  onSkip: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ onSubmit, onSkip }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma nota de 1 a 5 estrelas');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating as 1 | 2 | 3 | 4 | 5, comment);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2 className={styles.title}>Como foi sua experiência?</h2>
        <p className={styles.subtitle}>
          Seu feedback nos ajuda a melhorar o Bibliotech
        </p>

        {/* Stars Rating */}
        <div className={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.starButton}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              disabled={isSubmitting}
            >
              <Star
                size={40}
                className={
                  star <= (hoveredRating || rating)
                    ? styles.starFilled
                    : styles.starEmpty
                }
                fill={star <= (hoveredRating || rating) ? '#fbbf24' : 'none'}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className={styles.ratingText}>
            {rating === 1 && 'Muito ruim'}
            {rating === 2 && 'Ruim'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bom'}
            {rating === 5 && 'Excelente'}
          </div>
        )}

        {/* Comment Textarea */}
        <textarea
          className={styles.textarea}
          placeholder="Deixe um comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          disabled={isSubmitting}
        />

        {/* Character Counter */}
        {comment.length > 0 && (
          <div className={styles.charCounter}>
            {comment.length}/500
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.skipButton}
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Pular
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPopup;



