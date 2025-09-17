import { 
  collection, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export const findStudentByIdDebug = async (studentId: string) => {
  console.log(`🔍 BUSCA DETALHADA pelo aluno: ${studentId}`);
  
  try {
    // Buscar em TODAS as escolas/usuários
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`👥 Verificando ${usersSnapshot.size} escolas...`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🏫 Procurando na escola: ${userId}`);
      
      try {
        // Tentar buscar o aluno específico nesta escola
        const studentRef = doc(db, `users/${userId}/students/${studentId}`);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          console.log(`🎯 ALUNO ENCONTRADO na escola ${userId}!`);
          console.log(`📋 Dados do aluno:`, {
            id: studentDoc.id,
            name: studentData.name,
            className: studentData.className,
            schoolId: userId,
            hasCredentials: studentData.hasCredentials,
            username: studentData.username
          });
          
          return {
            found: true,
            student: {
              id: studentDoc.id,
              name: studentData.name,
              className: studentData.className,
              educationalLevelId: studentData.educationalLevelId,
              userId: userId,
              username: studentData.username,
              hasCredentials: studentData.hasCredentials,
              tempPassword: studentData.tempPassword,
              createdAt: studentData.createdAt,
              updatedAt: studentData.updatedAt,
            },
            schoolId: userId
          };
        } else {
          console.log(`❌ Aluno ${studentId} NÃO encontrado na escola ${userId}`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao acessar escola ${userId}:`, error);
      }
    }
    
    console.log(`❌ Aluno ${studentId} NÃO encontrado em nenhuma escola!`);
    return { found: false };
    
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    return { found: false, error };
  }
};
