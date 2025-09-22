import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll, useInView } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from '../hooks/useAsync';
import Header from '../components/layout/Header';
import WhatsAppButton from '../components/shared/WhatsAppButton';

const HomeContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  
  * {
    box-sizing: border-box;
  }
  
  body, html {
    overflow-x: hidden;
  }
`;

const ProgressBar = styled(motion.div)`
  position: fixed;
  bottom: 0;
  left: 0;
  height: 6px;
  background: #0078d4;
  z-index: 1000;
  box-shadow: 0 0 4px rgba(0, 120, 212, 0.3);
`;

const ParallaxSection = styled(motion.section)`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-top: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
    z-index: 1;
  }
`;

const ParallaxBackground = styled(motion.div)`
  position: absolute;
  top: -50px;
  left: -50px;
  right: -50px;
  bottom: -50px;
  background-image: url('/images/home/fundo/fundo1.jpg');
  background-size: cover;
  background-position: center;
  z-index: 0;
  
  @media (max-width: 768px) {
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
  }
`;

const ContentWrapper = styled(motion.div)`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  padding: 0 2rem;
  margin: 0 auto;
  padding-top: 15vh;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
    padding-top: 10vh;
    padding: 1rem;
  }
`;

const TextContent = styled(motion.div)`
  text-align: center;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;

  @media (max-width: 768px) {
    text-align: center;
    align-items: center;
    margin-top: 0;
    position: relative;
    z-index: 3;
    width: 100%;
    padding: 0 1rem;
  }
`;

const NeonTextContainer = styled.span`
  position: relative;
  display: inline-block;
  cursor: default;
`;

const NeonTextContent = styled.span<{ mouseX: number; mouseY: number; isHovering: boolean; isMobile: boolean }>`
  position: relative;
  background: ${props => !props.isMobile && props.isHovering ? `
    radial-gradient(
      circle 250px at ${props.mouseX}px ${props.mouseY}px,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 1) 15%,
      rgba(77, 181, 255, 1) 35%,
      #4db5ff 100%
    )
  ` : '#4db5ff'};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  display: inline-block;
  
  &::before {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0;
    text-shadow: 0 0 5px #4db5ff, 0 0 10px #4db5ff;
    opacity: 0.7;
    z-index: -1;
  }
`;

const NeonText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMobile && textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <NeonTextContainer
      ref={textRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setIsHovering(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovering(false);
          setMousePosition({ x: 0, y: 0 });
        }
      }}
    >
      <NeonTextContent 
        mouseX={mousePosition.x} 
        mouseY={mousePosition.y}
        data-text={children}
        isHovering={isHovering}
        isMobile={isMobile}
      >
        {children}
      </NeonTextContent>
    </NeonTextContainer>
  );
};

const Title = styled(motion.h1)<{ isLight?: boolean }>`
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: ${props => props.isLight ? '#ffffff' : '#2c3e50'};
  text-shadow: ${props => props.isLight ? '2px 2px 4px rgba(0, 0, 0, 0.3)' : 'none'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  user-select: none;

  @media (max-width: 768px) {
    font-size: 3rem;
    justify-content: center;
    flex-wrap: wrap;
    white-space: normal;
    line-height: 1.2;
    margin-bottom: 1.5rem;
  }
`;

const Subtitle = styled(motion.p)<{ isLight?: boolean }>`
  font-size: 1.5rem;
  color: ${props => props.isLight ? '#ffffff' : '#2c3e50'};
  max-width: 800px;
  margin: 0 auto;
  text-shadow: ${props => props.isLight ? '1px 1px 2px rgba(0, 0, 0, 0.3)' : 'none'};

  @media (max-width: 768px) {
    font-size: 1.4rem;
    line-height: 1.4;
    padding: 0 1rem;
  }

  span {
    color: ${props => props.isLight ? '#4db5ff' : '#0078d4'};
    font-weight: 500;
  }
`;

// Configuração para habilitar/desabilitar login de convidado (para facilitar remoção)
const GUEST_LOGIN_ENABLED = true;
const GUEST_CREDENTIALS = {
  email: 'bibliotech.convidado@gmail.com',
  password: 'convidado123'
};

const GuestLoginButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  padding: 18px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  margin-top: 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    transition: left 0.5s ease;
    z-index: 0;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
    
    &::before {
      left: 0;
    }
  }
  
  &:active {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  span {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 16px 28px;
    font-size: 1rem;
    margin-top: 1.5rem;
    width: 90%;
    max-width: 280px;
  }
`;

const GuestLoginIcon = styled.span`
  font-size: 1.2em;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const Section = styled(motion.section)<{ isSecond?: boolean }>`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
  position: relative;
  background: #1a1a1a;
  overflow: hidden;
  
  ${props => props.isSecond && `
    margin-top: -60px;
    padding-top: 80px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: #1a1a1a;
      transform: skewY(4deg);
      transform-origin: top right;
      z-index: 1;
    }
    
    & > * {
      position: relative;
      z-index: 2;
    }

    ${Title} {
      color: #ffffff;
    }

    ${Subtitle} {
      color: #e0e0e0;
      
      span {
        color: #4db5ff;
      }
    }
  `}
`;

const ProductSection = styled(motion.section)`
  padding: 4rem 2rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
    width: 100%;
  }
