import React from 'react';
import styles from './NewBadge.module.css';

interface NewBadgeProps {
  text?: string;
  variant?: 'new' | 'beta' | 'updated';
}

const NewBadge: React.FC<NewBadgeProps> = ({ text = 'novo!', variant = 'new' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {text}
    </span>
  );
};

export default NewBadge;

