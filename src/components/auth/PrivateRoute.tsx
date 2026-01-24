import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { ROUTES } from '../../constants';

const PrivateRoute: React.FC = () => {
  const { currentUser, authState } = useAuth();
  const location = useLocation();
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  // Rotas públicas que não precisam de plano
  const publicRoutesWithoutPlan = ['/signup', '/plans', '/checkout'];

  useEffect(() => {
    const checkPlan = async () => {
      if (!currentUser) {
        setCheckingPlan(false);
        return;
      }

      // Verificar se é conta de desenvolvedor (não precisa de plano)
      if (currentUser.email === 'dev@bibliotech.tech') {
        setHasPlan(true);
        setCheckingPlan(false);
        return;
      }

      // Verificar se a rota atual é pública e não precisa de plano
      if (publicRoutesWithoutPlan.some(route => location.pathname.startsWith(route))) {
        setHasPlan(true);
        setCheckingPlan(false);
        return;
      }

      try {
        const planInfo = await subscriptionService.getSubscriptionPlan(currentUser.uid);
        setHasPlan(!!planInfo.numericPlan);
      } catch (error) {
        console.error('Erro ao verificar plano:', error);
        setHasPlan(false);
      } finally {
        setCheckingPlan(false);
      }
    };

    checkPlan();
  }, [currentUser, location.pathname]);

  if (authState.status === 'loading' || checkingPlan) {
    return null; // não renderiza nada enquanto carrega
  }

  // se não tiver logado, vai pro login
  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // se não tiver plano e não estiver em rota pública, redirecionar para plans
  if (!hasPlan && !publicRoutesWithoutPlan.some(route => location.pathname.startsWith(route))) {
    return <Navigate to={ROUTES.PLANS} replace />;
  }

  // se tiver logado e plano (ou rota pública), mostra as rotas protegidas
  return <Outlet />;
};

export default PrivateRoute; 