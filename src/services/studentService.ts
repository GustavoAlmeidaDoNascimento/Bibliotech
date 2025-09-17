import { 
  collection, 
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Student } from '../types/common';

// Interfaces para o dashboard do aluno
export interface StudentLoan {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned';
  genres?: string[];
  createdAt: Date;
  completed: boolean;
  readPercentage?: number;
}

export interface StudentBook {
  id: string;
  title: string;
  genres?: string[];
  authors?: string[];
  description?: string;
}

export interface StudentDashboardData {
  student: Student;
  loans: StudentLoan[];
  books: StudentBook[];
}

export const studentService = {
  /**
   * Busca um aluno por ID em todas as bibliotecas
   * @param studentId ID do aluno
   * @returns Promise<Student | null>
   */
  findStudentById: async (studentId: string): Promise<Student | null> => {
    try {
      // Lista conhecida de escolas para garantir que busque em todas
      const knownSchoolIds = [
        '9PKyLnC37EP5cV6n7cdbLqcF2vI3',
        'rkCZozqfmoPspakPwswFA4qWqAo1',
        'gPGYmNxF4HfZK0GaL1L73ANJRyC2',
        'Ncuxq4WEowb1enPGP3YUEqyCZJk1',
        'VK7DnqLgJHiuLN0Uj4rZ'
      ];
      
      console.log(`🔍 Buscando aluno ${studentId} em ${knownSchoolIds.length} escolas conhecidas...`);
      
      // Buscar nas escolas conhecidas diretamente
      for (const schoolId of knownSchoolIds) {
        try {
          console.log(`🏫 Verificando escola: ${schoolId}`);
          const studentRef = doc(db, `users/${schoolId}/students/${studentId}`);
          const studentDoc = await getDoc(studentRef);
          
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            console.log(`✅ Aluno encontrado na escola ${schoolId}!`);
            console.log(`📋 Dados completos do aluno:`, studentData);
            return {
              id: studentDoc.id,
              name: studentData.name,
              className: studentData.classroom || studentData.className || studentData.class || studentData.turma,
              educationalLevelId: studentData.educationalLevelId,
              userId: schoolId,
              username: studentData.username,
              hasCredentials: studentData.hasCredentials,
              tempPassword: studentData.tempPassword,
              createdAt: studentData.createdAt,
              updatedAt: studentData.updatedAt,
            };
          } else {
            console.log(`❌ Aluno ${studentId} não encontrado na escola ${schoolId}`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao acessar escola ${schoolId}:`, error);
          continue;
        }
      }
      
      // Se não encontrou nas escolas conhecidas, tenta buscar via collection users
      console.log('🔄 Tentando busca via collection users...');
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        for (const userDoc of usersSnapshot.docs) {
          if (knownSchoolIds.includes(userDoc.id)) {
            continue; // Já testamos essas escolas
          }
          
          try {
            const studentRef = doc(db, `users/${userDoc.id}/students/${studentId}`);
            const studentDoc = await getDoc(studentRef);
            
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              console.log(`✅ Aluno encontrado na escola ${userDoc.id} via busca geral!`);
              console.log(`📋 Dados completos do aluno (busca geral):`, studentData);
              return {
                id: studentDoc.id,
                name: studentData.name,
                className: studentData.classroom || studentData.className || studentData.class || studentData.turma,
                educationalLevelId: studentData.educationalLevelId,
                userId: userDoc.id,
                username: studentData.username,
                hasCredentials: studentData.hasCredentials,
                tempPassword: studentData.tempPassword,
                createdAt: studentData.createdAt,
                updatedAt: studentData.updatedAt,
              };
            }
          } catch (error) {
            console.log(`Não foi possível acessar alunos da biblioteca ${userDoc.id}`);
            continue;
          }
        }
      } catch (error) {
        console.log('❌ Erro na busca via collection users:', error);
      }
      
      // Aluno não encontrado em nenhuma biblioteca
      console.log(`❌ Aluno ${studentId} não encontrado em nenhuma escola!`);
      return null;
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
      
      // Verificar se é erro de permissão do Firebase
      if (error instanceof Error && error.message.includes('permissions')) {
        throw new Error('Erro de permissão: As regras do Firebase precisam ser atualizadas para permitir acesso público aos dados dos alunos.');
      }
      
      throw new Error('Erro ao buscar dados do aluno. Verifique sua conexão e tente novamente.');
    }
  },

  /**
   * Valida se um ID de aluno existe
   * @param studentId ID do aluno
   * @returns Promise<boolean>
   */
  validateStudentId: async (studentId: string): Promise<boolean> => {
    const student = await studentService.findStudentById(studentId);
    return student !== null;
  },

  /**
   * Busca todos os dados do dashboard de um aluno
   * @param studentId ID do aluno
   * @returns Promise<StudentDashboardData | null>
   */
  getStudentDashboardData: async (studentId: string): Promise<StudentDashboardData | null> => {
    try {
      console.log(`📊 Buscando dados completos do dashboard para aluno ${studentId}...`);
      
      // Primeiro, buscar o aluno para saber em qual escola está
      const student = await studentService.findStudentById(studentId);
      if (!student) {
        console.log(`❌ Aluno ${studentId} não encontrado`);
        return null;
      }

      const schoolId = student.userId;
      console.log(`🏫 Aluno encontrado na escola: ${schoolId}`);

      // Buscar empréstimos do aluno
      const loans = await studentService.getStudentLoans(schoolId, studentId);
      console.log(`📚 Encontrados ${loans.length} empréstimos`);

      // Buscar dados dos livros emprestados
      const bookIds = Array.from(new Set(loans.map(loan => loan.bookId)));
      const books = await studentService.getBooks(schoolId, bookIds);
      console.log(`📖 Encontrados ${books.length} livros`);

      return {
        student,
        loans,
        books
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw new Error('Erro ao carregar dados do dashboard. Verifique sua conexão.');
    }
  },

  /**
   * Busca empréstimos de um aluno específico
   * @param schoolId ID da escola
   * @param studentId ID do aluno
   * @returns Promise<StudentLoan[]>
   */
  getStudentLoans: async (schoolId: string, studentId: string): Promise<StudentLoan[]> => {
    try {
      console.log(`📚 Buscando empréstimos do aluno ${studentId} na escola ${schoolId}...`);
      
      const loansRef = collection(db, `users/${schoolId}/loans`);
      const q = query(
        loansRef,
        where('studentId', '==', studentId)
      );

      const loansSnapshot = await getDocs(q);
      
      if (loansSnapshot.empty) {
        console.log(`📭 Nenhum empréstimo encontrado para o aluno ${studentId}`);
        return [];
      }

      const loans = loansSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Converter timestamps para Dates
        const borrowDate = data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date();
        const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date();
        const returnDate = data.returnDate?.toDate ? data.returnDate.toDate() : undefined;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        
        return {
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          bookId: data.bookId,
          bookTitle: data.bookTitle,
          borrowDate,
          dueDate,
          returnDate,
          status: data.status,
          genres: data.genres,
          createdAt,
          completed: data.completed || false,
          readPercentage: data.readPercentage
        };
      }) as StudentLoan[];

      console.log(`✅ ${loans.length} empréstimos carregados com sucesso`);
      return loans;
    } catch (error) {
      console.error(`Erro ao buscar empréstimos do aluno ${studentId}:`, error);
      if (error instanceof Error && error.message.includes('permissions')) {
        throw new Error('Erro de permissão: As regras do Firebase precisam ser atualizadas para permitir acesso aos empréstimos.');
      }
      throw new Error('Erro ao buscar empréstimos do aluno.');
    }
  },

  /**
   * Busca dados dos livros por IDs
   * @param schoolId ID da escola
   * @param bookIds Array de IDs dos livros
   * @returns Promise<StudentBook[]>
   */
  getBooks: async (schoolId: string, bookIds: string[]): Promise<StudentBook[]> => {
    try {
      if (bookIds.length === 0) {
        return [];
      }

      console.log(`📖 Buscando dados de ${bookIds.length} livros na escola ${schoolId}...`);
      
      const books: StudentBook[] = [];
      
      // Buscar cada livro individualmente
      for (const bookId of bookIds) {
        try {
          const bookRef = doc(db, `users/${schoolId}/books/${bookId}`);
          const bookSnapshot = await getDoc(bookRef);
          
          if (bookSnapshot.exists()) {
            const bookData = bookSnapshot.data();
            books.push({
              id: bookSnapshot.id,
              title: bookData.title,
              genres: bookData.genres,
              authors: bookData.authors,
              description: bookData.description
            });
          }
        } catch (error) {
          console.log(`⚠️ Erro ao buscar livro ${bookId}:`, error);
          continue;
        }
      }

      console.log(`✅ ${books.length} livros carregados com sucesso`);
      return books;
    } catch (error) {
      console.error('Erro ao buscar dados dos livros:', error);
      if (error instanceof Error && error.message.includes('permissions')) {
        throw new Error('Erro de permissão: As regras do Firebase precisam ser atualizadas para permitir acesso aos livros.');
      }
      throw new Error('Erro ao buscar dados dos livros.');
    }
  }
};
