import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';


const HeaderContainer = styled.header<{ isTransparent: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: ${props => props.isTransparent 
    ? 'rgba(10, 14, 26, 0.6)' 
    : 'rgba(10, 14, 26, 0.95)'};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: ${props => props.isTransparent ? 'none' : '0 1px 0 rgba(255, 255, 255, 0.1)'};
  z-index: 1000;
  transition: all 0.3s ease;
  border-bottom: 1px solid ${props => props.isTransparent ? 'transparent' : 'rgba(255, 255, 255, 0.05)'};
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;
  object-fit: contain;
  
  @media (max-width: 768px) {
    height: 32px;
  }
`;

const LogoText = styled.h1`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  
  span {
    color: #0078d4;
  }
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Nav = styled.nav<{ isOpen: boolean }>`
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileNav = styled(motion.div)<{ isOpen: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: rgba(10, 14, 26, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1.5rem 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transform-origin: top;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const NavList = styled.ul`
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const NavItem = styled(motion.li)<{ isActive: boolean }>`
  color: ${props => props.isActive ? '#3b82f6' : 'white'};
  cursor: pointer;
  font-weight: 500;
  position: relative;
  padding: 0.5rem 1rem;
  transition: color 0.3s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #3b82f6;
    transform: scaleX(${props => props.isActive ? 1 : 0});
    transition: transform 0.3s ease;
  }
  
  &:hover {
    color: #3b82f6;
    
    &:after {
      transform: scaleX(1);
    }
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 0;
  }
`;

const LoginButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  @media (max-width: 768px) {
    margin-top: 1.5rem;
  }

  @media (min-width: 769px) {
    width: auto;
  }
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const DesktopNav = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NAV_ITEMS = [
  { id: 'produto', label: 'Produto' },
  { id: 'precos', label: 'Preços' },
  { id: 'contato', label: 'Contato' }
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const [activeSection, setActiveSection] = useState('inicio');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsTransparent(scrollPosition < 50);

      // Identificar a seção atual baseado na posição do scroll
      const sections = ['inicio', 'produto', 'precos', 'contato'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
    setActiveSection(sectionId);
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      scaleY: 0
    },
    open: {
      opacity: 1,
      scaleY: 1
    }
  };

  const navItemVariants = {
    closed: {
      opacity: 0,
      y: -10
    },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <HeaderContainer isTransparent={isTransparent}>
      <LogoContainer onClick={() => scrollToSection('inicio')}>
        <LogoImage 
          src="/images/sys/logo.png" 
          alt="Bibliotech Logo"
        />
        <LogoText>
          Bibliotech.<span>tech</span>
        </LogoText>
      </LogoContainer>

      <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? (
          <XMarkIcon width={24} height={24} />
        ) : (
          <Bars3Icon width={24} height={24} />
        )}
      </MenuButton>

      {/* Desktop Navigation */}
      <DesktopNav>
        <Nav isOpen={false}>
          <NavList>
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                isActive={activeSection === item.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </NavItem>
            ))}
          </NavList>
        </Nav>

        <LoginButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/select-user-type')}
        >
          <UserCircleIcon width={20} height={20} />
          Acessar
        </LoginButton>
      </DesktopNav>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={isMenuOpen}
        initial="closed"
        animate={isMenuOpen ? "open" : "closed"}
        variants={menuVariants}
        transition={{ duration: 0.3 }}
      >
        <NavList>
          {NAV_ITEMS.map((item, index) => (
            <NavItem 
              key={item.id}
              isActive={activeSection === item.id}
              custom={index}
              variants={navItemVariants}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </NavItem>
          ))}
        </NavList>
        <LoginButton
          initial={{ opacity: 0, y: -10 }}
          animate={isMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          onClick={() => {
            navigate('/select-user-type');
            setIsMenuOpen(false);
          }}
        >
          <UserCircleIcon width={20} height={20} />
          Acessar
        </LoginButton>
      </MobileNav>
    </HeaderContainer>
  );
};

export default Header; 