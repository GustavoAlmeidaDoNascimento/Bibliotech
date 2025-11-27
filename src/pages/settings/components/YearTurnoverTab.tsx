import React from 'react';
import styles from '../Settings.module.css';

const YearTurnoverTab: React.FC = () => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Gerenciar Virada de Ano</h3>
        <p className={styles.sectionDescription}>
          Gerencie a transição de dados entre anos letivos.
        </p>
        
        <div className={styles.settingsSection}>
          <p>
            Não se preocupe! Entraremos em contato com cada cliente por telefone 
            para auxiliar e notificar sobre a virada de ano. Nossa equipe cuidará 
            de todo o processo de transição de dados entre anos letivos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YearTurnoverTab;

