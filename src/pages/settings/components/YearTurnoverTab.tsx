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
          <p>Funcionalidade em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
};

export default YearTurnoverTab;

