import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { ROUTES } from '../../constants';

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

const Container = styled.div`
  min-height: 100vh;
  background: #0a0e1a;
  color: white;
  padding: 60px 20px;
  position: relative;

  @media (max-width: 768px) {
    padding: 40px 16px;
  }
`;

const LogoutButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    padding: 8px 16px;
    font-size: 0.85rem;
  }
`;

const PricingSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
  color: white;

  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const PricingToggleContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 60px;
  gap: 16px;

  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
  position: relative;
`;

const ToggleOption = styled.button<{ $active: boolean }>`
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: ${(props) => (props.$active ? '#0078d4' : 'transparent')};
  color: ${(props) => (props.$active ? 'white' : '#94a3b8')};
  font-size: 0.95rem;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(0, 120, 212, 0.3)' : 'none')};

  &:hover {
    color: ${(props) => (props.$active ? 'white' : 'white')};
    background: ${(props) => (props.$active ? '#0078d4' : 'rgba(0, 120, 212, 0.1)')};
  }

  @media (max-width: 768px) {
    padding: 8px 20px;
    font-size: 0.9rem;
  }
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

interface PricingCardProps {
  $highlighted?: boolean;
}

const PricingCard = styled(motion.div)<PricingCardProps>`
  position: relative;
  background: ${(props) =>
    props.$highlighted
      ? 'linear-gradient(160deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 59, 116, 0.95) 100%)'
      : 'rgba(17, 24, 39, 0.85)'};
  border: 1px solid
    ${(props) => (props.$highlighted ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.2)')};
  border-radius: 20px;
  padding: 48px 32px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: ${(props) =>
    props.$highlighted
      ? '0 20px 40px rgba(59, 130, 246, 0.35)'
      : '0 12px 30px rgba(15, 23, 42, 0.35)'};
  min-height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${(props) =>
      props.$highlighted
        ? '0 24px 48px rgba(59, 130, 246, 0.45)'
        : '0 16px 36px rgba(15, 23, 42, 0.45)'};
  }

  @media (max-width: 768px) {
    padding: 40px 28px 32px;
  }
`;

const PricingBadge = styled.span`
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 10px 30px rgba(37, 99, 235, 0.45);
`;

interface DiscountRibbonProps {
  $discount: number;
}

const DiscountRibbon = styled.div<DiscountRibbonProps>`
  position: absolute;
  top: 0;
  right: 0px;
  width: 120px;
  height: 120px;
  overflow: hidden;
  z-index: 10;
  
  &::before {
    content: '${(props) => props.$discount}% OFF';
    position: absolute;
    top: 25px;
    right: -38px;
    width: 160px;
    height: 32px;
    background: #0078d4;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: center;
    line-height: 32px;
    transform: rotate(45deg);
    box-shadow: 0 4px 8px rgba(0, 120, 212, 0.4);
    letter-spacing: 0.5px;
  }
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    
    &::before {
      top: 16px;
      right: -28px;
      width: 140px;
      height: 28px;
      font-size: 0.7rem;
      line-height: 28px;
    }
  }
`;

const SavingsText = styled.div`
  font-size: 0.9rem;
  color: #60a5fa;
  font-weight: 600;
  text-align: left;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const PricingHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
`;

const PricingTitle = styled.h3`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
  font-size: clamp(1.35rem, 2.4vw, 1.6rem);
  font-weight: 700;
  color: white;
  margin: 0;

  @media (max-width: 640px) {
    flex-wrap: wrap;
    white-space: normal;
    row-gap: 6px;
  }
`;

const TechAccent = styled.span`
  color: #3b82f6;
