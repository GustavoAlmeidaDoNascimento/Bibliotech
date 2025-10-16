import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0a0e1a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
`;

const BackgroundDecoration = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(0, 120, 212, 0.1) 0%, transparent 70%);
    animation: pulse 8s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
`;

const ContentContainer = styled.div`
  max-width: 600px;
  width: 100%;
  text-align: center;
  z-index: 1;
`;

const ErrorCode = styled(motion.h1)`
  font-size: clamp(6rem, 15vw, 12rem);
  font-weight: 900;
  background: linear-gradient(135deg, #0078d4 0%, #4db5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 8rem;
  }
`;

const ErrorTitle = styled(motion.h2)`
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: white;
  margin: 24px 0 16px;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const ErrorDescription = styled(motion.p)`
  font-size: clamp(1rem, 2vw, 1.125rem);
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 32px;
  }
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
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
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #106ebe;
    transform: translateY(-2px);
  }
  
  @media (max-width: 640px) {
    width: 100%;
    max-width: 300px;
    justify-content: center;
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
  
  @media (max-width: 640px) {
    width: 100%;
    max-width: 300px;
  }
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <PageContainer>
      <BackgroundDecoration />
      
      <ContentContainer>
        <ErrorCode
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          404
        </ErrorCode>
        
        <ErrorTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Página não encontrada
        </ErrorTitle>
        
        <ErrorDescription
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Ops! A página que você está procurando não existe ou foi movida.
          Não se preocupe, podemos ajudá-lo a encontrar o caminho de volta.
        </ErrorDescription>
        
        <ButtonGroup
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PrimaryButton
            onClick={goHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconWrapper>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </IconWrapper>
            Ir para o Início
          </PrimaryButton>
          
          <SecondaryButton
            onClick={goBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Voltar
          </SecondaryButton>
        </ButtonGroup>
      </ContentContainer>
    </PageContainer>
  );
};

export default NotFound;

