import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import BottomNavigation from '../../components/student/BottomNavigation';
import styles from './MyBooks.module.css';

const MyBooks: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();

  const handleBack = () => {
    navigate(`/student-dashboard/${studentId}/profile`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={24} />
          </button>
          <h1>Meus Livros Reservados</h1>
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
            Esta funcionalidade ainda está sendo desenvolvida. Em breve você poderá ver todos os seus livros reservados aqui.
          </p>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <BookOpen size={20} />
              <span>Visualizar livros reservados</span>
            </div>
            <div className={styles.featureItem}>
              <Clock size={20} />
              <span>Status das reservas</span>
            </div>
            <div className={styles.featureItem}>
              <BookOpen size={20} />
              <span>Histórico de empréstimos</span>
            </div>
          </div>

          <button onClick={handleBack} className={styles.backToProfileButton}>
            Voltar ao Perfil
          </button>
        </div>
      </main>

      <BottomNavigation studentId={studentId || ''} activePage="profile" />
    </div>
  );
};

export default MyBooks;
