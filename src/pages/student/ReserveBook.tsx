import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, BookOpen, Calendar, Bell } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import styles from './ReserveBook.module.css';

const ReserveBook: React.FC = () => {
  const navigate = useNavigate();
  const { studentId, bookId } = useParams<{ studentId: string; bookId: string }>();

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/book/${bookId}`);
  };

  const handleBackToHome = () => {
    navigate(`/student-dashboard/${studentId}/home`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1>Reservar Livro</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.constructionContainer}>
          <div className={styles.iconContainer}>
            <Clock size={64} />
          </div>
          
          <h2>Funcionalidade em Construção</h2>
          
          <p className={styles.description}>
            O sistema de reservas de livros ainda está sendo desenvolvido. Em breve você poderá reservar livros para garantir que sejam seus quando estiverem disponíveis.
          </p>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <Heart size={20} />
              <span>Reservar livros disponíveis</span>
            </div>
            <div className={styles.featureItem}>
              <Clock size={20} />
              <span>Entrar na fila de espera</span>
            </div>
            <div className={styles.featureItem}>
              <Bell size={20} />
              <span>Receber notificação quando disponível</span>
            </div>
            <div className={styles.featureItem}>
              <BookOpen size={20} />
              <span>Acompanhar posição na fila</span>
            </div>
          </div>

          <div className={styles.howItWorks}>
            <h3>Como funcionará:</h3>
            <p>
              📖 <strong>Livro disponível:</strong> Você reserva para pegá-lo quando quiser<br/>
              📋 <strong>Livro emprestado:</strong> Você entra na fila de espera<br/>
              🔔 <strong>Quando devolver:</strong> Você é notificado para pegá-lo<br/>
              ⏰ <strong>Prazo:</strong> Tempo limite para retirar o livro
            </p>
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={handleBack} className={styles.backToBookButton}>
              Voltar ao Livro
            </button>
            <button onClick={handleBackToHome} className={styles.backToHomeButton}>
              Voltar ao Início
            </button>
          </div>
        </div>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="home" />
    </div>
  );
};

export default ReserveBook;