`;

const ProductTitle = styled(motion.h2)`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 2.2rem;
    margin-bottom: 1.5rem;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  span {
    white-space: nowrap;
  }
`;

const ProductDescription = styled(motion.p)`
  font-size: 1.2rem;
  color: #e0e0e0;
  margin-bottom: 4rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    margin-bottom: 2rem;
    padding: 0;
    font-size: 1.2rem;
    width: 90%;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0;
    width: 100%;
  }
`;

const ImageModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  cursor: zoom-out;
`;

const ModalImage = styled(motion.img)`
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const ProductImage = styled(motion.img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  @media (min-width: 769px) {
    &:hover {
      transform: scale(1.02);
    }
  }
`;

const VideoContainer = styled(motion.div)`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;

  &:hover .play-overlay {
    opacity: 1;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlayOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  svg {
    width: 50px;
    height: 50px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

const VideoModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;

  video {
    max-width: 90%;
    max-height: 90vh;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const ProductGraphContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #ffffff;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    aspect-ratio: 16/9;
    width: 100%;
    padding: 1rem;
    font-size: 1.4rem;
  }
`;

const ProductVideoContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #ffffff;
  grid-column: 2 / -1;
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    grid-column: 1;
    width: 100%;
    padding: 1rem;
    font-size: 1.4rem;
  }
