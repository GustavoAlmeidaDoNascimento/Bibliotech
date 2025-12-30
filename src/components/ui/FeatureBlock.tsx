import React from 'react';
import { LockClosedIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import styles from './FeatureBlock.module.css';

interface FeatureBlockProps {
  planDisplayName: string;
  featureName: string;
  description: string;
  highlights: string[];
  upgradeUrl?: string;
  backdropContent?: React.ReactNode;
}

const FeatureBlock: React.FC<FeatureBlockProps> = ({
  planDisplayName,
  featureName,
  description,
  highlights,
  upgradeUrl = 'https://bibliotech.tech/#planos',
  backdropContent
}) => {
  return (
    <div className={styles.featureBlockContainer}>
      {backdropContent && (
        <div className={styles.featureBlockBackdrop} aria-hidden="true">
          {backdropContent}
        </div>
      )}
      <div className={styles.featureBlockCard}>
        <div className={styles.featureBlockHeader}>
          <div className={styles.featureBlockIcon}>
            <LockClosedIcon />
          </div>
          <div>
            <span className={styles.featureBlockBadge}>
              {planDisplayName.includes('Básico') ? (
                <>
                  Plano atual:{' '}
                  <span className={styles.planNameHighlight}>Básico</span>
                </>
              ) : (
                `Plano atual: ${planDisplayName}`
              )}
            </span>
            <h4>{featureName}</h4>
          </div>
        </div>
        <p className={styles.featureBlockDescription}>{description}</p>
        <ul className={styles.featureBlockHighlights}>
          {highlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
        <a
          className={styles.featureBlockButton}
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Conhecer plano intermediário
          <ArrowUpRightIcon />
        </a>
        <span className={styles.featureBlockFootnote}>
          Disponível nos planos Bibliotech Intermediário e Avançado.
        </span>
      </div>
    </div>
  );
};

export default FeatureBlock;

