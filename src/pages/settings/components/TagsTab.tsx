import React from 'react';
import TagManager from '../../../components/TagManager';
import styles from '../Settings.module.css';

const TagsTab: React.FC = () => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Gerenciar Tags</h3>
        <p className={styles.sectionDescription}>
          Organize gêneros e categorias para classificar melhor o acervo e facilitar as buscas.
        </p>
        <TagManager />
      </div>
    </div>
  );
};

export default TagsTab;