`;

const PlanCard = ({ title, price, description }: { title: string; price: string; description: string }) => (
  <PlanCardWrapper>
    <div className="card">
      <div className="coming-soon">Em breve</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="price">{price}</div>
        <div className="description">{description}</div>
      </div>
      <button disabled>Indisponível</button>
    </div>
  </PlanCardWrapper>
);

const PlanCardWrapper = styled.div`
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    width: 260px;
    padding: 20px 1px;
    margin: 10px 0;
    text-align: center;
    position: relative;
    cursor: not-allowed;
    box-shadow: 0 10px 15px -3px rgba(33,150,243,.4),0 4px 6px -4px rgba(33,150,243,.4);
    border-radius: 10px;
    background: linear-gradient(45deg, #04051dea 0%, #2b566e 100%);
    overflow: hidden;
  }
  .coming-soon {
    position: absolute;
    top: 15px;
    right: -40px;
    background: #bfc3c9;
    color: #fff;
    font-weight: bold;
    font-size: 0.9rem;
    padding: 0.4rem 2.2rem;
    border-radius: 6px;
    transform: rotate(45deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    z-index: 2;
    opacity: 0.85;
  }
  .content {
    padding: 20px;
  }
  .content .price {
    color: white;
    font-weight: 800;
    font-size: 50px;
    text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.42);
  }
  .content .description {
    color: rgba(255, 255, 255, 0.6);
    margin-top: 10px;
    font-size: 14px;
  }
  .content .title {
    font-weight: 800;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.64);
    margin-top: 10px;
    font-size: 25px;
    letter-spacing: 1px;
  }
  button {
    user-select: none;
    border: none;
    outline: none;
    color: rgb(255 255 255);
    text-transform: uppercase;
    font-weight: 700;
    font-size: .75rem;
    padding: 0.75rem 1.5rem;
    background-color: rgb(33 150 243);
    border-radius: 0.5rem;
    width: 90%;
    text-shadow: 0px 4px 18px #2c3442;
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const PlansContainer = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: stretch;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
`;

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageModalProps> = ({ isOpen, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
    setScale(Math.min(Math.max(0.5, newScale), 3));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ImageModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onWheel={handleWheel}
        >
          <ModalImage
            src={imageUrl}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            style={{ scale }}
            onClick={(e) => e.stopPropagation()}
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            whileDrag={{ cursor: 'grabbing' }}
          />
        </ImageModal>
      )}
    </AnimatePresence>
  );
};

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <VideoModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.video
            ref={videoRef}
            src="/images/home/produto/video.mp4"
            muted
            controls
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          />
        </VideoModal>
      )}
    </AnimatePresence>
  );
};

const ScaleOnScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{
        width: '100%',
        height: '100%'
      }}
      animate={isMobile ? {
        scale: isInView ? 1.05 : 1
      } : {}}
      transition={{
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
};

const PricingSection = styled(Section)`
  background: linear-gradient(135deg, #0a192f 0%, #112240 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(77, 181, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234db5ff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  ${Title} {
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  ${Subtitle} {
    color: #fff;
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
    span {
      color: #4db5ff;
    }
  }
`;

const AboutSection = styled(Section)`
  background: linear-gradient(135deg, #0a192f 100%, #112240 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 30%, rgba(77, 181, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234db5ff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const AboutContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  gap: 3rem;
  padding: 2rem;

  @media (min-width: 992px) {
    flex-direction: row;
    align-items: center;
    gap: 4rem;
  }
`;

const AboutContent = styled(motion.div)`
  flex: 1;
  text-align: left;

  @media (max-width: 991px) {
    text-align: center;
    order: 2;
  }
`;

const AboutCardsContainer = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;

  @media (max-width: 991px) {
    order: 1;
  }
`;

const AboutCard = styled(motion.div)`
  position: relative;
  width: 280px;
  height: 180px;
  background: linear-gradient(-45deg, #143582 0%, #152a67 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 30px -15px rgba(2, 12, 27, 0.7);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.7;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
  }

  &:hover img {
    opacity: 0.9;
    transform: scale(1.05);
  }

  span {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    background: rgba(10, 25, 47, 0.85);
    color: #4db5ff;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    transform: translateY(100%);
    transition: all 0.3s ease;
  }

  &:hover span {
    transform: translateY(0);
  }
`;

const AboutTextBlock = styled(motion.div)`
  margin-bottom: 2rem;
  position: relative;
  padding: 0 0 0 1.5rem;
  border-left: 2px solid #4db5ff;

  @media (max-width: 991px) {
    padding: 0;
    border-left: none;
    margin-bottom: 1.5rem;
  }

  h3 {
    color: #4db5ff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: #e0e0e0;
    line-height: 1.6;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
`;

const AboutHighlight = styled.span`
  color: #4db5ff;
  font-weight: 500;
`;

const ContactSection = styled(Section)`
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 70%, rgba(77, 181, 255, 0.15) 0%, rgba(0, 0, 0, 0.3) 70%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  ${Title} {
    color: #ffffff;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
    font-weight: 700;
  }

  ${Subtitle} {
    color: #f0f0f0;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
    font-weight: 500;
    
    span {
      color: #4db5ff;
      font-weight: 600;
      text-shadow: 0 0 10px rgba(77, 181, 255, 0.3);
    }
  }
`;

const ContactContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ContactForm = styled(motion.form)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 3rem;
  border: 1px solid rgba(77, 181, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
`;

const FormLabel = styled.label`
  display: block;
  color: #4db5ff;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(77, 181, 255, 0.3);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4db5ff;
    box-shadow: 0 0 0 3px rgba(77, 181, 255, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(77, 181, 255, 0.3);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4db5ff;
    box-shadow: 0 0 0 3px rgba(77, 181, 255, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }

  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(77, 181, 255, 0.3);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #4db5ff;
    box-shadow: 0 0 0 3px rgba(77, 181, 255, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ContactWhatsAppButton = styled(motion.button)`
  width: 100%;
  padding: 1.2rem 2rem;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

interface ContactFormData {
  nome: string;
  interesse: string;
  mensagem: string;
}

// Componente de contador animado
const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ 
  end, 
  duration = 2, 
  suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-200px 0px -200px 0px" });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      
      let currentCount = 0;
      const steps = 60; // 60 steps
      const increment = end / steps;
      const stepDuration = (duration * 1000) / steps;
      
      const interval = setInterval(() => {
        currentCount += increment;
        if (currentCount >= end) {
          currentCount = end;
          clearInterval(interval);
        }
        setCount(Math.floor(currentCount));
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [isInView, hasAnimated, end, duration]);

  // Fallback: se não estiver em view, ainda mostra o número
  useEffect(() => {
    if (!isInView && !hasAnimated) {
      setCount(end);
    }
  }, [isInView, hasAnimated, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Seção de estatísticas
const StatsSection = styled(motion.section)`
  background: linear-gradient(135deg, #0a192f 0%, #112240 100%);
  padding: 4rem 2rem 6rem 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(77, 181, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234db5ff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const StatsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2.5rem 2rem;
  text-align: center;
  border: 1px solid rgba(77, 181, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(77, 181, 255, 0.4);
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    font-size: 1.8rem;
  }
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #4db5ff;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(77, 181, 255, 0.3);

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  color: #e0e0e0;
  font-weight: 500;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const SloganContainer = styled(motion.div)`
  text-align: center;
  margin-top: 4rem;
  padding: 2rem 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #4db5ff, transparent);
  }
`;

const SloganText = styled(motion.div)`
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem;
  font-weight: 300;
  color: #ffffff;
  line-height: 1.6;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: inline-block;
  margin: 0 3rem;

  @media (max-width: 768px) {
    font-size: 1.8rem;
    line-height: 1.4;
    display: block;
    margin: 0.8rem 0;
  }
`;

const SloganHighlight = styled.span`
  color: #4db5ff;
  font-weight: 400;
  text-shadow: 0 0 10px rgba(77, 181, 255, 0.3);
`;

// Componentes de ilustrações decorativas
const DecorativeShape = styled(motion.div)<{ 
  color: string; 
  size: string; 
  position: string;
  rotation?: number;
  mouseX: number;
  mouseY: number;
  speed: number;
}>`
  position: absolute;
  width: ${props => props.size};
  height: ${props => props.size};
  background: ${props => props.color};
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(1px);
  ${props => props.position}
  transform: 
    rotate(${props => props.rotation || 0}deg)
    translate(${props => props.mouseX * props.speed}px, ${props => props.mouseY * props.speed}px);
  z-index: 1;
  pointer-events: none;
  transition: transform 0.3s ease-out;
`;

const BookShape = styled(motion.div)<{ 
  color: string; 
  size: string; 
  position: string;
  rotation?: number;
  mouseX: number;
  mouseY: number;
  speed: number;
}>`
  position: absolute;
  width: ${props => props.size};
  height: ${props => props.size};
  background: ${props => props.color};
  border-radius: 8px;
  opacity: 0.15;
  ${props => props.position}
  transform: 
    rotate(${props => props.rotation || 0}deg)
    translate(${props => props.mouseX * props.speed}px, ${props => props.mouseY * props.speed}px);
  z-index: 1;
  pointer-events: none;
  transition: transform 0.3s ease-out;
  
  &::before {
    content: '';
    position: absolute;
    top: 20%;
    left: 20%;
    right: 20%;
    bottom: 20%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

const FloatingIcon = styled(motion.div)<{ 
  color: string; 
  size: string; 
  position: string;
  icon: string;
  mouseX: number;
  mouseY: number;
  speed: number;
}>`
  position: absolute;
  width: ${props => props.size};
  height: ${props => props.size};
  background: ${props => props.color};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0.2;
  ${props => props.position}
  transform: translate(${props => props.mouseX * props.speed}px, ${props => props.mouseY * props.speed}px);
  z-index: 1;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-out;
`;

const DecorativeContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
`;

// Componente de partículas interativas
const ParticleSystem = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const Particle = styled(motion.div)<{ color: string; size: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  border-radius: 50%;
  opacity: 0.6;
  filter: blur(1px);
`;

// Componente de efeito de digitação
const TypewriterText = styled.span`
  border-right: 2px solid #4db5ff;
  animation: blink 1s infinite;
  
  @keyframes blink {
    0%, 50% { border-color: transparent; }
    51%, 100% { border-color: #4db5ff; }
  }
`;

const TypewriterEffect: React.FC<{ text: string; speed?: number }> = ({ text, speed = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return <TypewriterText>{displayText}</TypewriterText>;
};

// Componente de indicadores de seção
const SectionIndicators = styled.div`
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  @media (max-width: 768px) {
    right: 15px;
    gap: 10px;
  }
`;

const SectionDot = styled(motion.button)<{ isActive: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isActive ? '#4db5ff' : 'rgba(255, 255, 255, 0.3)'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: #4db5ff;
    transform: scale(1.2);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    border: 2px solid #4db5ff;
    border-radius: 50%;
    opacity: ${props => props.isActive ? 0.5 : 0};
    transition: opacity 0.3s ease;
  }
`;

// Componente de gradiente animado
const AnimatedGradient = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    #0a192f,
    #112240,
    #1a1a1a,
    #0a192f
  );
  background-size: 400% 400%;
  z-index: -1;
  pointer-events: none;
  
  animation: gradientShift 15s ease infinite;
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

// Componente de efeito de brilho
const GlowEffect = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(77, 181, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
`;

// Melhorar o efeito de hover nos cards de estatísticas
const EnhancedStatCard = styled(StatCard)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(77, 181, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }
`;

// Componente de loading inicial
const LoadingScreen = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0a192f;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingText = styled(motion.div)`
  font-size: 2rem;
  color: #4db5ff;
  font-weight: 600;
  letter-spacing: 2px;
`;

// Componente de scroll reveal melhorado
const ScrollReveal = styled(motion.div)`
  opacity: 0;
  transform: translateY(50px);
  
  &.revealed {
    opacity: 1;
    transform: translateY(0);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
`;

const Home: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [decorativeMousePos, setDecorativeMousePos] = useState({ x: 0, y: 0 });
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleRect, setTitleRect] = useState<DOMRect | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const gridVideoRef = useRef<HTMLVideoElement>(null);
  
  // Hooks para login de convidado
  const navigate = useNavigate();
  const { login } = useAuth();
  const { execute: executeGuestLogin, isLoading: isGuestLoading } = useAsync<void>();
  
  // Novos estados para melhorias
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // estados do formulário de contato
  const [contactForm, setContactForm] = useState<ContactFormData>({
    nome: '',
    interesse: '',
    mensagem: ''
  });

  // configuração do spring para movimento suave
  const springConfig = { damping: 25, stiffness: 80, mass: 1.2 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // transforma o movimento do mouse em movimento do background
  const backgroundX = useTransform(x, [-500, 500], [60, -60]);
  const backgroundY = useTransform(y, [-500, 500], [60, -60]);

  // abre WhatsApp com mensagem personalizada
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

  // Função para login de convidado
  const handleGuestLogin = async () => {
    try {
      await executeGuestLogin(() => login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password));
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login de convidado:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);

      if (isMobile) {
        const scrollY = window.scrollY;
        const parallaxY = scrollY * 0.5;
        mouseY.set(parallaxY);
        
        const parallaxX = Math.sin(scrollY * 0.002) * 100;
        mouseX.set(parallaxX);
      }
      
      // Detectar seção ativa
      const sections = ['inicio', 'produto', 'contato'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      sections.forEach((sectionId, index) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
          }
        }
      });
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const moveX = (e.clientX - centerX) * 0.8;
        const moveY = (e.clientY - centerY) * 0.8;
        mouseX.set(moveX);
        mouseY.set(moveY);
        
        // Movimento para as ilustrações decorativas
        const decorativeX = (e.clientX - centerX) / centerX;
        const decorativeY = (e.clientY - centerY) / centerY;
        setDecorativeMousePos({ x: decorativeX, y: decorativeY });
        
        // Gerar partículas ocasionalmente
        if (Math.random() < 0.1) {
          const newParticle = {
            id: Date.now(),
            x: e.clientX,
            y: e.clientY,
            color: ['#4db5ff', '#25D366', '#FF6B6B'][Math.floor(Math.random() * 3)],
            size: Math.random() * 4 + 2
          };
          setParticles(prev => [...prev.slice(-20), newParticle]); // Manter apenas 20 partículas
        }
      }
    };

    // Gerar partículas iniciais
    const generateInitialParticles = () => {
      const initialParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: ['#4db5ff', '#25D366', '#FF6B6B'][Math.floor(Math.random() * 3)],
        size: Math.random() * 4 + 2
      }));
      setParticles(initialParticles);
    };

    handleResize();
    generateInitialParticles();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMobile, mouseX, mouseY]);

  useEffect(() => {
    const updateRect = () => {
      if (titleRef.current) {
        setTitleRect(titleRef.current.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  useEffect(() => {
    if (gridVideoRef.current) {
      gridVideoRef.current.muted = true;
      gridVideoRef.current.play();
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 }
  };

  // Função para scroll suave
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Função para mostrar typewriter após delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTypewriter(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingText
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              BIBLIOTECH
            </LoadingText>
          </LoadingScreen>
        )}
      </AnimatePresence>

      <Header />
      <HomeContainer>
        {/* Gradiente animado de fundo */}
        <AnimatedGradient />
        <GlowEffect />
        
        {/* Sistema de partículas */}
        <ParticleSystem>
          {particles.map((particle) => (
            <Particle
              key={particle.id}
              color={particle.color}
              size={particle.size}
              style={{
                left: particle.x,
                top: particle.y,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 2 }}
            />
          ))}
        </ParticleSystem>
        
        {/* Indicadores de seção */}
        <SectionIndicators>
          {['inicio', 'produto', 'contato'].map((sectionId, index) => (
            <SectionDot
              key={sectionId}
              isActive={activeSection === index}
              onClick={() => scrollToSection(sectionId)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </SectionIndicators>

        <ProgressBar
          style={{ width: `${scrollProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
        
        <ParallaxSection
          id="inicio"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <ParallaxBackground
            style={{
              x: backgroundX,
              y: backgroundY,
            }}
          />
          
          {/* Ilustrações decorativas */}
          <DecorativeContainer>
            {/* Formas circulares flutuantes */}
            <DecorativeShape
              color="#4db5ff"
              size="120px"
              position="top: 15%; left: 10%;"
              rotation={45}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <DecorativeShape
              color="#25D366"
              size="80px"
              position="top: 25%; right: 15%;"
              rotation={-30}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.5}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 2, delay: 0.8 }}
            />
            <DecorativeShape
              color="#FF6B6B"
              size="100px"
              position="bottom: 20%; left: 20%;"
              rotation={60}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.2}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.1, scale: 1 }}
              transition={{ duration: 2, delay: 1.1 }}
            />
            
            {/* Formas de livros */}
            <BookShape
              color="#4db5ff"
              size="60px"
              position="top: 40%; right: 25%;"
              rotation={15}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: 0.15, scale: 1, rotate: 15 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
            <BookShape
              color="#FF6B6B"
              size="80px"
              position="bottom: 30%; right: 10%;"
              rotation={-20}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.6}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: 0.15, scale: 1, rotate: -20 }}
              transition={{ duration: 1.5, delay: 0.6 }}
            />
            <BookShape
              color="#25D366"
              size="70px"
              position="bottom: 15%; left: 35%;"
              rotation={45}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: 0.15, scale: 1, rotate: 45 }}
              transition={{ duration: 1.5, delay: 0.9 }}
            />
            
            {/* Ícones flutuantes */}
            <FloatingIcon
              color="#4db5ff"
              size="50px"
              position="top: 60%; left: 15%;"
              icon="📚"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.7}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.2, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            />
            <FloatingIcon
              color="#25D366"
              size="40px"
              position="top: 70%; right: 20%;"
              icon="👥"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.2, y: 0 }}
              transition={{ duration: 1, delay: 1.4 }}
            />
            <FloatingIcon
              color="#FF6B6B"
              size="45px"
              position="bottom: 40%; left: 45%;"
              icon="🔥"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.5}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.2, y: 0 }}
              transition={{ duration: 1, delay: 1.6 }}
            />
          </DecorativeContainer>
          
          <ContentWrapper>
            <TextContent
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <Title isLight>
                Bem-vindo ao&nbsp;
                {showTypewriter ? (
                  <TypewriterEffect text="BIBLIOTECH" speed={150} />
                ) : (
                  <NeonText>BIBLIOTECH</NeonText>
                )}
              </Title>
              <Subtitle isLight>
                Bibliotecas escolares com foco no&nbsp;<NeonText>aluno!</NeonText>
              </Subtitle>
              {GUEST_LOGIN_ENABLED && (
                <GuestLoginButton
                  onClick={handleGuestLogin}
                  disabled={isGuestLoading}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>
                    <GuestLoginIcon>🚀</GuestLoginIcon>
                    {isGuestLoading ? 'Entrando...' : 'Acessar como convidado>'}
                  </span>
                </GuestLoginButton>
              )}
            </TextContent>
          </ContentWrapper>
        </ParallaxSection>

        <StatsSection
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Ilustrações decorativas para a seção de estatísticas */}
          <DecorativeContainer>
            <DecorativeShape
              color="#4db5ff"
              size="150px"
              position="top: 10%; right: 5%;"
              rotation={30}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.2}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
            />
            <DecorativeShape
              color="#25D366"
              size="100px"
              position="bottom: 10%; left: 5%;"
              rotation={-45}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <BookShape
              color="#FF6B6B"
              size="90px"
              position="top: 20%; left: 10%;"
              rotation={25}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              whileInView={{ opacity: 0.12, scale: 1, rotate: 25 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </DecorativeContainer>
          <StatsContainer>
            <EnhancedStatCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <StatIcon color="#4db5ff">📚</StatIcon>
              <StatNumber>
                <AnimatedCounter end={2330} />+
              </StatNumber>
              <StatLabel>Livros registrados</StatLabel>
            </EnhancedStatCard>
            <EnhancedStatCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StatIcon color="#25D37B">👥</StatIcon>
              <StatNumber>
                <AnimatedCounter end={605} />+
              </StatNumber>
              <StatLabel>Leitores registrados</StatLabel>
            </EnhancedStatCard>
            <EnhancedStatCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StatIcon color="#FF6B6A">🔥</StatIcon>
              <StatNumber>
                <AnimatedCounter end={221} />+
              </StatNumber>
              <StatLabel>Leitores ativos</StatLabel>
            </EnhancedStatCard>
          </StatsContainer>
          
          {/* Ilustrações decorativas para o slogan */}
          <DecorativeContainer>
            <DecorativeShape
              color="#4db5ff"
              size="60px"
              position="top: 10%; left: 5%;"
              rotation={25}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.8 }}
            />
            <FloatingIcon
              color="#25D366"
              size="25px"
              position="top: 20%; right: 8%;"
              icon="✨"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.5}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.15, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 1.0 }}
            />
            <DecorativeShape
              color="#FF6B6B"
              size="50px"
              position="bottom: 15%; right: 5%;"
              rotation={-20}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.2}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 1.2 }}
            />
          </DecorativeContainer>

          <SloganContainer
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <SloganText
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <SloganHighlight>Desenvolvido</SloganHighlight> por alunos
            </SloganText>
            <SloganText
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.7 }}
            >
              <SloganHighlight>Validado</SloganHighlight> por escolas
            </SloganText>
            <SloganText
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 2.4 }}
            >
              <SloganHighlight>Criado</SloganHighlight> para o futuro
            </SloganText>
          </SloganContainer>
        </StatsSection>

        <Section
          id="produto"
          isSecond
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Ilustrações decorativas para a seção de produto */}
          <DecorativeContainer>
            <DecorativeShape
              color="#4db5ff"
              size="100px"
              position="top: 15%; left: 8%;"
              rotation={20}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.3 }}
            />
            <BookShape
              color="#25D366"
              size="70px"
              position="top: 25%; right: 12%;"
              rotation={-15}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              whileInView={{ opacity: 0.12, scale: 1, rotate: -15 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.6 }}
            />
            <FloatingIcon
              color="#FF6B6B"
              size="40px"
              position="bottom: 20%; left: 15%;"
              icon="📊"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.5}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.15, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.9 }}
            />
            <DecorativeShape
              color="#4db5ff"
              size="80px"
              position="bottom: 30%; right: 8%;"
              rotation={60}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.2}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 1.2 }}
            />
          </DecorativeContainer>
          <ProductSection>
            <ProductGrid>
              <ProductDescription
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <ProductTitle
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Sobre o <span style={{ color: '#4db5ff' }}>sistema</span>
                </ProductTitle>
                Oferecemos um <span style={{ color: '#4db5ff' }}>controle de métricas</span> que contribui para o desempenho da biblioteca, assim como para a <span style={{ color: '#4db5ff' }}>motivação dos alunos!</span>
              </ProductDescription>
              <ProductGraphContainer
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <ScaleOnScroll>
                  <ProductImage
                    src="/images/home/produto/graph1.png"
                    alt="Gráfico de métricas 1"
                    onClick={() => setSelectedImage("/images/home/produto/graph1.png")}
                  />
                </ScaleOnScroll>
              </ProductGraphContainer>
              <ProductGraphContainer
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <ScaleOnScroll>
                  <ProductImage
                    src="/images/home/produto/graph2.png"
                    alt="Gráfico de métricas 2"
                    onClick={() => setSelectedImage("/images/home/produto/graph2.png")}
                  />
                </ScaleOnScroll>
              </ProductGraphContainer>
              <ProductGraphContainer
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <ScaleOnScroll>
                  <ProductImage
                    src="/images/home/produto/graph3.png"
                    alt="Gráfico de métricas 3"
                    onClick={() => setSelectedImage("/images/home/produto/graph3.png")}
                  />
                </ScaleOnScroll>
              </ProductGraphContainer>
              <ProductVideoContainer
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <ScaleOnScroll>
                  <VideoContainer onClick={() => setIsVideoModalOpen(true)}>
                    <video
                      ref={gridVideoRef}
                      src="/images/home/produto/video.mp4"
                      muted
                      playsInline
                      loop
                      autoPlay
                    />
                    <PlayOverlay className="play-overlay">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </PlayOverlay>
                  </VideoContainer>
                </ScaleOnScroll>
                
                {/* Ilustrações decorativas ao redor do vídeo */}
                <DecorativeContainer>
                  <FloatingIcon
                    color="#4db5ff"
                    size="30px"
                    position="top: -15px; right: -15px;"
                    icon="🎬"
                    mouseX={decorativeMousePos.x}
                    mouseY={decorativeMousePos.y}
                    speed={0.4}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 0.2, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                  <DecorativeShape
                    color="#25D366"
                    size="40px"
                    position="bottom: -20px; left: -20px;"
                    rotation={45}
                    mouseX={decorativeMousePos.x}
                    mouseY={decorativeMousePos.y}
                    speed={0.3}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 0.1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 1.0 }}
                  />
                </DecorativeContainer>
              </ProductVideoContainer>
            </ProductGrid>
          </ProductSection>
        </Section>

        {/* 
        ====================================================================
        SEÇÃO DE PLANOS E PREÇOS - COMENTADA POR ENQUANTO
        ====================================================================
        
        Aqui ficam os planos Bibliotech Basic e Bibliotech +.
        Se eu quiser implementar uma seção de planos e preços mais tarde, 
        é só descomentar esta seção aqui.
        
        Não vou criar uma nova seção de planos - vou usar esta que já tá pronta.

        (comentario preparado pra facilitar minha vida depois kkkkk)
        ====================================================================
        
        <PricingSection
          id="precos"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Title variants={fadeInUp}>
            Planos
          </Title>
          <Subtitle variants={fadeInUp}>
            Oferecemos planos <span style={{ color: '#4db5ff' }}>distintos</span>, para atender à <span style={{ color: '#4db5ff' }}>todos </span>os tipos de escola. Não gostou? Receba seu <span style={{ color: '#4db5ff' }}>dinheiro de volta!</span>
          </Subtitle>
          <PlansContainer>
            <PlanCard
              title="Bibliotech Basic"
              price="R$ --"
              description="Plano básico para escolas que buscam digitalizar sua biblioteca de forma simples e eficiente."
            />
            <PlanCard
              title="Bibliotech +"
              price="R$ --"
              description="Plano avançado com recursos extras para escolas que querem o máximo em tecnologia e gestão."
            />
          </PlansContainer>
        </PricingSection>
        */}

        {/* Seção Proton Software comentada temporariamente
        <AboutSection
          id="sobre"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Title variants={fadeInUp} isLight={true}>
            Proton Software
          </Title>
          <AboutContainer>
            <AboutContent>
              <AboutTextBlock
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3>Nossa história</h3>
                <p>
                  A <AboutHighlight>Bibliotech</AboutHighlight> nasceu quando identificamos oportunidades de melhoria em uma solução mal projetada, encontrando um caminho para desenvolver um produto inovador e expansível para gerenciamento de bibliotecas escolares.
                </p>
                <p>
                  Nosso sistema foi desenvolvido com foco no desempenho de alunos, livros e turmas. Criamos métricas que ajudam escolas a investirem nos livros certos e motivam os estudantes através de metas trimestrais, criando um sentimento de participação.
                </p>
                <p>
                  A partir desse produto, fundamos a <AboutHighlight>Proton Software</AboutHighlight>, expandindo para o desenvolvimento de softwares sob demanda, que atualmente representa nosso principal foco de faturamento, enquanto continuamos evoluindo nossos produtos próprios.
                </p>
              </AboutTextBlock>
            </AboutContent>
            <AboutCardsContainer
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
              <AboutCard
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <img src="/images/home/about/bibliotech-dashboard.jpg" alt="Dashboard Bibliotech" />
                <span>Dashboard intuitivo</span>
              </AboutCard>
              <AboutCard
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <img src="/images/home/about/dev-team.jpg" alt="Equipe de desenvolvimento" />
                <span>Equipe especializada</span>
              </AboutCard>
              <AboutCard
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <img src="/images/home/about/innovation.jpg" alt="Inovação" />
                <span>Inovação constante</span>
              </AboutCard>
            </AboutCardsContainer>
          </AboutContainer>
        </AboutSection>
        */}

        <ContactSection
          id="contato"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Ilustrações decorativas para a seção de contato */}
          <DecorativeContainer>
            <DecorativeShape
              color="#4db5ff"
              size="120px"
              position="top: 10%; right: 10%;"
              rotation={45}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.3}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.2 }}
            />
            <BookShape
              color="#25D366"
              size="60px"
              position="top: 30%; left: 8%;"
              rotation={30}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              whileInView={{ opacity: 0.12, scale: 1, rotate: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <FloatingIcon
              color="#FF6B6B"
              size="35px"
              position="bottom: 25%; right: 15%;"
              icon="💬"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.6}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.15, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8 }}
            />
            <DecorativeShape
              color="#4db5ff"
              size="90px"
              position="bottom: 15%; left: 12%;"
              rotation={-30}
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.2}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.08, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 1.1 }}
            />
            <FloatingIcon
              color="#25D366"
              size="30px"
              position="top: 60%; left: 20%;"
              icon="📧"
              mouseX={decorativeMousePos.x}
              mouseY={decorativeMousePos.y}
              speed={0.4}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.15, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 1.4 }}
            />
          </DecorativeContainer>
          <Title variants={fadeInUp}>
            Entre em Contato
          </Title>
          <Subtitle variants={fadeInUp}>
            Preencha o formulário abaixo e <span style={{ color: '#4db5ff' }}>continue no WhatsApp</span> para finalizar seu contato conosco.
          </Subtitle>
          
          <ContactContainer>
            <ContactForm
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
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
                  {/* <option value="Planos">Conhecer Planos</option> - Comentado temporariamente junto com a seção de planos */}
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
              
              <ContactWhatsAppButton
                type="submit"
                disabled={!contactForm.nome || !contactForm.interesse || !contactForm.mensagem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.569-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                </svg>
                Continuar no WhatsApp
              </ContactWhatsAppButton>
            </ContactForm>
          </ContactContainer>
        </ContactSection>

        <WhatsAppButton 
          phoneNumber="5551997188572"
          message="Olá, Gustavo! Referente à Bibliotech;"
        />
      </HomeContainer>
      
      <VideoPlayer
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
      
      <ImageViewer
        isOpen={!!selectedImage}
        imageUrl={selectedImage || ''}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default Home; 