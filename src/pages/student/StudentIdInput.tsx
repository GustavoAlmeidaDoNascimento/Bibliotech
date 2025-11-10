import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { studentService } from '../../services/studentService';
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
        const trimmedId = studentId.trim();
        const student = await studentService.findStudentById(trimmedId);
        if (student) {
            const canonicalAccessCode = student.userId ? `${student.userId}@${student.id}` : trimmedId;
            navigate(`/student-dashboard/${canonicalAccessCode}`);
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
    navigate('/select-user-type');
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
        </div>
      </div>
    </div>
  );
};

export default StudentIdInput;
