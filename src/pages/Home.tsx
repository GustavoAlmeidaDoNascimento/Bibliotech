import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import Header from '../components/layout/Header';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import AnimatedStatsGrid from '../components/home/AnimatedStatsGrid';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0a0e1a;
  color: white;
  padding-bottom: 20px;
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 20px 60px;
  background: linear-gradient(180deg, #0a0e1a 0%, #0f1420 100%);
  position: relative;
  
  @media (max-width: 768px) {
    padding: 80px 16px 40px;
    min-height: auto;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  width: 100%;
    text-align: center;
`;

const Title = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  
  span {
    color: #0078d4;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 16px;
  }
`;

const Tagline = styled(motion.div)`
  font-size: clamp(1rem, 2vw, 1.25rem);
  margin-bottom: 32px;
  color: #94a3b8;
  
  p {
    margin: 8px 0;
    
    strong {
      color: #0078d4;
      font-weight: 600;
    }
    
    em {
      font-style: italic;
      color: #cbd5e1;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 24px;
  }
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 16px;
    justify-content: center;
  margin-bottom: 60px;
    flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px;
  }
`;

const PrimaryButton = styled(motion.button)`
  padding: 14px 32px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #106ebe;
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }
`;

const SecondaryButton = styled(motion.button)`
  padding: 14px 32px;
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }
`;

const DemoButton = styled(motion.button)`
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #0078d4 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  
  &:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 50%, #005fa3 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
  }
`;


const Section = styled.section`
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const SectionDescription = styled(motion.p)`
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: #94a3b8;
  text-align: center;
  max-width: 700px;
  margin: 0 auto 60px;
  line-height: 1.6;

  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const PricingSection = styled.div`
  margin: 80px 0 60px;
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

const PricingHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
`;

const PricingTitle = styled.h3`
  font-size: clamp(1.35rem, 2.4vw, 1.6rem);
  font-weight: 700;
  color: white;
  margin: 0;
`;

const TechAccent = styled.span`
  color: #3b82f6;
`;

interface PricingPriceProps {
  $highlighted?: boolean;
}

const PricingPrice = styled.div<PricingPriceProps>`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: clamp(2.2rem, 4vw, 2.8rem);
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

const FeaturesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 60px;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    gap: 40px;
    margin-bottom: 40px;
  }
`;

const FeatureItem = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  
  /* Alternar ordem nos itens pares */
  &:nth-child(even) {
    direction: rtl;
    
    > * {
      direction: ltr;
    }
  }
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 24px;
    
    &:nth-child(even) {
      direction: ltr;
    }
  }
`;

const FeatureContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
`;

const FeatureIconWrapper = styled.div`
  width: 56px;
  height: 56px;
  background: rgba(0, 120, 212, 0.1);
  border: 1px solid rgba(0, 120, 212, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 28px;
    height: 28px;
    color: #0078d4;
  }
  
  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const FeatureTitle = styled.h3`
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  font-weight: 700;
  color: white;
  margin: 0;
`;

const FeatureDescription = styled.p`
  font-size: clamp(0.95rem, 1.5vw, 1.05rem);
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
`;

const FeatureScreenshotPlaceholder = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  aspect-ratio: 16/10;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 12px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
  }
  
  @media (max-width: 768px) {
    aspect-ratio: 16/12;
    padding: 8px;
  }
`;

const CTASection = styled(motion.div)`
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 120, 212, 0.05);
  border: 1px solid rgba(0, 120, 212, 0.1);
  border-radius: 16px;
  
  h3 {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
  }
  
  p {
    font-size: clamp(0.95rem, 1.5vw, 1.05rem);
    color: #94a3b8;
    margin-bottom: 24px;
  }
  
  @media (max-width: 768px) {
    padding: 32px 20px;
  }
`;

const ImageModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  cursor: pointer;
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  cursor: default;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const ContactSection = styled(Section)`
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  margin: 80px auto 80px;
  padding: 80px 60px 100px;

  @media (max-width: 768px) {
    margin: 60px 16px 60px;
    padding: 60px 20px 80px;
  }
`;

const ContactForm = styled(motion.form)`
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;

  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const FormLabel = styled.label`
  display: block;
  color: #0078d4;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.95rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0078d4;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0078d4;
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: #0f1420;
    color: white;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0078d4;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(37, 211, 102, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Footer = styled.footer`
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 60px 60px 60px;
  margin-top: 0;
  margin-bottom: 0;
  
  @media (max-width: 768px) {
    padding: 40px 20px 40px;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 60px;
  margin-bottom: 40px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FooterLogo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  
  span {
    color: #0078d4;
  }
`;

const FooterDescription = styled.p`
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const FooterTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

const FooterLink = styled.a`
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #0078d4;
    transform: translateX(4px);
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
`;

const Copyright = styled.p`
  color: #64748b;
  font-size: 0.9rem;
`;

const ProtonCredit = styled.div`
  color: #64748b;
  font-size: 0.9rem;
  
  a {
    color: #0078d4;
    text-decoration: none;
    transition: all 0.3s ease;
    
    &:hover {
      color: #106ebe;
      text-decoration: underline;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 120, 212, 0.1);
    border-color: #0078d4;
    color: #0078d4;
    transform: translateY(-2px);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

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

interface ContactFormData {
  nome: string;
  interesse: string;
  mensagem: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Bibliotech Basicão',
    price: 'R$ 192,90',
    period: '/mês',
    features: [
      'Gerenciamento de biblioteca básico (acervo, cadastros e retiradas)',
      'Gerenciamento de turmas',
      'Botão de mensagem para WhatsApp',
      'Geração de etiquetas'
    ]
  },
  {
    name: 'Bibliotech Smart',
    price: 'R$ 246,90',
    period: '/mês',
    features: [
      'Tudo do Bibliotech Basicão',
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
    name: 'Bibliotech +',
    price: 'R$ 337,90',
    period: '/mês',
    features: [
      'Tudo do Bibliotech Smart',
      'Conquistas',
      'Reservas de livros',
      'Estatísticas da turma na interface do aluno',
      'Futuras funcionalidades de inteligência artificial'
    ]
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { execute: executeGuestLogin, isLoading: isGuestLoading } = useAsync<void>();
  const { execute: executeDemoLogin, isLoading: isDemoLoading } = useAsync<void>();
  const [contactForm, setContactForm] = useState<ContactFormData>({
    nome: '',
    interesse: '',
    mensagem: ''
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderPlanName = (name: string) => {
    const techIndex = name.toLowerCase().indexOf('tech');
    if (techIndex === -1) {
      return name;
    }

    const before = name.slice(0, techIndex);
    const tech = name.slice(techIndex, techIndex + 4);
    const after = name.slice(techIndex + 4);

    return (
      <>
        {before}
        <TechAccent>{tech}</TechAccent>
        {after}
      </>
    );
  };

  const handleGuestLogin = async () => {
    if (!isGuestLoginConfigured) {
      console.error('Login de convidado não configurado. Verifique as variáveis de ambiente.');
      return;
    }
    
    try {
      await executeGuestLogin(() => login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password));
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login de convidado:', error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await executeDemoLogin(() => login('bibliotech.convidado@gmail.com', 'convidado123'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login de demonstração:', error);
    }
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.nome || !contactForm.interesse || !contactForm.mensagem) {
      return;
    }

    const message = `Olá! Meu nome é ${contactForm.nome}.
    
Interesse: ${contactForm.interesse}

Mensagem: ${contactForm.mensagem}

Aguardo retorno. Obrigado!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5551996468758?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <Header />
      <PageContainer>
        {/* Hero Section */}
        <HeroSection id="inicio">
          <HeroContent>
            <Title
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Sistema completo para<br />
              <span>bibliotecas escolares</span>
            </Title>
            
            <Tagline
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p><strong>Desenvolvido</strong> por <em>alunos</em></p>
              <p><strong>Validado</strong> por <em>escolas</em></p>
              <p><strong>Criado</strong> pro <em>futuro</em></p>
            </Tagline>
            
            <CTAButtons
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {isGuestLoginConfigured && (
                <PrimaryButton
                  onClick={handleGuestLogin}
                  disabled={isGuestLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isGuestLoading ? 'Entrando...' : 'Começar Agora'}
                </PrimaryButton>
              )}
              <SecondaryButton
                onClick={() => scrollToSection('produto')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Conhecer o Sistema
              </SecondaryButton>
            </CTAButtons>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}
            >
              <DemoButton
                onClick={handleDemoLogin}
                disabled={isDemoLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDemoLoading ? 'Entrando...' : (
                  <>
                    Acessar conta de demonstração (IFSul) 🚀
                  </>
                )}
              </DemoButton>
            </motion.div>
            
            <AnimatedStatsGrid />
          </HeroContent>
        </HeroSection>

        {/* Product Section */}
        <Section id="produto">
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Sobre o sistema
          </SectionTitle>
          
          <SectionDescription
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Uma solução completa que revoluciona a gestão de bibliotecas escolares, 
            criando uma experiência moderna e engajante para todos os usuários.
          </SectionDescription>
          
          <FeaturesContainer>
            {/* Feature 1 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Plataforma de Gestão de Acervo</FeatureTitle>
                <FeatureDescription>
                  Sistema completo para catalogar, organizar e controlar todo o acervo da biblioteca em tempo real.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/acervo.png" 
                  alt="Plataforma de Gestão de Acervo" 
                  onClick={() => openImageModal("/images/home/about/acervo.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>

            {/* Feature 2 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Interface de Recomendação para Alunos</FeatureTitle>
                <FeatureDescription>
                  App intuitivo onde os alunos descobrem novos livros com recomendações personalizadas baseadas em seus interesses.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/alunos.png" 
                  alt="Interface de Recomendação para Alunos" 
                  onClick={() => openImageModal("/images/home/about/alunos.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>

            {/* Feature 3 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Dashboard de Métricas e Relatórios</FeatureTitle>
                <FeatureDescription>
                  Análises detalhadas sobre empréstimos, leituras mais populares e evolução da leitura na escola.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/dashboard.png" 
                  alt="Dashboard de Métricas e Relatórios" 
                  onClick={() => openImageModal("/images/home/about/dashboard.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>

            {/* Feature 4 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Comunicação Integrada via WhatsApp</FeatureTitle>
                <FeatureDescription>
                  Notificações automáticas sobre prazos, novas aquisições e lembretes de devolução direto no WhatsApp.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/whatsapp.png" 
                  alt="Comunicação Integrada via WhatsApp" 
                  onClick={() => openImageModal("/images/home/about/whatsapp.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>

            {/* Feature 5 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Sistema de Gamificação</FeatureTitle>
                <FeatureDescription>
                  Pontuação, conquistas e rankings para motivar os alunos a lerem mais e se engajarem com a biblioteca.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/gameficação.png" 
                  alt="Sistema de Gamificação" 
                  onClick={() => openImageModal("/images/home/about/gameficação.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>

            {/* Feature 6 */}
            <FeatureItem
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <FeatureContent>
                <FeatureIconWrapper>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </FeatureIconWrapper>
                <FeatureTitle>Controle de Empréstimos Automatizado</FeatureTitle>
                <FeatureDescription>
                  Gestão automática de empréstimos e devoluções com histórico completo e controle de disponibilidade.
                </FeatureDescription>
              </FeatureContent>
              <FeatureScreenshotPlaceholder>
                <img 
                  src="/images/home/about/emprestimos.png" 
                  alt="Controle de Empréstimos Automatizado" 
                  onClick={() => openImageModal("/images/home/about/emprestimos.png")}
                  style={{ cursor: 'pointer' }}
                />
              </FeatureScreenshotPlaceholder>
            </FeatureItem>
          </FeaturesContainer>

        <PricingSection>
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Escolha seu plano
          </SectionTitle>
          <SectionDescription
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Selecione o plano ideal para sua biblioteca
          </SectionDescription>

          <PricingGrid>
            {PRICING_PLANS.map((plan, index) => (
              <PricingCard
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                $highlighted={plan.highlighted}
              >
                {plan.badge && <PricingBadge>{plan.badge}</PricingBadge>}
                <PricingHeader>
                  <PricingTitle>{renderPlanName(plan.name)}</PricingTitle>
                  <PricingPrice $highlighted={plan.highlighted}>
                    <strong>{plan.price}</strong>
                    <PricingPeriod>{plan.period}</PricingPeriod>
                  </PricingPrice>
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
                  onClick={() => scrollToSection('contato')}
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

          <CTASection
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3>Pronto para transformar sua biblioteca?</h3>
            <p>Junte-se às escolas que já estão revolucionando a gestão de suas bibliotecas.</p>
            <SecondaryButton
              onClick={() => scrollToSection('contato')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              solicitar reunião
            </SecondaryButton>
          </CTASection>
        </Section>

        {/* Contact Section */}
        <ContactSection id="contato">
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
            Entre em contato
          </SectionTitle>
          
          <SectionDescription
            initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Pronto para revolucionar a biblioteca da sua escola? Vamos conversar sobre como podemos ajudar!
          </SectionDescription>
          
            <ContactForm
            initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
              onSubmit={handleWhatsAppSubmit}
            >
              <FormGroup>
                <FormLabel>Nome</FormLabel>
                <FormInput
                  type="text"
                  value={contactForm.nome}
                  onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                  placeholder="Digite seu nome"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Interesse</FormLabel>
                <FormSelect
                  value={contactForm.interesse}
                  onChange={(e) => setContactForm({ ...contactForm, interesse: e.target.value })}
                  required
                >
                  <option value="">Selecione um interesse</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Conhecer mais">Conhecer mais sobre o sistema</option>
                  <option value="Demonstração">Solicitar demonstração</option>
                  <option value="Parceria">Oportunidades de parceria</option>
                  <option value="Outros">Outros assuntos</option>
                </FormSelect>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Mensagem</FormLabel>
                <FormTextarea
                  value={contactForm.mensagem}
                  onChange={(e) => setContactForm({ ...contactForm, mensagem: e.target.value })}
                  placeholder="Digite sua mensagem"
                  required
                />
              </FormGroup>
              
            <SubmitButton
                type="submit"
                disabled={!contactForm.nome || !contactForm.interesse || !contactForm.mensagem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              Enviar via WhatsApp
            </SubmitButton>
            </ContactForm>
        </ContactSection>

        {/* Footer */}
        <Footer>
          <FooterContent>
            <FooterColumn>
              <FooterLogo>
                Bibliotech<span>.tech</span>
              </FooterLogo>
              <FooterDescription>
                Sistema completo de gestão para bibliotecas escolares. 
                Desenvolvido por alunos, validado por escolas, criado para o futuro da educação.
              </FooterDescription>
            </FooterColumn>
            
            <FooterColumn>
              <FooterTitle>Produto</FooterTitle>
              <FooterLink href="#produto">
                Funcionalidades
              </FooterLink>
              <FooterLink href="#produto">
                Demonstração
              </FooterLink>
              <FooterLink href="#produto">
                Planos
              </FooterLink>
            </FooterColumn>
            
            <FooterColumn>
              <FooterTitle>Suporte</FooterTitle>
              <FooterLink href="#contato">
                Contato
              </FooterLink>
              <FooterLink href="#contato">
                Documentação
              </FooterLink>
              <FooterLink href="#contato">
                FAQ
              </FooterLink>
            </FooterColumn>
            
            <FooterColumn>
              <FooterTitle>Legal</FooterTitle>
              <FooterLink href="#contato">
                Termos de Uso
              </FooterLink>
              <FooterLink href="#contato">
                Política de Privacidade
              </FooterLink>
              <FooterLink href="#contato">
                Licença
              </FooterLink>
            </FooterColumn>
          </FooterContent>
          
          <FooterBottom>
            <Copyright>
              © {new Date().getFullYear()} Bibliotech. Todos os direitos reservados.
            </Copyright>
            <ProtonCredit>
              Desenvolvido pela <a href="https://protonsoftware.tech" target="_blank" rel="noopener noreferrer">protonsoftware.tech</a>
            </ProtonCredit>
            <SocialLinks>
              <SocialLink href="https://www.linkedin.com/company/107289200/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://wa.me/5551996468758" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
              </SocialLink>
              <SocialLink href="mailto:proton.hello.world@gmail.com" aria-label="E-mail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </SocialLink>
            </SocialLinks>
          </FooterBottom>
        </Footer>

        <WhatsAppButton 
          phoneNumber="5551996468758"
          message="Olá, Gustavo! Referente à Bibliotech;"
        />

        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <CloseButton onClick={closeImageModal}>
              ×
            </CloseButton>
            <ModalImage
              src={selectedImage}
              alt="Screenshot do sistema"
              onClick={(e) => e.stopPropagation()}
            />
          </ImageModal>
        )}
      </PageContainer>
    </>
  );
};

export default Home; 