`;

const PlanNameBrand = styled.span`
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
`;

type PlanBadgeVariant = 'basico' | 'intermediario' | 'avancado';

const PlanBadge = styled.span<{ $variant: PlanBadgeVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 12px;
  margin: 0;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.92em;
  line-height: 1.2;
  white-space: nowrap;
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'intermediario':
        return '#0f172a';
      case 'avancado':
        return '#1f2937';
      default:
        return '#ffffff';
    }
  }};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'intermediario':
        return 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)';
      case 'avancado':
        return 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)';
      default:
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
  }};
  box-shadow: ${({ $variant }) => {
    switch ($variant) {
      case 'intermediario':
        return '0 10px 24px rgba(148, 163, 184, 0.25)';
      case 'avancado':
        return '0 10px 24px rgba(245, 158, 11, 0.35)';
      default:
        return '0 10px 24px rgba(59, 130, 246, 0.35)';
    }
  }};
  border: 1px solid
    ${({ $variant }) => {
      switch ($variant) {
        case 'intermediario':
          return 'rgba(148, 163, 184, 0.65)';
        case 'avancado':
          return 'rgba(245, 158, 11, 0.65)';
        default:
          return 'rgba(59, 130, 246, 0.65)';
      }
    }};
`;

interface PricingPriceProps {
  $highlighted?: boolean;
  $isAnnual?: boolean;
}

const PricingPrice = styled.div<PricingPriceProps>`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: ${(props) => 
    props.$isAnnual 
      ? 'clamp(1.6rem, 3vw, 2.2rem)' 
      : 'clamp(2.2rem, 4vw, 2.8rem)'};
  font-weight: 700;
  color: ${(props) => (props.$highlighted ? '#93c5fd' : '#60a5fa')};
  margin: 0;

  strong {
    font-weight: inherit;
    color: inherit;
  }
`;

const PricingPeriod = styled.span`
  font-size: 1rem;
  color: #94a3b8;
`;

const PricingFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-grow: 1;
`;

interface PricingFeatureProps {
  $highlighted?: boolean;
}

const PricingFeature = styled.li<PricingFeatureProps>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: ${(props) => (props.$highlighted ? '#e2e8f0' : '#cbd5e1')};
  font-size: 0.98rem;
  line-height: 1.5;
`;

interface CheckIconProps {
  $highlighted?: boolean;
}

const CheckIcon = styled.span<CheckIconProps>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(props) =>
    props.$highlighted ? 'rgba(96, 165, 250, 0.25)' : 'rgba(59, 130, 246, 0.18)'};
  color: ${(props) => (props.$highlighted ? '#bfdbfe' : '#60a5fa')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 12px;
    height: 12px;
    stroke-width: 3;
  }
`;

const PricingFeatureText = styled.span`
  flex: 1;
