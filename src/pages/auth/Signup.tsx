import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { settingsService } from '../../services/firebase';
import { ROUTES } from '../../constants';
import styles from './Signup.module.css';
import { UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [schoolName, setSchoolName] = useState('School Library System');
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  
  const { signup, signInWithGoogle, currentUser } = useAuth();
  const { execute: executeSignup, isLoading: isSignupLoading, error: signupError } = useAsync<void>();
  const { execute: executeGoogleSignup, isLoading: isGoogleLoading, error: googleError } = useAsync<void>();
  const navigate = useNavigate();

  const isLoading = isSignupLoading || isGoogleLoading;
  const error = signupError || googleError;

  useEffect(() => {
    if (currentUser) {
      // Após criar conta, redirecionar baseado no plano
      if (planId) {
        navigate(`/checkout/${planId}`);
      } else {
        navigate(ROUTES.PLANS);
      }
    }
  }, [currentUser, navigate, planId]);

  useEffect(() => {
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

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      return 'Por favor, preencha todos os campos';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'As senhas não coincidem';
    }

    if (formData.password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Por favor, insira um email válido';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      return;
    }
    
    try {
      await executeSignup(() => signup(formData.email, formData.password));
      // Redirecionamento será feito pelo useEffect quando currentUser mudar
    } catch (error) {
      console.error('Failed to sign up:', error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await executeGoogleSignup(() => signInWithGoogle());
      // Redirecionamento será feito pelo useEffect quando currentUser mudar
    } catch (error) {
      console.error('Failed to sign up with Google:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/select-user-type');
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
      
      <div className={styles.signupCard}>
        <div className={styles.logo}>
          <UserPlusIcon style={{ width: 48, height: 48, color: 'white' }} />
        </div>
        <h2>
          {schoolName === 'School Library System' ? (
            <>
              Criar conta no Biblio<span style={{ color: '#4285f4' }}>tech</span>
            </>
          ) : (
            `Criar conta na ${schoolName}`
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
              placeholder="seu@email.com"
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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Digite a senha novamente"
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className={styles.signupButton}
          >
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button 
          type="button" 
          disabled={isLoading} 
          className={styles.googleButton}
          onClick={handleGoogleSignup}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>
        
        <div className={styles.links}>
          <Link to={ROUTES.LOGIN}>Já tenho conta</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
