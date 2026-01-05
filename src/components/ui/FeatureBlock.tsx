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
  buttonText?: string;
  footnoteText?: string;
}

// Função helper para aplicar cores aos nomes dos planos
const highlightPlanNames = (text: string): React.ReactNode => {
  const planPatterns = [
    { name: 'Básico', className: styles.planNameBasic },
    { name: 'Intermediário', className: styles.planNameIntermediate },
    { name: 'Avançado', className: styles.planNameAdvanced }
  ];

  // Encontrar todas as ocorrências dos nomes dos planos
  const matches: Array<{ index: number; length: number; className: string }> = [];
  
  planPatterns.forEach(({ name, className }) => {
    const regex = new RegExp(name, 'gi');
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    while ((match = regexCopy.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        className
      });
    }
  });

  // Se não houver matches, retornar o texto original
  if (matches.length === 0) {
    return text;
  }

  // Ordenar matches por índice e remover sobreposições
  matches.sort((a, b) => a.index - b.index);
  
  // Filtrar matches sobrepostos (manter apenas o primeiro)
  const filteredMatches: Array<{ index: number; length: number; className: string }> = [];
  let lastEnd = -1;
  
  matches.forEach((match) => {
    if (match.index >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.index + match.length;
    }
  });

  // Construir o resultado com spans coloridos
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  filteredMatches.forEach((match) => {
    // Adicionar texto antes do match
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }
    
    // Adicionar o nome do plano com a classe de cor
    result.push(
      <span key={key++} className={match.className}>
        {text.substring(match.index, match.index + match.length)}
      </span>
    );
    
    lastIndex = match.index + match.length;
  });

  // Adicionar texto restante
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return <>{result}</>;
};

const FeatureBlock: React.FC<FeatureBlockProps> = ({
  planDisplayName,
  featureName,
  description,
  highlights,
  upgradeUrl = 'https://bibliotech.tech/#planos',
  backdropContent,
  buttonText = 'Conhecer plano intermediário',
  footnoteText = 'Disponível nos planos Bibliotech Intermediário e Avançado.'
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
                  <span className={styles.planNameBasic}>Básico</span>
                </>
              ) : planDisplayName.includes('Intermediário') ? (
                <>
                  Plano atual:{' '}
                  <span className={styles.planNameIntermediate}>Intermediário</span>
                </>
              ) : planDisplayName.includes('Avançado') ? (
                <>
                  Plano atual:{' '}
                  <span className={styles.planNameAdvanced}>Avançado</span>
                </>
              ) : (
                `Plano atual: ${planDisplayName}`
              )}
            </span>
            <h4>{highlightPlanNames(featureName)}</h4>
          </div>
        </div>
        <p className={styles.featureBlockDescription}>{highlightPlanNames(description)}</p>
        <ul className={styles.featureBlockHighlights}>
          {highlights.map((highlight, index) => (
            <li key={index}>{highlightPlanNames(highlight)}</li>
          ))}
        </ul>
        <a
          className={styles.featureBlockButton}
          href={upgradeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {highlightPlanNames(buttonText)}
          <ArrowUpRightIcon />
        </a>
        <span className={styles.featureBlockFootnote}>
          {highlightPlanNames(footnoteText)}
        </span>
      </div>
    </div>
  );
};

export default FeatureBlock;

