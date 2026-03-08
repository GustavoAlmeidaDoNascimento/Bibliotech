import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import styles from './PlanAccount.module.css';

const PlanAccount: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden>
          🔧
        </span>
        <h1 className={styles.title}>Página em construção</h1>
        <p className={styles.description}>
          Em breve você poderá gerenciar seu plano e assinatura por aqui.
        </p>
        <Link to={ROUTES.DASHBOARD} className={styles.backLink}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default PlanAccount;
