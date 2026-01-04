import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Configurações da campanha de feedback
 */
const FEEDBACK_CONFIG = {
  // Tempo mínimo entre perguntas (em dias)
  MIN_DAYS_BETWEEN_ASKS: 7,
  // Status padrão quando não há registro
  DEFAULT_ASK_FEEDBACK: true,
};

interface FeedbackStatus {
  askFeedback: boolean;
  lastFeedbackAsked?: Timestamp;
  lastFeedbackGiven?: Timestamp;
}

export const feedbackCampaignService = {
  /**
   * Verifica se deve mostrar o popup de feedback para o aluno
   */
  async shouldAskFeedback(studentId: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando se deve pedir feedback para:', studentId);
      
      const studentRef = doc(db, 'students', studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        console.log('❌ Aluno não encontrado');
        return false;
      }
      
      const data = studentSnap.data();
      
      // Se askFeedback não existe ou é true, verificar se já passou tempo suficiente
      const askFeedback = data.askFeedback !== undefined ? data.askFeedback : FEEDBACK_CONFIG.DEFAULT_ASK_FEEDBACK;
      
      // Se askFeedback é false, não perguntar
      if (askFeedback === false) {
        console.log('❌ Aluno já respondeu feedback nesta campanha');
        return false;
      }
      
      // Se já foi perguntado recentemente, não perguntar novamente
      if (data.lastFeedbackAsked) {
        const lastAsked = data.lastFeedbackAsked.toDate();
        const now = new Date();
        const daysSinceLastAsk = Math.floor((now.getTime() - lastAsked.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastAsk < FEEDBACK_CONFIG.MIN_DAYS_BETWEEN_ASKS) {
          console.log(`⏰ Aguardando ${FEEDBACK_CONFIG.MIN_DAYS_BETWEEN_ASKS - daysSinceLastAsk} dias para perguntar novamente`);
          return false;
        }
      }
      
      console.log('✅ Pode pedir feedback');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar status de feedback:', error);
      return false;
    }
  },

  /**
   * Marca que o popup foi exibido (sem resposta)
   */
  async markFeedbackAsked(studentId: string): Promise<void> {
    try {
      console.log('📝 Marcando feedback como perguntado:', studentId);
      
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        lastFeedbackAsked: serverTimestamp(),
      });
      
      console.log('✅ Feedback marcado como perguntado');
    } catch (error) {
      console.error('❌ Erro ao marcar feedback como perguntado:', error);
      throw error;
    }
  },

  /**
   * Marca que o aluno respondeu o feedback
   */
  async markFeedbackGiven(studentId: string): Promise<void> {
    try {
      console.log('✅ Marcando feedback como respondido:', studentId);
      
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        askFeedback: false,
        lastFeedbackGiven: serverTimestamp(),
        lastFeedbackAsked: serverTimestamp(),
      });
      
      console.log('✅ Feedback marcado como respondido');
    } catch (error) {
      console.error('❌ Erro ao marcar feedback como respondido:', error);
      throw error;
    }
  },

  /**
   * Reseta o status de feedback de um aluno (para nova campanha)
   */
  async resetFeedbackStatus(studentId: string): Promise<void> {
    try {
      console.log('🔄 Resetando status de feedback:', studentId);
      
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        askFeedback: true,
      });
      
      console.log('✅ Status de feedback resetado');
    } catch (error) {
      console.error('❌ Erro ao resetar status de feedback:', error);
      throw error;
    }
  },

  /**
   * Reseta o status de feedback de todos os alunos de uma escola
   * (Para iniciar uma nova campanha de feedback)
   */
  async resetAllStudentsFeedback(schoolId: string): Promise<{ success: number; failed: number }> {
    try {
      console.log('🔄 Iniciando reset de feedback para todos os alunos da escola:', schoolId);
      
      // Importar aqui para evitar circular dependency
      const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
      
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('userId', '==', schoolId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let count = 0;
      let success = 0;
      let failed = 0;
      
      snapshot.forEach((docSnap) => {
        try {
          batch.update(docSnap.ref, {
            askFeedback: true,
          });
          success++;
          count++;
          
          // Firestore batch limit é 500
          if (count >= 500) {
            console.warn('⚠️ Limite de 500 operações por batch atingido');
          }
        } catch (error) {
          console.error('❌ Erro ao adicionar aluno ao batch:', error);
          failed++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`✅ ${success} alunos resetados com sucesso`);
      } else {
        console.log('ℹ️ Nenhum aluno encontrado');
      }
      
      return { success, failed };
    } catch (error) {
      console.error('❌ Erro ao resetar todos os alunos:', error);
      throw error;
    }
  },
};

