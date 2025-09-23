import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { settingsService } from '../../services/firebase';
import { LoginFormData } from '../../types/common';
import { ROUTES } from '../../constants';
import styles from './Login.module.css';
import { UserCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

// Configuração para habilitar/desabilitar login de convidado (para facilitar remoção)
const GUEST_LOGIN_ENABLED = true;
const GUEST_CREDENTIALS = {
  email: 'bibliotech.convidado@gmail.com',
  password: 'convidado123'
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [schoolName, setSchoolName] = useState('School Library System');
  
  const { login, currentUser } = useAuth();
  const { execute: executeLogin, isLoading, error } = useAsync<void>();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Carregar nome da escola
    const loadSchoolName = async () => {
      try {
        const name = await settingsService.getSchoolName();
        setSchoolName(name);
      } catch (error) {
        console.error('Erro ao carregar nome da escola:', error);
      }
    };
    
    loadSchoolName();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await executeLogin(() => login(formData.email, formData.password));
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      // Erro é gerenciado pelo hook useAsync
      console.error('Failed to log in:', error);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGuestLogin = async () => {
    try {
      await executeLogin(() => login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password));
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Erro no login de convidado:', error);
    }
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
      
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <UserCircleIcon style={{ width: 48, height: 48, color: 'white' }} />
        </div>
        <h2>
          {schoolName === 'School Library System' ? (
            <>
              Biblio<span style={{ color: '#4285f4' }}>tech</span>
            </>
          ) : (
            schoolName
          )}
        </h2>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className={styles.loginButton}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>


        {GUEST_LOGIN_ENABLED && (
          <div className={styles.guestLogin}>
            <div className={styles.divider}>
              <span>ou</span>
            </div>
            <button 
              type="button" 
              disabled={isLoading} 
              className={styles.guestLoginButton}
              onClick={handleGuestLogin}
            >
              {isLoading ? 'Entrando...' : 'Login de Convidado'}
            </button>
            <p className={styles.guestLoginText}>
              Acesso rápido para demonstração
            </p>
          </div>
        )}
        
        <div className={styles.links}>
          <Link to="/forgot-password">Esqueceu a senha?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 