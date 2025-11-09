import React from 'react';
import EducationalLevelManager from '../../../components/EducationalLevelManager';
import ClassesByLevel from '../../../components/ClassesByLevel';
import styles from '../Settings.module.css';

const EducationalLevelsTab: React.FC = () => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Níveis Educacionais</h3>
        <p className={styles.sectionDescription}>
          Defina os níveis educacionais atendidos pela biblioteca e organize as turmas vinculadas.
        </p>
        <EducationalLevelManager />
      </div>

      <div className={styles.settingsSection}>
        <h3>Turmas por Nível</h3>
        <p className={styles.sectionDescription}>
          Relacione turmas específicas a cada nível para acompanhar métricas e gerenciar empréstimos.
        </p>
        <ClassesByLevel />
      </div>
    </div>
  );
};

export default EducationalLevelsTab;

