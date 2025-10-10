import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import Header from '../components/layout/Header';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import { BookOpenIcon as Book, UsersIcon as Users, ArrowTrendingUpIcon as TrendingUp } from '@heroicons/react/24/outline';

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

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 120, 212, 0.2);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s ease;
  
    &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(0, 120, 212, 0.4);
    transform: translateY(-4px);
  }
  
  svg {
    width: 40px;
    height: 40px;
    color: #0078d4;
    margin-bottom: 16px;
  }
  
  @media (max-width: 768px) {
    padding: 24px 20px;
  }
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #0078d4;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.95rem;
  color: #94a3b8;
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

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ProductCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(0, 120, 212, 0.3);
    transform: translateY(-4px);
  }
  
  img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    display: block;
  }
  
  @media (max-width: 768px) {
    img {
      height: 200px;
    }
  }
`;

const VideoContainer = styled(motion.div)`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
    position: relative;

  iframe {
  width: 100%;
    height: 100%;
    border: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }
`;

const PlayButton = styled.div`
    position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: rgba(0, 120, 212, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
    transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 120, 212, 1);
    transform: translate(-50%, -50%) scale(1.1);
  }

  &::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 20px solid white;
    border-top: 12px solid transparent;
    border-bottom: 12px solid transparent;
    margin-left: 4px;
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

const GUEST_LOGIN_ENABLED = true;
const GUEST_CREDENTIALS = {
  email: 'bibliotech.convidado@gmail.com',
  password: 'convidado123'
};

interface ContactFormData {
  nome: string;
  interesse: string;
  mensagem: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { execute: executeGuestLogin, isLoading: isGuestLoading } = useAsync<void>();
  const [isVideoInView, setIsVideoInView] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    nome: '',
    interesse: '',
    mensagem: ''
  });

  const handleGuestLogin = async () => {
    try {
      await executeGuestLogin(() => login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password));
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login de convidado:', error);
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
    const whatsappUrl = `https://wa.me/5551997188572?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVideoInView(true);
        }
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current);
      }
    };
  }, []);

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
              {GUEST_LOGIN_ENABLED && (
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
            
            <StatsGrid
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <StatCard whileHover={{ scale: 1.05 }}>
                <Book />
                <StatNumber>2.330+</StatNumber>
              <StatLabel>Livros registrados</StatLabel>
              </StatCard>
              
              <StatCard whileHover={{ scale: 1.05 }}>
                <Users />
                <StatNumber>605+</StatNumber>
              <StatLabel>Leitores registrados</StatLabel>
              </StatCard>
              
              <StatCard whileHover={{ scale: 1.05 }}>
                <TrendingUp />
                <StatNumber>221+</StatNumber>
              <StatLabel>Leitores ativos</StatLabel>
              </StatCard>
            </StatsGrid>
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
          
          <ProductGrid>
            <ProductCard
              initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <img src="/images/home/produto/graph1.png" alt="Gráfico de métricas 1" />
            </ProductCard>
            
            <ProductCard
              initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <img src="/images/home/produto/graph2.png" alt="Gráfico de métricas 2" />
            </ProductCard>
            
            <ProductCard
              initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img src="/images/home/produto/graph3.png" alt="Gráfico de métricas 3" />
            </ProductCard>
          </ProductGrid>
          
          <VideoContainer
            ref={videoContainerRef}
            initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {isVideoInView ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/p1EwxbQ323k?autoplay=1&mute=0&loop=1&playlist=p1EwxbQ323k&controls=1&modestbranding=1&rel=0"
                      title="Bibliotech - Demonstração do Sistema"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <>
                      <img
                        src="https://img.youtube.com/vi/p1EwxbQ323k/maxresdefault.jpg"
                        alt="Bibliotech - Demonstração do Sistema"
                  onClick={() => setIsVideoInView(true)}
                />
                <PlayButton onClick={() => setIsVideoInView(true)} />
                    </>
                  )}
                </VideoContainer>
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
              <SocialLink href="https://wa.me/5551997188572" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
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
          phoneNumber="5551997188572"
          message="Olá, Gustavo! Referente à Bibliotech;"
        />
      </PageContainer>
    </>
  );
};

export default Home; 
