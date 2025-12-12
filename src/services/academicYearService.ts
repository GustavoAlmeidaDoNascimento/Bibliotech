import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { AcademicYear } from '../types/yearTurnover';

class AcademicYearService {
  /**
   * Busca o ano letivo ativo
   */
  async getActiveYear(userId: string): Promise<AcademicYear | null> {
    try {
      const yearsRef = collection(db, `users/${userId}/academicYears`);
      const q = query(yearsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return this.mapDocToYear(doc);
    } catch (error) {
      console.error('Erro ao buscar ano ativo:', error);
      return null;
    }
  }
  
  /**
   * Busca todos os anos letivos
   */
  async getAllYears(userId: string): Promise<AcademicYear[]> {
    try {
      const yearsRef = collection(db, `users/${userId}/academicYears`);
      const q = query(yearsRef, orderBy('year', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => this.mapDocToYear(doc));
    } catch (error) {
      console.error('Erro ao buscar anos letivos:', error);
      return [];
    }
  }
  
  /**
   * Busca um ano letivo específico por ID/year
   */
  async getYearById(userId: string, year: string): Promise<AcademicYear | null> {
    try {
      const yearRef = doc(db, `users/${userId}/academicYears/${year}`);
      const snapshot = await getDoc(yearRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return this.mapDocToYear(snapshot);
    } catch (error) {
      console.error('Erro ao buscar ano letivo:', error);
      return null;
    }
  }
  
  /**
   * Cria um novo ano letivo
   */
  async createYear(userId: string, year: string): Promise<AcademicYear> {
    try {
      const yearRef = doc(db, `users/${userId}/academicYears/${year}`);
      
      const yearData = {
        year,
        startDate: Timestamp.fromDate(new Date(`${year}-01-01`)),
        endDate: Timestamp.fromDate(new Date(`${year}-12-31`)),
        status: 'active',
        userId,
        createdAt: serverTimestamp()
      };
      
      await setDoc(yearRef, yearData);
      
      return {
        id: year,
        year,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        status: 'active',
        userId,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Erro ao criar ano letivo:', error);
      throw error;
    }
  }
  
  /**
   * Arquiva um ano letivo
   */
  async archiveYear(userId: string, year: string): Promise<void> {
    try {
      const yearRef = doc(db, `users/${userId}/academicYears/${year}`);
      
      await updateDoc(yearRef, {
        status: 'archived',
        archivedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao arquivar ano letivo:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se o próximo ano já existe
   */
  async getNextYear(currentYear: string): Promise<string> {
    const nextYear = (parseInt(currentYear) + 1).toString();
    return nextYear;
  }
  
  /**
   * Mapeia documento Firestore para AcademicYear
   */
  private mapDocToYear(doc: any): AcademicYear {
    const data = doc.data();
    return {
      id: doc.id,
      year: data.year,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      status: data.status,
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date(),
      archivedAt: data.archivedAt?.toDate()
    };
  }
  
  /**
   * Cria o primeiro ano letivo se não existir nenhum
   */
  async ensureActiveYear(userId: string): Promise<AcademicYear | null> {
    const activeYear = await this.getActiveYear(userId);
    
    if (activeYear) {
      return activeYear;
    }
    
    // Só criar se realmente não existir nenhum ano
    // Retornar null para que o componente decida o que fazer
    return null;
  }
}

export const academicYearService = new AcademicYearService();

