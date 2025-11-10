import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { db } from './firebase';

const STUDENT_INDEX_COLLECTION = 'student-index';

export interface StudentIndexEntry {
  studentId: string;
  schoolId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const getStudentIndexDocRef = (studentId: string) => doc(db, STUDENT_INDEX_COLLECTION, studentId);

export const studentIndexService = {
  /**
   * Obtém o ID da escola associado a um aluno a partir do índice global.
   */
  async getSchoolId(studentId: string): Promise<string | null> {
    try {
      const indexDoc = await getDoc(getStudentIndexDocRef(studentId));
      if (indexDoc.exists()) {
        const data = indexDoc.data() as StudentIndexEntry;
        if (data?.schoolId) {
          return data.schoolId;
        }
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao consultar índice global de alunos:', error);
      return null;
    }
  },

  /**
   * Registra ou atualiza a associação entre aluno e escola no índice global.
   */
  async upsertEntry(studentId: string, schoolId: string): Promise<void> {
    try {
      const indexRef = getStudentIndexDocRef(studentId);
      const existingDoc = await getDoc(indexRef);

      const payload: Record<string, unknown> = {
        studentId,
        schoolId,
        updatedAt: serverTimestamp(),
      };

      if (!existingDoc.exists()) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(
        indexRef,
        payload,
        { merge: true }
      );
    } catch (error) {
      console.error('❌ Erro ao atualizar índice global de alunos:', error);
      if (error instanceof FirestoreError) {
        throw error;
      }
      throw new Error('Não foi possível registrar o aluno no índice global.');
    }
  },

  /**
   * Remove a associação do aluno com a escola no índice global.
   */
  async removeEntry(studentId: string): Promise<void> {
    try {
      await deleteDoc(getStudentIndexDocRef(studentId));
    } catch (error) {
      console.error('❌ Erro ao remover índice global de alunos:', error);
      if (error instanceof FirestoreError) {
        throw error;
      }
      throw new Error('Não foi possível remover o aluno do índice global.');
    }
  },
};