`;

interface PricingButtonProps {
  $highlighted?: boolean;
}

const PricingButton = styled(motion.button)<PricingButtonProps>`
  margin-top: 24px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid
    ${(props) => (props.$highlighted ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.4)')};
  background: ${(props) =>
    props.$highlighted
      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      : 'rgba(15, 23, 42, 0.9)'};
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    background: ${(props) =>
      props.$highlighted
        ? 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)'
        : 'rgba(30, 64, 175, 0.85)'};
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  font-size: 1.2rem;
`;

const Plans: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const checkUserPlan = async () => {
      if (!currentUser) {
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        const planInfo = await subscriptionService.getSubscriptionPlan(currentUser.uid);
        
        if (planInfo.numericPlan) {
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

  const normalizeWord = (word: string) =>
    word
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

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

  const getDiscount = (plan: PricingPlan): number => {
    if (!isAnnual) return 0;
    
    switch (plan.name) {
      case 'Bibliotech Básico':
        return 15;
      case 'Bibliotech Intermediário':
        return 15;
      case 'Bibliotech Avançado':
        return 20;
      default:
        return 0;
    }
  };

  const getDisplayPrice = (plan: PricingPlan): { price: string; period: string } => {
    if (isAnnual) {
      const discount = getDiscount(plan);
      return {
        price: calculateAnnualPrice(plan.price, discount),
        period: '/ano'
      };
    }
    return {
      price: plan.price,
      period: plan.period
    };
  };

  const getSavings = (plan: PricingPlan): { savings: string; originalPrice: string; discount: number } | null => {
    if (!isAnnual) return null;
    
    const discount = getDiscount(plan);
    if (discount === 0) return null;
    
    const monthlyValue = parsePrice(plan.price);
    const annualValue = monthlyValue * 12;
    const savings = annualValue * (discount / 100);
    const originalPrice = formatPrice(annualValue);
    
    return {
      savings: formatPrice(savings),
      originalPrice,
      discount
    };
  };

  const renderBrandName = (text: string) => {
    const techIndex = text.toLowerCase().indexOf('tech');
    if (techIndex === -1) return text;
    
    const before = text.slice(0, techIndex);
    const tech = text.slice(techIndex, techIndex + 4);
    const after = text.slice(techIndex + 4);

    return (
      <>
        {before}
        <TechAccent>{tech}</TechAccent>
        {after}
      </>
    );
  };

  const renderPlanName = (name: string) => {
    const [brand, ...rest] = name.split(' ');
    const level = rest.join(' ').trim();
    const normalizedLevel = normalizeWord(level);

    let badgeVariant: PlanBadgeVariant | undefined;
    switch (normalizedLevel) {
      case 'basico':
        badgeVariant = 'basico';
        break;
      case 'intermediario':
        badgeVariant = 'intermediario';
        break;
      case 'avancado':
        badgeVariant = 'avancado';
        break;
    }

    return (
      <>
        <PlanNameBrand>{renderBrandName(brand)}</PlanNameBrand>
        {badgeVariant && level && (
          <PlanBadge $variant={badgeVariant}>{level}</PlanBadge>
        )}
      </>
    );
  };

  if (loading || hasPlan) {
    return (
      <Container>
        <LoadingContainer>Carregando...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <LogoutButton onClick={handleLogout}>
        Sair
      </LogoutButton>
      
      <PricingSection>
        <SectionTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Escolha seu plano
        </SectionTitle>
        
        <PricingToggleContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ToggleWrapper>
            <ToggleOption
              $active={!isAnnual}
              onClick={() => setIsAnnual(false)}
            >
              Mensal
            </ToggleOption>
            <ToggleOption
              $active={isAnnual}
              onClick={() => setIsAnnual(true)}
            >
              Anual
            </ToggleOption>
          </ToggleWrapper>
        </PricingToggleContainer>

        <PricingGrid>
          {PRICING_PLANS.map((plan, index) => (
            <PricingCard
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              $highlighted={plan.highlighted}
            >
              {plan.badge && <PricingBadge>{plan.badge}</PricingBadge>}
              {isAnnual && getDiscount(plan) > 0 && (
                <DiscountRibbon $discount={getDiscount(plan)} />
              )}
              <PricingHeader>
                <PricingTitle>{renderPlanName(plan.name)}</PricingTitle>
                <PricingPrice $highlighted={plan.highlighted} $isAnnual={isAnnual}>
                  <strong>{getDisplayPrice(plan).price}</strong>
                  <PricingPeriod>{getDisplayPrice(plan).period}</PricingPeriod>
                </PricingPrice>
                {getSavings(plan) && (
                  <SavingsText>
                    Economize {getSavings(plan)!.savings}/ano
                  </SavingsText>
                )}
              </PricingHeader>

              <PricingFeatures>
                {plan.features.map((feature) => (
                  <PricingFeature key={feature} $highlighted={plan.highlighted}>
                    <CheckIcon $highlighted={plan.highlighted}>
                      <svg
                        viewBox="0 0 12 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1 5.5 4.5 9 11 1"></polyline>
                      </svg>
                    </CheckIcon>
                    <PricingFeatureText>{feature}</PricingFeatureText>
                  </PricingFeature>
                ))}
              </PricingFeatures>

              <PricingButton
                onClick={() => handleSelectPlan(plan.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                $highlighted={plan.highlighted}
              >
                Começar agora
              </PricingButton>
            </PricingCard>
          ))}
        </PricingGrid>
      </PricingSection>
    </Container>
  );
};

export default Plans;
