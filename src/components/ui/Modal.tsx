import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalProps } from '../../types/common';
import { COLORS, Z_INDEX, ANIMATION_DURATION, SIZES, BREAKPOINTS } from '../../constants';

const ModalOverlay = styled(motion.div)`
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
  z-index: ${Z_INDEX.MODAL};
  padding: 2rem;
  cursor: zoom-out;
`;

const ModalContent = styled(motion.div)<{ size: ModalProps['size'] }>`
  background: ${COLORS.BACKGROUND.PRIMARY};
  border-radius: ${SIZES.BORDER_RADIUS};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  cursor: default;
  
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          width: 100%;
          max-width: 400px;
        `;
      case 'large':
        return `
          width: 100%;
          max-width: 800px;
        `;
      default:
        return `
          width: 100%;
          max-width: 600px;
        `;
    }
  }}

  @media (max-width: ${BREAKPOINTS.MOBILE}) {
    width: 95%;
    max-width: none;
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid ${COLORS.BACKGROUND.SECONDARY};
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: ${COLORS.TEXT.PRIMARY};
  font-size: 1.5rem;
  font-weight: 600;
`;

const ModalBody = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${COLORS.TEXT.SECONDARY};
  transition: color ${ANIMATION_DURATION.SHORT}s ease;
  
  &:hover {
    color: ${COLORS.TEXT.PRIMARY};
  }
`;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  }
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium'
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: ANIMATION_DURATION.SHORT }}
          onClick={handleOverlayClick}
        >
          <ModalContent
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            size={size}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={onClose} aria-label="Fechar modal">
              ×
            </CloseButton>
            
            {title && (
              <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
              </ModalHeader>
            )}
            
            <ModalBody>
              {children}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default Modal; 