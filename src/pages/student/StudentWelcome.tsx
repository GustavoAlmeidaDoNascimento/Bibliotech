import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { studentService } from '../../services/studentService';
import { Student } from '../../types/common';
import styles from './StudentWelcome.module.css';
import { ArrowLeftIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/solid';

const StudentWelcome: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const { execute: executeLoadStudent, isLoading, error } = useAsync<Student | null>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId) {
      navigate('/student-id-input');
      return;
    }

    const loadStudent = async () => {
      try {
        const studentData = await executeLoadStudent(() => 
          studentService.findStudentById(studentId)
        );
        
        if (studentData) {
          setStudent(studentData);
        } else {
          // Se não encontrou o aluno, navega de volta
          navigate('/student-id-input');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
        navigate('/student-id-input');
      }
    };

    loadStudent();
  }, [studentId, navigate, executeLoadStudent]);

  const handleGoBack = () => {
    navigate('/student-id-input');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Carregando suas informações...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Ops! Algo deu errado</h2>
          <p>Não conseguimos encontrar seus dados.</p>
          <button onClick={handleGoBack} className={styles.backButton}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
      
      <div className={styles.welcomeCard}>
        <div className={styles.header}>
          <div className={styles.iconGroup}>
            <SparklesIcon className={styles.sparkleIcon} />
            <AcademicCapIcon className={styles.mainIcon} />
            <SparklesIcon className={styles.sparkleIcon} />
          </div>
        </div>
        
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Olá, <span className={styles.studentName}>{student.name}</span>!
          </h1>
          
          <p className={styles.welcomeSubtitle}>
            Bem-vindo ao portal do aluno
          </p>
          
          <div className={styles.studentInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Turma:</span>
              <span className={styles.infoValue}>{student.className}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ID:</span>
              <span className={styles.infoValue}>{student.id}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <p className={styles.comingSoonText}>
            Em breve você terá acesso ao seu dashboard completo com empréstimos, 
            recomendações e muito mais!
          </p>
          
          <div className={styles.buttonGroup}>
            <button 
              onClick={handleGoBack}
              className={styles.secondaryButton}
            >
              Acessar Novamente
            </button>
            
            <button 
              onClick={handleGoToLogin}
              className={styles.primaryButton}
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWelcome;
