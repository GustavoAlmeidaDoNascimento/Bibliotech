import React from 'react';
import styles from '../Settings.module.css';

interface AccountTabProps {
  email: string | null;
  userId: string | null;
  emailVerified: boolean;
  creationTime?: string | null;
  lastSignInTime?: string | null;
  planLabel: string;
  planLoading: boolean;
  planError?: string;
  onResetPassword: () => void;
  resetLoading: boolean;
}

const AccountTab: React.FC<AccountTabProps> = ({
  email,
  userId,
  emailVerified,
  creationTime,
  lastSignInTime,
  planLabel,
  planLoading,
  planError,
  onResetPassword,
  resetLoading
}) => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Informações da Conta</h3>
        <p className={styles.sectionDescription}>
          Gerencie os dados essenciais da sua conta Bibliotech. Essas informações ajudam a manter seu
          acesso seguro e personalizado.
        </p>

        <div className={styles.accountOverview}>
          <div className={styles.accountInfoCard}>
            <span className={styles.accountLabel}>E-mail principal</span>
            <span className={styles.accountValue}>{email ?? '—'}</span>
            <span
              className={`${styles.statusBadge} ${
                emailVerified ? styles.statusBadgeSuccess : styles.statusBadgeWarning
              }`}
            >
              {emailVerified ? 'E-mail verificado' : 'E-mail não verificado'}
            </span>
          </div>

          <div className={styles.accountInfoCard}>
            <span className={styles.accountLabel}>ID do Usuário</span>
            <span className={styles.accountValueMono}>{userId ?? '—'}</span>
          </div>

          <div className={styles.accountInfoCard}>
            <span className={styles.accountLabel}>Plano Atual</span>
            <span className={styles.planBadge}>
              {planLoading ? 'Carregando plano...' : planLabel}
            </span>
            {planError && <span className={styles.accountHelperText}>{planError}</span>}
          </div>
        </div>

        <div className={styles.accountDetailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Conta criada em</span>
            <span className={styles.detailValue}>{creationTime ?? '—'}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Último acesso</span>
            <span className={styles.detailValue}>{lastSignInTime ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>Segurança</h3>
        <p className={styles.sectionDescription}>
          Mantenha seu acesso protegido. Você pode redefinir a senha e reforçar a proteção da conta a
          qualquer momento.
        </p>

        <div className={styles.securityActions}>
          <button
            type="button"
            className={styles.accountActionButton}
            onClick={onResetPassword}
            disabled={resetLoading || !email}
          >
            {resetLoading ? 'Enviando e-mail de redefinição...' : 'Enviar e-mail para redefinir senha'}
          </button>
          <span className={styles.accountHelperText}>
            Um e-mail com as instruções será enviado para o endereço cadastrado.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountTab;

