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
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { studentService } from './studentService';

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
  notifiedStudents?: string[]; // Array de IDs dos alunos que foram avisados sobre devolução
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
    console.log('🚀 createReservation chamado:', { userId, studentId, studentName, bookTitle });
    try {
      // Criar reserva na coleção da escola (para gestores)
      const schoolReservationId = await this.createSchoolReservation(
        userId, studentId, studentName, bookId, bookTitle, bookAuthor, bookCoverUrl, isAvailable
      );
      console.log('✅ Reserva da escola criada:', schoolReservationId);
      
      // Criar reserva na coleção global (para alunos)
      const globalReservationId = await this.createGlobalReservation(
        userId, studentId, studentName, bookId, bookTitle, bookAuthor, bookCoverUrl, isAvailable
      );
      console.log('✅ Reserva global criada:', globalReservationId);
      
      // Criar notificação para o gestor
      console.log('📢 Tentando criar notificação de reserva...', {
        schoolReservationId,
        studentName,
        bookTitle,
        bookId,
        userId
      });
      try {
        await this.createReservationNotification(
          schoolReservationId,
          studentName,
          bookTitle,
          bookId,
          userId
        );
        console.log('✅ Notificação de reserva criada com sucesso');
      } catch (notificationError) {
        // Não falhar a criação da reserva se a notificação falhar
        console.error('❌ Erro ao criar notificação de reserva:', notificationError);
        console.error('Stack:', notificationError instanceof Error ? notificationError.stack : 'N/A');
      }
      
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
   * Busca reservas de um aluno específico
   * Busca PRIMEIRO da coleção da escola (mesmo caminho que a bibliotecária usa)
   * Isso garante sincronização: quando a bibliotecária deleta, o aluno também não vê
   * Se não encontrar na escola, usa a coleção global como fallback
   */
  async getStudentReservations(studentId: string, schoolId?: string): Promise<Reservation[]> {
    try {
      console.log('🔍 Buscando reservas do aluno:', { studentId, schoolId });
      
      // CORREÇÃO: Buscar PRIMEIRO da coleção da escola (mesmo caminho que a bibliotecária usa)
      // Isso garante que quando a bibliotecária deleta uma reserva, o aluno também não a verá
      if (schoolId) {
        try {
          const schoolReservations = await this.getStudentReservationsFromSchool(schoolId, studentId);
          console.log('✅ Reservas encontradas na escola:', schoolReservations.length);
          return schoolReservations;
        } catch (schoolError) {
          console.log('⚠️ Erro ao buscar da escola, tentando coleção global:', schoolError);
        }
      }
      
      // Se não encontrou na escola ou não tem schoolId, tentar da coleção global como fallback
      try {
        const globalReservations = await this.getStudentReservationsFromGlobal(studentId);
        if (globalReservations.length > 0) {
          console.log('✅ Reservas encontradas na coleção global:', globalReservations.length);
          return globalReservations;
        }
      } catch (globalError) {
        console.log('⚠️ Erro ao buscar da coleção global:', globalError);
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
   * Filtra apenas reservas ativas (pending ou ready), excluindo completed, cancelled e expired
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
      
      const allReservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      // Filtrar apenas reservas ativas (pending ou ready)
      const activeReservations = allReservations.filter(res => 
        res.status === 'pending' || res.status === 'ready'
      );
      
      // Ordenar client-side temporariamente
      activeReservations.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`📚 Reservas encontradas na escola: ${allReservations.length} total, ${activeReservations.length} ativas`);
      return activeReservations;
    } catch (error) {
      console.error('Erro ao buscar reservas do aluno na escola:', error);
      throw error;
    }
  }

  /**
   * Busca reservas de um aluno específico da coleção global
   * Filtra apenas reservas ativas (pending ou ready), excluindo completed, cancelled e expired
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
      
      const allReservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      // Filtrar apenas reservas ativas (pending ou ready)
      const activeReservations = allReservations.filter(res => 
        res.status === 'pending' || res.status === 'ready'
      );
      
      // Ordenar client-side temporariamente
      activeReservations.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`📚 Reservas encontradas: ${allReservations.length} total, ${activeReservations.length} ativas`);
      return activeReservations;
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
   * Cancela/deleta uma reserva feita por um aluno (sem autenticação)
   * Tenta deletar tanto da coleção da escola quanto da coleção global
   */
  async cancelStudentReservation(
    reservationId: string,
    studentId: string,
    userId?: string
  ): Promise<void> {
    try {
      console.log('🗑️ Cancelando reserva do aluno:', { reservationId, studentId, userId });
      
      let deletedFromSchool = false;
      let deletedFromGlobal = false;
      
      // Tentar deletar da coleção global (student-reservations)
      try {
        const globalReservationRef = doc(db, 'student-reservations', reservationId);
        const globalReservationSnap = await getDoc(globalReservationRef);
        
        if (globalReservationSnap.exists()) {
          const reservationData = globalReservationSnap.data() as Reservation;
          
          // Validar que o studentId corresponde
          if (reservationData.studentId === studentId) {
            await deleteDoc(globalReservationRef);
            console.log('✅ Reserva deletada da coleção global');
            deletedFromGlobal = true;
          } else {
            console.log('⚠️ StudentId não corresponde na coleção global');
          }
        }
      } catch (globalError: any) {
        console.log('⚠️ Erro ao deletar da coleção global (continuando):', globalError.message);
      }
      
      // Tentar deletar da coleção da escola (se userId fornecido)
      if (userId) {
        try {
          const schoolReservationRef = doc(db, `users/${userId}/reservations`, reservationId);
          const schoolReservationSnap = await getDoc(schoolReservationRef);
          
          if (schoolReservationSnap.exists()) {
            const reservationData = schoolReservationSnap.data() as Reservation;
            
            // Validar que o studentId corresponde
            if (reservationData.studentId === studentId) {
              await deleteDoc(schoolReservationRef);
              console.log('✅ Reserva deletada da coleção da escola');
              deletedFromSchool = true;
            } else {
              console.log('⚠️ StudentId não corresponde na coleção da escola');
            }
          }
        } catch (schoolError: any) {
          console.log('⚠️ Erro ao deletar da coleção da escola (continuando):', schoolError.message);
        }
      }
      
      if (!deletedFromGlobal && !deletedFromSchool) {
        // Tentar buscar por studentId e bookId se não encontrou pelo ID
        console.log('⚠️ Reserva não encontrada pelos IDs, tentando buscar por studentId...');
        
        if (userId) {
          try {
            const schoolReservationsRef = collection(db, `users/${userId}/reservations`);
            const schoolQuery = query(
              schoolReservationsRef,
              where('studentId', '==', studentId)
            );
            const schoolSnapshot = await getDocs(schoolQuery);
            
            const matchingReservation = schoolSnapshot.docs.find(doc => doc.id === reservationId);
            if (matchingReservation) {
              await deleteDoc(matchingReservation.ref);
              console.log('✅ Reserva deletada da coleção da escola (busca por studentId)');
              deletedFromSchool = true;
            }
          } catch (error) {
            console.log('⚠️ Erro na busca alternativa na escola:', error);
          }
        }
        
        try {
          const globalReservationsRef = collection(db, 'student-reservations');
          const globalQuery = query(
            globalReservationsRef,
            where('studentId', '==', studentId)
          );
          const globalSnapshot = await getDocs(globalQuery);
          
          const matchingReservation = globalSnapshot.docs.find(doc => doc.id === reservationId);
          if (matchingReservation) {
            await deleteDoc(matchingReservation.ref);
            console.log('✅ Reserva deletada da coleção global (busca por studentId)');
            deletedFromGlobal = true;
          }
        } catch (error) {
          console.log('⚠️ Erro na busca alternativa na global:', error);
        }
      }
      
      if (!deletedFromGlobal && !deletedFromSchool) {
        throw new Error('Reserva não encontrada ou não autorizado para cancelar');
      }
      
      console.log('✅ Processo de cancelamento concluído');
    } catch (error) {
      console.error('❌ Erro ao cancelar reserva:', error);
      throw error;
    }
  }

  /**
   * Deletar reserva (quando livro foi retirado)
   * Deleta tanto da coleção da escola quanto da coleção global (student-reservations)
   */
  async deleteReservation(userId: string, reservationId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando reserva do banco de dados:', reservationId);
      
      // Primeiro, buscar os dados da reserva para encontrar a correspondente na coleção global
      const reservationRef = doc(db, `users/${userId}/reservations`, reservationId);
      const reservationSnap = await getDoc(reservationRef);
      
      if (!reservationSnap.exists()) {
        console.log('⚠️ Reserva não encontrada na coleção da escola');
        return;
      }
      
      const reservationData = reservationSnap.data() as Reservation;
      
      // Deletar da coleção da escola
      await deleteDoc(reservationRef);
      console.log('✅ Reserva deletada com sucesso da coleção da escola');
      
      // Buscar e deletar a reserva correspondente na coleção global
      // Usar studentId, bookId e userId para encontrar a correspondente
      try {
        const globalReservationsRef = collection(db, 'student-reservations');
        
        // Tentar primeiro com query composta (pode precisar de índice)
        let deleted = false;
        try {
          const globalQuery = query(
            globalReservationsRef,
            where('studentId', '==', reservationData.studentId),
            where('bookId', '==', reservationData.bookId),
            where('userId', '==', userId)
          );
          const globalSnapshot = await getDocs(globalQuery);
          
          if (!globalSnapshot.empty) {
            // Deletar todas as reservas correspondentes encontradas (pode haver duplicatas)
            const deletePromises = globalSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ ${globalSnapshot.docs.length} reserva(s) deletada(s) da coleção global`);
            deleted = true;
          }
        } catch (queryError: any) {
          // Se a query composta falhar (falta de índice), tentar abordagem alternativa
          console.log('⚠️ Query composta falhou, tentando abordagem alternativa:', queryError.message);
          
          // Buscar todas as reservas do aluno e filtrar manualmente
          const studentQuery = query(
            globalReservationsRef,
            where('studentId', '==', reservationData.studentId)
          );
          const allStudentReservations = await getDocs(studentQuery);
          
          // Filtrar manualmente as reservas que correspondem
          const matchingDocs = allStudentReservations.docs.filter(doc => {
            const data = doc.data();
            return data.bookId === reservationData.bookId && data.userId === userId;
          });
          
          // Deletar diretamente os documentos encontrados
          if (matchingDocs.length > 0) {
            const deletePromises = matchingDocs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ ${matchingDocs.length} reserva(s) deletada(s) da coleção global (abordagem alternativa)`);
            deleted = true;
          }
        }
        
        if (!deleted) {
          console.log('⚠️ Reserva correspondente não encontrada na coleção global (pode já ter sido deletada)');
        }
      } catch (globalError) {
        console.error('⚠️ Erro ao deletar da coleção global (continuando):', globalError);
        // Não falhar se não conseguir deletar da coleção global
        // A reserva já foi deletada da coleção da escola
      }
      
      console.log('✅ Processo de deleção concluído');
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
   * Marca um aluno como avisado sobre devolução na reserva
   */
  async markStudentAsNotified(userId: string, reservationId: string, studentId: string): Promise<void> {
    try {
      console.log('📢 Marcando aluno como avisado:', { reservationId, studentId });
      
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Reserva não encontrada');
      }
      
      const reservationData = docSnap.data();
      const notifiedStudents = reservationData.notifiedStudents || [];
      
      // Adicionar o aluno ao array se ainda não estiver
      if (!notifiedStudents.includes(studentId)) {
        notifiedStudents.push(studentId);
        
        await updateDoc(docRef, {
          notifiedStudents: notifiedStudents,
          lastNotificationAt: serverTimestamp()
        });
        
        console.log('✅ Aluno marcado como avisado:', studentId);
      } else {
        console.log('ℹ️ Aluno já estava marcado como avisado:', studentId);
      }
    } catch (error) {
      console.error('Erro ao marcar aluno como avisado:', error);
      throw error;
    }
  }

  /**
   * Verifica se um aluno já foi avisado sobre devolução
   */
  async isStudentNotified(userId: string, reservationId: string, studentId: string): Promise<boolean> {
    try {
      const docRef = doc(db, `users/${userId}/reservations`, reservationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return false;
      }
      
      const reservationData = docSnap.data();
      const notifiedStudents = reservationData.notifiedStudents || [];
      
      return notifiedStudents.includes(studentId);
    } catch (error) {
      console.error('Erro ao verificar se aluno foi avisado:', error);
      return false;
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

  /**
   * Cria uma notificação de reserva para o gestor
   */
  async createReservationNotification(
    reservationId: string,
    studentName: string,
    bookTitle: string,
    bookId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log('🔔 Iniciando criação de notificação de reserva:', {
        reservationId,
        studentName,
        bookTitle,
        bookId,
        userId
      });

      // Verificar se o livro está emprestado para alguém
      let message = '';
      let title = '';
      
      try {
        const activeLoans = await studentService.getActiveLoansByBook(bookId, userId);
        console.log('📚 Empréstimos ativos encontrados:', activeLoans.length);
        
        if (activeLoans.length > 0 && activeLoans[0].studentName) {
          // Livro está com outro aluno
          title = `Nova Reserva: ${studentName} reservou "${bookTitle}"`;
          message = `${studentName} reservou o livro "${bookTitle}", que está com ${activeLoans[0].studentName}`;
        } else {
          // Livro está disponível
          title = `Nova Reserva: ${studentName} reservou "${bookTitle}"`;
          message = `${studentName} reservou o livro "${bookTitle}"`;
        }
      } catch (error) {
        // Em caso de erro, usar mensagem padrão
        console.error('Erro ao verificar empréstimos ativos:', error);
        title = `Nova Reserva: ${studentName} reservou "${bookTitle}"`;
        message = `${studentName} reservou o livro "${bookTitle}"`;
      }

      const notificationId = `reservation-${reservationId}`;
      const newNotification = {
        id: notificationId,
        title,
        message,
        type: 'reservation',
        reservationId,
        studentName,
        bookTitle,
        createdAt: Timestamp.now()
      };

      console.log('📝 Notificação criada:', newNotification);

      // Salvar na coleção de notificações de reserva do gestor
      const reservationNotificationsRef = doc(db, `users/${userId}/reservationNotifications/notifications`);
      console.log('💾 Salvando em:', `users/${userId}/reservationNotifications/notifications`);
      
      const reservationNotificationsDoc = await getDoc(reservationNotificationsRef);
      
      let existingNotifications = [];
      if (reservationNotificationsDoc.exists()) {
        const data = reservationNotificationsDoc.data();
        existingNotifications = data.notifications || [];
        console.log('📋 Notificações existentes:', existingNotifications.length);
      } else {
        console.log('📋 Nenhuma notificação existente encontrada');
      }
      
      // Adicionar nova notificação no início da lista
      const updatedNotifications = [newNotification, ...existingNotifications];
      
      // Manter apenas as últimas 100 notificações para não sobrecarregar
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      console.log('💾 Tentando salvar notificação no Firebase...');
      await setDoc(reservationNotificationsRef, {
        notifications: limitedNotifications,
        lastUpdated: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Notificação de reserva salva com sucesso:', notificationId);
      console.log('📊 Total de notificações:', limitedNotifications.length);
    } catch (error: any) {
      console.error('❌ Erro ao criar notificação de reserva:', error);
      console.error('Erro code:', error?.code);
      console.error('Erro message:', error?.message);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      // Não lançar erro para não quebrar o fluxo de criação de reserva
    }
  }

}

export const reservationService = new ReservationService();

