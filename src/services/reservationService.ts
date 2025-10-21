import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

export interface Reservation {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  userId: string; // schoolId
  status: 'pending' | 'ready' | 'completed' | 'cancelled' | 'expired';
  type: 'available' | 'waitlist'; // available = livro estava disponível, waitlist = entrou na fila
  position?: number; // posição na fila (para waitlist)
  createdAt: Timestamp;
  readyAt?: Timestamp; // quando ficou pronto para retirada
  completedAt?: Timestamp; // quando foi retirado
  cancelledAt?: Timestamp;
  notes?: string;
}

class ReservationService {
  /**
   * Cria uma nova reserva
   */
  async createReservation(
    userId: string,
    studentId: string,
    studentName: string,
    bookId: string,
    bookTitle: string,
    bookAuthor: string | undefined,
    bookCoverUrl: string | undefined,
    isAvailable: boolean
  ): Promise<string> {
    try {
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      
      // Verificação temporariamente desabilitada para evitar erro de índice
      // TODO: Reativar após criar índices no Firebase
      console.log('⚠️ Verificação de reservas duplicadas desabilitada temporariamente');

      const now = Timestamp.now();

      // Se o livro está disponível, a reserva já começa como 'ready'
      // Se não, entra como 'pending' na fila de espera
      const status = isAvailable ? 'ready' : 'pending';
      const type = isAvailable ? 'available' : 'waitlist';

      // Criar objeto base de reserva
      const reservationData: any = {
        studentId,
        studentName,
        bookId,
        bookTitle,
        userId,
        status,
        type,
        createdAt: now
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (bookAuthor) {
        reservationData.bookAuthor = bookAuthor;
      }
      if (bookCoverUrl) {
        reservationData.bookCoverUrl = bookCoverUrl;
      }

      // Se for waitlist, calcular e adicionar posição na fila
      if (!isAvailable) {
        // Temporariamente desabilitado para evitar erro de permissões
        // TODO: Reativar após resolver permissões do Firebase
        console.log('⚠️ Cálculo de posição na fila desabilitado temporariamente');
        reservationData.position = 1; // Posição padrão
      }

      // Se estiver pronto (disponível), adicionar apenas data de ready
      if (isAvailable) {
        reservationData.readyAt = now;
        // Removido expiresAt - não há prazo para retirada
      }

      const docRef = await addDoc(reservationsRef, reservationData);
      console.log('✅ Reserva criada com sucesso:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      throw error;
    }
  }

  /**
   * Busca todas as reservas de uma escola
   */
  async getReservations(userId: string): Promise<Reservation[]> {
    try {
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const q = query(reservationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      throw error;
    }
  }

  /**
   * Busca reservas por status
   */
  async getReservationsByStatus(userId: string, status: Reservation['status']): Promise<Reservation[]> {
    try {
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const q = query(
        reservationsRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
    } catch (error) {
      console.error('Erro ao buscar reservas por status:', error);
      throw error;
    }
  }

  /**
   * Busca reservas de um aluno específico
   */
  async getStudentReservations(userId: string, studentId: string): Promise<Reservation[]> {
    try {
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const q = query(
        reservationsRef,
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
    } catch (error) {
      console.error('Erro ao buscar reservas do aluno:', error);
      throw error;
    }
  }

  /**
   * Busca uma reserva específica
   */
  async getReservation(userId: string, reservationId: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Reservation;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      throw error;
    }
  }

  /**
   * Deletar reserva (quando livro foi retirado)
   */
  async deleteReservation(userId: string, reservationId: string): Promise<void> {
    try {
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      await updateDoc(docRef, {
        status: 'completed',
        withdrawnAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao deletar reserva:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma reserva
   */
  async updateReservationStatus(
    userId: string,
    reservationId: string,
    status: Reservation['status']
  ): Promise<void> {
    try {
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      const updateData: any = { status };

      const now = Timestamp.now();
      
      if (status === 'ready') {
        updateData.readyAt = now;
      } else if (status === 'completed') {
        updateData.completedAt = now;
      } else if (status === 'cancelled') {
        updateData.cancelledAt = now;
      }

      await updateDoc(docRef, updateData);
      console.log('✅ Status da reserva atualizado:', reservationId, status);
    } catch (error) {
      console.error('Erro ao atualizar status da reserva:', error);
      throw error;
    }
  }

  /**
   * Cancela uma reserva
   */
  async cancelReservation(userId: string, reservationId: string): Promise<void> {
    try {
      await this.updateReservationStatus(userId, reservationId, 'cancelled');
      console.log('✅ Reserva cancelada:', reservationId);
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      throw error;
    }
  }

  /**
   * Marca uma reserva como completada (livro foi retirado)
   */
  async completeReservation(userId: string, reservationId: string): Promise<void> {
    try {
      await this.updateReservationStatus(userId, reservationId, 'completed');
      console.log('✅ Reserva completada:', reservationId);
    } catch (error) {
      console.error('Erro ao completar reserva:', error);
      throw error;
    }
  }

  /**
   * Atualiza a fila de espera quando um livro é devolvido
   * Move o primeiro da fila para status 'ready'
   */
  async updateWaitlist(userId: string, bookId: string): Promise<void> {
    try {
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const waitlistQuery = query(
        reservationsRef,
        where('bookId', '==', bookId),
        where('type', '==', 'waitlist'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(waitlistQuery);
      
      if (!snapshot.empty) {
        // Primeiro da fila
        const firstInLine = snapshot.docs[0];
        await this.updateReservationStatus(userId, firstInLine.id, 'ready');
        
        // Atualizar posições dos demais
        const batch = writeBatch(db);
        snapshot.docs.slice(1).forEach((doc, index) => {
          batch.update(doc.ref, { position: index + 1 });
        });
        await batch.commit();
        
        console.log('✅ Fila de espera atualizada para livro:', bookId);
      }
    } catch (error) {
      console.error('Erro ao atualizar fila de espera:', error);
      throw error;
    }
  }

}

export const reservationService = new ReservationService();

