import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  doc,
  deleteDoc,
} from 'firebase/firestore';

export interface Feedback {
  id: string;
  source: 'reservation' | 'other';
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  schoolPlan?: string;
  metadata?: {
    bookId?: string;
    bookTitle?: string;
  };
  createdAt: Timestamp;
}

export interface FeedbackStats {
  total: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class FeedbackService {
  private collectionName = 'developer-feedbacks';

  /**
   * Cria um novo feedback no Firestore
   */
  async createFeedback(
    source: Feedback['source'],
    rating: Feedback['rating'],
    comment: string,
    studentId: string,
    studentName: string,
    schoolId: string,
    schoolName: string,
    schoolPlan?: string,
    metadata?: Feedback['metadata']
  ): Promise<string> {
    try {
      console.log('📝 Criando feedback:', { source, rating, studentId, studentName });

      const feedbackData = {
        source,
        rating,
        comment: comment.trim(),
        studentId,
        studentName,
        schoolId,
        schoolName,
        schoolPlan: schoolPlan || null,
        metadata: metadata || {},
        createdAt: Timestamp.now(),
      };

      const feedbacksRef = collection(db, this.collectionName);
      const docRef = await addDoc(feedbacksRef, feedbackData);

      console.log('✅ Feedback criado com sucesso:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar feedback:', error);
      throw error;
    }
  }

  /**
   * Busca todos os feedbacks com filtros opcionais
   */
  async getFeedbacks(
    filters?: {
      source?: Feedback['source'];
      rating?: Feedback['rating'];
      limitCount?: number;
    }
  ): Promise<Feedback[]> {
    try {
      console.log('🔍 Buscando feedbacks com filtros:', filters);

      const feedbacksRef = collection(db, this.collectionName);
      let q = query(feedbacksRef, orderBy('createdAt', 'desc'));

      // Aplicar filtros
      if (filters?.source) {
        q = query(feedbacksRef, where('source', '==', filters.source), orderBy('createdAt', 'desc'));
      }

      if (filters?.rating) {
        q = query(feedbacksRef, where('rating', '==', filters.rating), orderBy('createdAt', 'desc'));
      }

      if (filters?.limitCount) {
        q = query(q, limit(filters.limitCount));
      }

      const snapshot = await getDocs(q);
      const feedbacks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Feedback));

      console.log('✅ Feedbacks encontrados:', feedbacks.length);
      return feedbacks;
    } catch (error) {
      console.error('❌ Erro ao buscar feedbacks:', error);
      throw error;
    }
  }

  /**
   * Deleta um feedback do Firestore
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando feedback:', feedbackId);
      const feedbackRef = doc(db, this.collectionName, feedbackId);
      await deleteDoc(feedbackRef);
      console.log('✅ Feedback deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar feedback:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas dos feedbacks
   */
  async getFeedbackStats(source?: Feedback['source']): Promise<FeedbackStats> {
    try {
      console.log('📊 Calculando estatísticas de feedbacks');

      const feedbacks = await this.getFeedbacks({ source });

      const stats: FeedbackStats = {
        total: feedbacks.length,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };

      if (feedbacks.length === 0) {
        return stats;
      }

      // Calcular distribuição
      let totalRating = 0;
      feedbacks.forEach(feedback => {
        stats.ratingDistribution[feedback.rating]++;
        totalRating += feedback.rating;
      });

      // Calcular média
      stats.averageRating = totalRating / feedbacks.length;

      console.log('✅ Estatísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService();


