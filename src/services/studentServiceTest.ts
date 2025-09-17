import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Função de teste para debug
export const testFirebaseAccess = async () => {
  console.log('🔍 Testando acesso ao Firebase...');
  
  try {
    // Teste 1: Acessar coleção users
    console.log('📁 Tentando acessar coleção users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    console.log(`✅ Sucesso! Encontrados ${usersSnapshot.size} usuários`);
    
    // Teste 2: Listar TODOS os IDs de usuários e seus metadados COMPLETOS
    console.log('🔍 INVESTIGAÇÃO DETALHADA:');
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 USUÁRIO ${index + 1}:`);
      console.log(`   🆔 ID: ${doc.id}`);
      console.log(`   📧 Email: ${data.email || 'sem email'}`);
      console.log(`   👤 Nome: ${data.name || 'sem nome'}`);
      console.log(`   📅 Criado: ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'sem data'}`);
      console.log(`   🔧 Role: ${data.role || 'sem role'}`);
      console.log(`   📊 Todos os campos:`, Object.keys(data));
      console.log('   ────────────────────────────────');
    });
    
    // Verificar se há limite nas regras
    console.log('🔍 VERIFICANDO LIMITAÇÕES DE ACESSO...');
    console.log(`Total de documentos retornados: ${usersSnapshot.size}`);
    console.log('Metadata do snapshot:', {
      empty: usersSnapshot.empty,
      size: usersSnapshot.size,
    });
    
    // Teste 3: Tentar acessar students de TODOS os usuários
    let totalStudents = 0;
    let allStudents: any[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🎯 Verificando alunos da escola: ${userId}`);
      
      try {
        const studentsRef = collection(db, `users/${userId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        const studentCount = studentsSnapshot.size;
        totalStudents += studentCount;
        
        console.log(`📚 Escola ${userId}: ${studentCount} alunos`);
        
        if (studentCount > 0) {
          const students = studentsSnapshot.docs.slice(0, 3).map(doc => {
            return {
              id: doc.id,
              name: doc.data().name,
              className: doc.data().className,
              schoolId: userId
            };
          });
          allStudents.push(...students);
          console.log(`🎓 Primeiros alunos desta escola:`, students);
        } else {
          // Se não tem alunos, vamos ver que outras coleções existem
          console.log(`🔍 Verificando outras coleções da escola ${userId}...`);
          try {
            const booksRef = collection(db, `users/${userId}/books`);
            const booksSnapshot = await getDocs(booksRef);
            console.log(`📚 Livros na escola ${userId}: ${booksSnapshot.size}`);
            
            const classesRef = collection(db, `users/${userId}/classes`);
            const classesSnapshot = await getDocs(classesRef);
            console.log(`🏫 Turmas na escola ${userId}: ${classesSnapshot.size}`);
          } catch (error) {
            console.log(`❌ Erro ao verificar outras coleções:`, error);
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao acessar alunos da escola ${userId}:`, error);
      }
    }
    
    console.log(`🎯 RESUMO: ${totalStudents} alunos em ${usersSnapshot.size} escolas`);
    console.log(`📋 Todos os alunos encontrados:`, allStudents);
    
    return {
      success: true,
      usersCount: usersSnapshot.size,
      studentsCount: totalStudents,
      sampleStudents: allStudents
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return {
      success: false,
      error: error
    };
  }
};
