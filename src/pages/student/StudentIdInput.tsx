import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { studentService } from '../../services/studentService';
import { testFirebaseAccess } from '../../services/studentServiceTest';
import { findStudentByIdDebug } from '../../services/findStudentByIdDebug';
import styles from './StudentIdInput.module.css';
import { UserCircleIcon, ArrowLeftIcon, IdentificationIcon } from '@heroicons/react/24/solid';

const StudentIdInput: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const { execute: executeSearch, isLoading, error } = useAsync<void>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      return;
    }

    try {
      await executeSearch(async () => {
        const student = await studentService.findStudentById(studentId.trim());
        if (student) {
          navigate(`/student-welcome/${studentId.trim()}`);
        } else {
          throw new Error('Aluno não encontrado. Verifique se o ID está correto.');
        }
      });
    } catch (error) {
      // Erro é gerenciado pelo hook useAsync
      console.error('Erro ao buscar aluno:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentId(e.target.value);
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.backButton}
        onClick={handleGoBack}
        type="button"
        aria-label="Voltar"
      >
        <ArrowLeftIcon className={styles.backIcon} />
        <span>Voltar</span>
      </button>
      
      <div className={styles.inputCard}>
        <div className={styles.logo}>
          <IdentificationIcon style={{ width: 48, height: 48, color: 'white' }} />
        </div>
        
        <h2>Portal do Aluno</h2>
        <p className={styles.subtitle}>Digite seu ID para acessar</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="studentId">ID do Aluno</label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              value={studentId}
              onChange={handleInputChange}
              placeholder="Digite seu ID único"
              required
              disabled={isLoading}
              className={styles.input}
            />
            <p className={styles.inputHelper}>
              Seu ID foi fornecido pela bibliotecária
            </p>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !studentId.trim()} 
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Verificando...
              </>
            ) : (
              <>
                <UserCircleIcon className={styles.buttonIcon} />
                Acessar
              </>
            )}
          </button>
        </form>
        
        <div className={styles.helpSection}>
          <p className={styles.helpText}>
            Não tem seu ID? Procure a bibliotecária da sua escola.
          </p>
          
          {/* Botão de teste temporário para debug */}
          <button 
            type="button"
            onClick={async () => {
              console.log('🧪 Teste manual iniciado...');
              const result = await testFirebaseAccess();
              console.log('🧪 Resultado:', result);
              alert(`Teste concluído! Verifique o console. Sucesso: ${result?.success || false}`);
            }}
            className={styles.testButton}
          >
            🧪 Testar Acesso Firebase
          </button>
          
          {/* Botão para buscar aluno específico */}
          <button 
            type="button"
            onClick={async () => {
              const id = prompt('Digite o ID do aluno para buscar:');
              if (id) {
                console.log(`🔍 Buscando aluno: ${id}`);
                const result = await findStudentByIdDebug(id);
                console.log('🎯 Resultado da busca:', result);
                if (result.found) {
                  alert(`Aluno encontrado! Nome: ${result.student?.name} | Escola: ${result.schoolId}`);
                } else {
                  alert('Aluno não encontrado em nenhuma escola!');
                }
              }
            }}
            className={styles.testButton}
            style={{ backgroundColor: '#4caf50', marginLeft: '8px' }}
          >
            🔍 Buscar Aluno
          </button>
          
          {/* Botão para testar todas as escolas conhecidas */}
          <button 
            type="button"
            onClick={async () => {
              const schoolIds = [
                '9PKyLnC37EP5cV6n7cdbLqcF2vI3',
                'rkCZozqfmoPspakPwswFA4qWqAo1', 
                'gPGYmNxF4HfZK0GaL1L73ANJRyC2',
                'Ncuxq4WEowb1enPGP3YUEqyCZJk1',
                'VK7DnqLgJHiuLN0Uj4rZ' // A que já aparece
              ];
              
              console.log('🏫 TESTANDO TODAS AS ESCOLAS CONHECIDAS:');
              let totalStudents = 0;
              
              for (const schoolId of schoolIds) {
                console.log(`🔍 Testando escola: ${schoolId}`);
                try {
                  const { collection, getDocs } = await import('firebase/firestore');
                  const { db } = await import('../../services/firebase');
                  
                  const studentsRef = collection(db, `users/${schoolId}/students`);
                  const snapshot = await getDocs(studentsRef);
                  
                  console.log(`✅ Escola ${schoolId}: ${snapshot.size} alunos`);
                  totalStudents += snapshot.size;
                  
                  if (snapshot.size > 0) {
                    const students = snapshot.docs.slice(0, 3).map(doc => ({
                      id: doc.id,
                      name: doc.data().name,
                      className: doc.data().className
                    }));
                    console.log(`   👥 Alunos exemplo:`, students);
                  }
                } catch (error) {
                  console.error(`❌ Erro ao acessar escola ${schoolId}:`, error);
                }
              }
              
              console.log(`🎯 TOTAL: ${totalStudents} alunos em ${schoolIds.length} escolas`);
              alert(`Teste concluído! Total: ${totalStudents} alunos. Verifique o console para detalhes.`);
            }}
            className={styles.testButton}
            style={{ backgroundColor: '#ff9800', marginLeft: '8px', fontSize: '0.7rem' }}
          >
            🏫 Testar Todas Escolas
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentIdInput;
