import { 
  collection, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Student } from '../types/common';

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
            return {
              id: studentDoc.id,
              name: studentData.name,
              className: studentData.className,
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
              return {
                id: studentDoc.id,
                name: studentData.name,
                className: studentData.className,
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
  }
};
