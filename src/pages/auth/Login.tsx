import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { settingsService } from '../../services/firebase';
import { subscriptionService } from '../../services/subscriptionService';
import { LoginFormData } from '../../types/common';
import { ROUTES } from '../../constants';
import styles from './Login.module.css';
import { UserCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

// Configuração do login de convidado via variáveis de ambiente
// As credenciais são definidas em .env.local (não versionado)
const GUEST_LOGIN_ENABLED = process.env.REACT_APP_GUEST_LOGIN_ENABLED === 'true';
const GUEST_CREDENTIALS = {
  email: process.env.REACT_APP_GUEST_EMAIL || '',
  password: process.env.REACT_APP_GUEST_PASSWORD || ''
};

// Validação: se login de convidado está habilitado, as credenciais devem estar configuradas
const isGuestLoginConfigured = GUEST_LOGIN_ENABLED && 
  GUEST_CREDENTIALS.email && 
  GUEST_CREDENTIALS.password;

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [schoolName, setSchoolName] = useState('School Library System');
  
  const { login, currentUser, signInWithGoogle } = useAuth();
  const { execute: executeLogin, isLoading, error } = useAsync<void>();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserPlan = async () => {
      if (!currentUser) return;

      // Verificar se é conta de desenvolvedor
      if (currentUser.email === 'dev@bibliotech.tech') {
        navigate('/dev');
        return;
      }

      // Verificar se tem plano
      try {
        const planInfo = await subscriptionService.getSubscriptionPlan(currentUser.uid);
        
        if (!planInfo.numericPlan) {
          // Não tem plano, redirecionar para escolher
          navigate(ROUTES.PLANS);
        } else {
          // Tem plano, ir para dashboard
          navigate(ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error('Erro ao verificar plano:', error);
        // Em caso de erro, redirecionar para plans para ser seguro
        navigate(ROUTES.PLANS);
      }
    };

    checkUserPlan();
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
      // Redirecionamento será feito pelo useEffect quando currentUser mudar
    } catch (error) {
      // Erro é gerenciado pelo hook useAsync
      console.error('Failed to log in:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/select-user-type');
  };

  const handleGuestLogin = async () => {
    if (!isGuestLoginConfigured) {
      console.error('Login de convidado não configurado. Verifique as variáveis de ambiente.');
      return;
    }
    
    try {
      await executeLogin(() => login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password));
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Erro no login de convidado:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await executeLogin(() => signInWithGoogle());
      // Redirecionamento será feito pelo useEffect quando currentUser mudar
    } catch (error) {
      console.error('Erro no login com Google:', error);
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

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button 
          type="button" 
          disabled={isLoading} 
          className={styles.googleButton}
          onClick={handleGoogleLogin}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{isLoading ? 'Entrando...' : 'Continuar com Google'}</span>
        </button>

        {isGuestLoginConfigured && (
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
          <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
          <Link to={ROUTES.SIGNUP}>Ainda não tenho conta</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 