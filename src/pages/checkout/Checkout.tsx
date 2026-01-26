import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createCheckoutSession } from '../../services/stripeService';
import { verifyPaymentSession } from '../../services/paymentService';
import { PLAN_MAPPING } from '../../config/stripeConfig';
import { ROUTES } from '../../constants';
import styles from './Checkout.module.css';
import { CheckIcon, ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/solid';

const PRICING_PLANS: Record<number, { name: string; price: string; features: string[] }> = {
  1: {
    name: 'Bibliotech Básico',
    price: 'R$ 94,90',
    features: [
      'Gerenciamento de biblioteca básico (acervo, cadastros e retiradas)',
      'Gerenciamento de turmas',
      'Botão de mensagem para WhatsApp',
      'Geração de etiquetas'
    ]
  },
  2: {
    name: 'Bibliotech Intermediário',
    price: 'R$ 157,90',
    features: [
      'Tudo do Bibliotech Básico',
      'Catálogo do leitor (com integração à API do Google)',
      'Estatísticas por turma',
      'Estatísticas da biblioteca',
      'Interface do aluno',
      'Estatísticas do aluno na interface do aluno',
      'Estatísticas de cada aluno'
    ]
  },
  3: {
    name: 'Bibliotech Avançado',
    price: 'R$ 219,99',
    features: [
      'Tudo do Bibliotech Intermediário',
      'Conquistas',
      'Reservas de livros',
      'Estatísticas da turma na interface do aluno',
      'Futuras funcionalidades de inteligência artificial'
    ]
  }
};

const Checkout: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const period = searchParams.get('period') || 'monthly';
  const isAnnual = period === 'annual';
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const planIdNum = planId ? parseInt(planId, 10) : null;
  const plan = planIdNum ? PRICING_PLANS[planIdNum] : null;

  // Funções para calcular preços anuais
  const formatPrice = (value: number): string => {
    const formattedValue = value.toFixed(2).replace('.', ',');
    const parts = formattedValue.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  };

  const parsePrice = (price: string): number => {
    const cleanPrice = price.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanPrice);
  };

  const calculateAnnualPrice = (monthlyPrice: string, discount: number = 0): string => {
    const monthlyValue = parsePrice(monthlyPrice);
    const annualValue = monthlyValue * 12;
    const discountedValue = annualValue * (1 - discount / 100);
    return formatPrice(discountedValue);
  };

  const getDiscount = (planId: number): number => {
    if (!isAnnual) return 0;
    
    switch (planId) {
      case 1: // Bibliotech Básico
        return 15;
      case 2: // Bibliotech Intermediário
        return 15;
      case 3: // Bibliotech Avançado
        return 20;
      default:
        return 0;
    }
  };

  const getDisplayPrice = (): { price: string; period: string } => {
    if (!plan || !planIdNum) {
      return { price: '', period: '' };
    }

    if (isAnnual) {
      const discount = getDiscount(planIdNum);
      return {
        price: calculateAnnualPrice(plan.price, discount),
        period: '/ano'
      };
    }
    return {
      price: plan.price,
      period: '/mês'
    };
  };

  useEffect(() => {
    // Se não estiver logado, redirecionar para login
    if (!currentUser) {
      navigate(ROUTES.LOGIN);
      return;
    }

    // Se veio com session_id, verificar pagamento
    if (sessionId) {
      verifyPayment();
    }
  }, [currentUser, sessionId, navigate]);

  const verifyPayment = async () => {
    if (!sessionId) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await verifyPaymentSession(sessionId);
      
      if (result.paid) {
        // Pagamento confirmado, aguardar webhook atualizar plano
        // Redirecionar para dashboard após um breve delay
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 2000);
      } else {
        setError('Pagamento ainda não foi processado. Aguarde alguns instantes.');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      setError('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser || !planIdNum) {
      setError('Dados inválidos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { url } = await createCheckoutSession(planIdNum, currentUser.uid, isAnnual);
      
      // Redirecionar para Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.PLANS);
  };

  if (!plan || !planIdNum) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Plano não encontrado</div>
        <button onClick={handleGoBack} className={styles.backButton}>
          Voltar para planos
        </button>
      </div>
    );
  }

  if (processing) {
    return (
      <div className={styles.container}>
        <div className={styles.processing}>
          <div className={styles.spinner}></div>
          <h2>Processando pagamento...</h2>
          <p>Aguarde enquanto confirmamos seu pagamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        className={styles.backButtonTop}
        onClick={handleGoBack}
        type="button"
        aria-label="Voltar"
      >
        <ArrowLeftIcon className={styles.backIcon} />
        <span>Voltar</span>
      </button>

      <div className={styles.checkoutCard}>
        <div className={styles.header}>
          <h1>Finalizar Assinatura</h1>
          <p>Revise os detalhes do seu plano antes de prosseguir</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.planSummary}>
          <div className={styles.planHeader}>
            <h2>{plan.name}</h2>
            <div>
              <div className={styles.planPrice}>
                <span className={styles.price}>{getDisplayPrice().price}</span>
                <span className={styles.period}>{getDisplayPrice().period}</span>
              </div>
              {isAnnual && getDiscount(planIdNum!) > 0 && (
                <div className={styles.savingsNote}>
                  Economize {getDiscount(planIdNum!)}% com o plano anual
                </div>
              )}
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
        </div>

        <div className={styles.paymentInfo}>
          <div className={styles.paymentIcon}>
            <CreditCardIcon />
          </div>
          <p className={styles.paymentText}>
            Você será redirecionado para uma página segura de pagamento do Stripe.
            Seus dados estão protegidos.
          </p>
        </div>

        <button
          className={styles.checkoutButton}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processando...' : 'Continuar para Pagamento'}
        </button>

        <p className={styles.securityNote}>
          🔒 Pagamento seguro processado pelo Stripe
        </p>
      </div>
    </div>
  );
};

export default Checkout;
