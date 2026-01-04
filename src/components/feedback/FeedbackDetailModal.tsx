import React from 'react';
import { X, Trash2, Star, Calendar, User, Building2, CreditCard, BookOpen } from 'lucide-react';
import { Feedback } from '../../services/feedbackService';
import { formatPlanDisplayName, inferTierFromPlanValue } from '../../services/subscriptionService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './FeedbackDetailModal.module.css';

interface FeedbackDetailModalProps {
  feedback: Feedback;
  onClose: () => void;
  onDelete: (feedbackId: string) => void;
  isDeleting: boolean;
}

const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  onClose,
  onDelete,
  isDeleting,
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não informada';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      if (typeof timestamp === 'number') {
        return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getPlanBadgeClass = (schoolPlan?: string) => {
    if (!schoolPlan) return styles.planDefault;
    const tier = inferTierFromPlanValue(schoolPlan);
    switch (tier) {
      case 'basic': return styles.planBasic;
      case 'intermediate': return styles.planIntermediate;
      case 'advanced': return styles.planAdvanced;
      default: return styles.planDefault;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja deletar este feedback?')) {
      onDelete(feedback.id);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Detalhes do Feedback</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Rating Section */}
          <div className={styles.ratingSection}>
            <div className={styles.starsLarge}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={star <= feedback.rating ? styles.starFilled : styles.starEmpty}
                  fill={star <= feedback.rating ? '#fbbf24' : 'none'}
                />
              ))}
            </div>
            <p className={styles.ratingText}>
              {feedback.rating === 1 && 'Muito ruim'}
              {feedback.rating === 2 && 'Ruim'}
              {feedback.rating === 3 && 'Regular'}
              {feedback.rating === 4 && 'Bom'}
              {feedback.rating === 5 && 'Excelente'}
            </p>
          </div>

          {/* Context Section */}
          <div className={styles.contextSection}>
            <h3>Origem do Feedback</h3>
            <div className={styles.contextCard}>
              <div className={styles.contextIcon}>
                {feedback.source === 'reservation' ? '📚' : '💭'}
              </div>
              <div className={styles.contextContent}>
                <p className={styles.contextDescription}>
                  {feedback.source === 'reservation' && feedback.metadata?.bookTitle ? (
                    <>
                      Coletado durante a <strong>reserva do livro</strong><br/>
                      "{feedback.metadata.bookTitle}"
                    </>
                  ) : feedback.source === 'reservation' ? (
                    <>Coletado durante uma <strong>reserva de livro</strong></>
                  ) : (
                    <>Feedback geral do sistema</>
                  )}
                </p>
                <span className={styles.contextBadge}>
                  {feedback.source === 'reservation' ? 'Reserva de Livro' : 'Feedback Geral'}
                </span>
              </div>
            </div>
          </div>

          {/* Comment */}
          {feedback.comment && (
            <div className={styles.commentSection}>
              <h3>Comentário do Usuário</h3>
              <p className={styles.comment}>{feedback.comment}</p>
            </div>
          )}

          {/* Student Info */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <User size={20} />
              <div>
                <span className={styles.infoLabel}>Aluno</span>
                <span className={styles.infoValue}>{feedback.studentName}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <Building2 size={20} />
              <div>
                <span className={styles.infoLabel}>Escola</span>
                <span className={styles.infoValue}>{feedback.schoolName}</span>
              </div>
            </div>

            {feedback.schoolPlan && (
              <div className={styles.infoCard}>
                <CreditCard size={20} />
                <div>
                  <span className={styles.infoLabel}>Plano</span>
                  <span className={`${styles.planBadge} ${getPlanBadgeClass(feedback.schoolPlan)}`}>
                    {formatPlanDisplayName(feedback.schoolPlan)}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.infoCard}>
              <Calendar size={20} />
              <div>
                <span className={styles.infoLabel}>Data</span>
                <span className={styles.infoValue}>{formatDate(feedback.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton} disabled={isDeleting}>
            Fechar
          </button>
          <button 
            onClick={handleDelete} 
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            <Trash2 size={18} />
            {isDeleting ? 'Deletando...' : 'Deletar Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetailModal;

