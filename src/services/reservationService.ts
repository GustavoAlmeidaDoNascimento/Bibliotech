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
   * Salva tanto na coleção da escola quanto na coleção global para alunos
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
      // Criar reserva na coleção da escola (para gestores)
      const schoolReservationId = await this.createSchoolReservation(
        userId, studentId, studentName, bookId, bookTitle, bookAuthor, bookCoverUrl, isAvailable
      );
      
      // Criar reserva na coleção global (para alunos)
      const globalReservationId = await this.createGlobalReservation(
        userId, studentId, studentName, bookId, bookTitle, bookAuthor, bookCoverUrl, isAvailable
      );
      
      console.log('✅ Reserva criada com sucesso:', { schoolReservationId, globalReservationId });
      return schoolReservationId; // Retorna o ID da escola como principal
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      throw error;
    }
  }

  /**
   * Cria reserva na coleção da escola (users/{userId}/reservations)
   */
  private async createSchoolReservation(
    userId: string,
    studentId: string,
    studentName: string,
    bookId: string,
    bookTitle: string,
    bookAuthor: string | undefined,
    bookCoverUrl: string | undefined,
    isAvailable: boolean
  ): Promise<string> {
    const reservationsRef = collection(db, `users/${userId}/reservations`);
    
    const now = Timestamp.now();
    const status = isAvailable ? 'ready' : 'pending';
    const type = isAvailable ? 'available' : 'waitlist';

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

    if (bookAuthor) reservationData.bookAuthor = bookAuthor;
    if (bookCoverUrl) reservationData.bookCoverUrl = bookCoverUrl;
    if (!isAvailable) reservationData.position = 1;
    if (isAvailable) reservationData.readyAt = now;

    const docRef = await addDoc(reservationsRef, reservationData);
    console.log('✅ Reserva criada na escola:', docRef.id);
    return docRef.id;
  }

  /**
   * Cria reserva na coleção global (student-reservations)
   */
  private async createGlobalReservation(
    userId: string,
    studentId: string,
    studentName: string,
    bookId: string,
    bookTitle: string,
    bookAuthor: string | undefined,
    bookCoverUrl: string | undefined,
    isAvailable: boolean
  ): Promise<string> {
    const reservationsRef = collection(db, 'student-reservations');
    
    const now = Timestamp.now();
    const status = isAvailable ? 'ready' : 'pending';
    const type = isAvailable ? 'available' : 'waitlist';

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

    if (bookAuthor) reservationData.bookAuthor = bookAuthor;
    if (bookCoverUrl) reservationData.bookCoverUrl = bookCoverUrl;
    if (!isAvailable) reservationData.position = 1;
    if (isAvailable) reservationData.readyAt = now;

    const docRef = await addDoc(reservationsRef, reservationData);
    console.log('✅ Reserva criada na coleção global:', docRef.id);
    return docRef.id;
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
   * Busca reservas de um aluno específico usando uma abordagem alternativa
   * Esta função tenta buscar da coleção global primeiro, depois da escola
   */
  async getStudentReservations(studentId: string, schoolId?: string): Promise<Reservation[]> {
    try {
      console.log('🔍 Buscando reservas do aluno:', { studentId, schoolId });
      
      // Primeiro, tentar buscar da coleção global (mais permissiva)
      try {
        const globalReservations = await this.getStudentReservationsFromGlobal(studentId);
        if (globalReservations.length > 0) {
          console.log('✅ Reservas encontradas na coleção global:', globalReservations.length);
          return globalReservations;
        }
      } catch (globalError) {
        console.log('⚠️ Erro ao buscar da coleção global, tentando escola:', globalError);
      }
      
      // Se não encontrou na global e tem schoolId, tentar da escola
      if (schoolId) {
        try {
          const schoolReservations = await this.getStudentReservationsFromSchool(schoolId, studentId);
          console.log('✅ Reservas encontradas na escola:', schoolReservations.length);
          return schoolReservations;
        } catch (schoolError) {
          console.log('⚠️ Erro ao buscar da escola:', schoolError);
        }
      }
      
      // Se chegou aqui, não encontrou reservas
      console.log('📚 Nenhuma reserva encontrada');
      return [];
    } catch (error) {
      console.error('Erro ao buscar reservas do aluno:', error);
      throw error;
    }
  }

  /**
   * Busca reservas de um aluno específico usando a coleção da escola
   * Esta função é mais segura pois usa as permissões da escola
   */
  async getStudentReservationsFromSchool(userId: string, studentId: string): Promise<Reservation[]> {
    try {
      console.log('🔍 Buscando reservas do aluno na escola:', { userId, studentId });
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const q = query(
        reservationsRef,
        where('studentId', '==', studentId)
        // Temporariamente removido orderBy para evitar erro de índice
        // orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      // Ordenar client-side temporariamente
      reservations.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('📚 Reservas encontradas na escola:', reservations.length);
      return reservations;
    } catch (error) {
      console.error('Erro ao buscar reservas do aluno na escola:', error);
      throw error;
    }
  }

  /**
   * Busca reservas de um aluno específico da coleção global
   */
  async getStudentReservationsFromGlobal(studentId: string): Promise<Reservation[]> {
    try {
      console.log('🔍 Buscando reservas do aluno:', studentId);
      const reservationsRef = collection(db, 'student-reservations');
      const q = query(
        reservationsRef,
        where('studentId', '==', studentId)
        // Temporariamente removido orderBy para evitar erro de índice
        // orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      // Ordenar client-side temporariamente
      reservations.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('📚 Reservas encontradas:', reservations.length);
      return reservations;
    } catch (error) {
      console.error('Erro ao buscar reservas do aluno:', error);
      throw error;
    }
  }

  /**
   * Deleta uma reserva da coleção global (student-reservations)
   * Função temporária para limpar dados incorretos
   */
  async deleteReservationFromGlobal(reservationId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando reserva da coleção global:', reservationId);
      const docRef = doc(db, 'student-reservations', reservationId);
      await deleteDoc(docRef);
      console.log('✅ Reserva deletada com sucesso da coleção global');
    } catch (error) {
      console.error('❌ Erro ao deletar reserva:', error);
      throw error;
    }
  }

  /**
   * Deleta todas as reservas de um aluno (útil para limpar dados de teste)
   */
  async deleteAllStudentReservations(studentId: string): Promise<number> {
    try {
      console.log('🗑️ Deletando todas as reservas do aluno:', studentId);
      const reservations = await this.getStudentReservationsFromGlobal(studentId);
      
      let deletedCount = 0;
      for (const reservation of reservations) {
        await this.deleteReservationFromGlobal(reservation.id);
        deletedCount++;
      }
      
      console.log(`✅ ${deletedCount} reservas deletadas com sucesso`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Erro ao deletar reservas:', error);
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
      console.log('🗑️ Deletando reserva do banco de dados:', reservationId);
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      await deleteDoc(docRef);
      console.log('✅ Reserva deletada com sucesso do Firebase');
    } catch (error) {
      console.error('❌ Erro ao deletar reserva:', error);
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

