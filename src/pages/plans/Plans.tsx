import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { ROUTES } from '../../constants';
import styles from './Plans.module.css';
import { CheckIcon } from '@heroicons/react/24/solid';

interface PricingPlan {
  id: number;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 1,
    name: 'Bibliotech Básico',
    price: 'R$ 94,90',
    period: '/mês',
    features: [
      'Gerenciamento de biblioteca básico (acervo, cadastros e retiradas)',
      'Gerenciamento de turmas',
      'Botão de mensagem para WhatsApp',
      'Geração de etiquetas'
    ]
  },
  {
    id: 2,
    name: 'Bibliotech Intermediário',
    price: 'R$ 157,90',
    period: '/mês',
    features: [
      'Tudo do Bibliotech Básico',
      'Catálogo do leitor (com integração à API do Google)',
      'Estatísticas por turma',
      'Estatísticas da biblioteca',
      'Interface do aluno',
      'Estatísticas do aluno na interface do aluno',
      'Estatísticas de cada aluno'
    ],
    highlighted: true,
    badge: 'Mais Popular'
  },
  {
    id: 3,
    name: 'Bibliotech Avançado',
    price: 'R$ 219,99',
    period: '/mês',
    features: [
      'Tudo do Bibliotech Intermediário',
      'Conquistas',
      'Reservas de livros',
      'Estatísticas da turma na interface do aluno',
      'Futuras funcionalidades de inteligência artificial'
    ]
  }
];

const Plans: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    const checkUserPlan = async () => {
      // Se não estiver logado, redirecionar para login
      if (!currentUser) {
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        // Verificar se já tem plano
        const planInfo = await subscriptionService.getSubscriptionPlan(currentUser.uid);
        
        if (planInfo.numericPlan) {
          // Já tem plano, redirecionar para dashboard
          setHasPlan(true);
          navigate(ROUTES.DASHBOARD);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar plano:', error);
        setLoading(false);
      }
    };

    checkUserPlan();
  }, [currentUser, navigate]);

  const handleSelectPlan = (planId: number) => {
    navigate(`/checkout/${planId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading || hasPlan) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.logoutButton} onClick={handleLogout}>
        Sair
      </button>
      
      <div className={styles.header}>
        <h1>Escolha seu Plano</h1>
        <p>Selecione o plano ideal para sua escola</p>
      </div>

      <div className={styles.plansGrid}>
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${plan.highlighted ? styles.highlighted : ''}`}
          >
            {plan.badge && (
              <div className={styles.badge}>{plan.badge}</div>
            )}
            
            <div className={styles.planHeader}>
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.planPrice}>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.period}>{plan.period}</span>
              </div>
            </div>

            <ul className={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  <CheckIcon className={styles.checkIcon} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`${styles.selectButton} ${plan.highlighted ? styles.highlightedButton : ''}`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              Escolher Plano
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;
