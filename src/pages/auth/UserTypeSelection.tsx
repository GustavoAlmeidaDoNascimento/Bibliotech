import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, UserGroupIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { ROUTES } from '../../constants';
import styles from './UserTypeSelection.module.css';

const UserTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStudentSelection = () => {
    navigate('/student-id-input');
  };

  const handleManagerSelection = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5551997188572?text=Olá! Gostaria de participar do beta do Bibliotech!', '_blank');
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
      
      <div className={styles.selectionCard}>
        <div className={styles.logo}>
          <UserGroupIcon style={{ width: 64, height: 64, color: 'white' }} />
        </div>
        
        <h1 className={styles.title}>
          Biblio<span style={{ color: '#0078d4' }}>tech</span>
        </h1>
        
        <p className={styles.subtitle}>
          Como você deseja acessar o sistema?
        </p>

        <div className={styles.optionsContainer}>
          <button 
            type="button" 
            className={styles.optionButton}
            onClick={handleStudentSelection}
          >
            <div className={styles.optionIcon}>
              <AcademicCapIcon />
            </div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>Sou Aluno</h3>
              <p className={styles.optionDescription}>
                Acesse sua área estudantil com seu ID de estudante
              </p>
            </div>
          </button>

          <button 
            type="button" 
            className={styles.optionButton}
            onClick={handleManagerSelection}
          >
            <div className={styles.optionIcon}>
              <UserGroupIcon />
            </div>
            <div className={styles.optionContent}>
              <h3 className={styles.optionTitle}>Sou Gestor</h3>
              <p className={styles.optionDescription}>
                Faça login com suas credenciais de administrador
              </p>
            </div>
          </button>
        </div>

        <div className={styles.betaSection}>
          <div className={styles.divider}>
            <span>ou</span>
          </div>
          
          <p className={styles.betaQuestion}>
            Quer participar do Biblio<span style={{ color: '#0078d4' }}>tech</span> beta?
          </p>
          
          <button 
            className={styles.whatsappButton}
            onClick={handleWhatsAppClick}
            type="button"
          >
            <span>Fale conosco</span>
            <img src="/images/home/icone/wpp.png" alt="WhatsApp" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;
