import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, WrenchScrewdriverIcon, SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import styles from './OnlineCatalog.module.css';

const OnlineCatalog: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.badge}>
        <WrenchScrewdriverIcon width={20} height={20} />
        Funcionalidade em construção
      </div>

      <h1 className={styles.title}>
        Catálogo Online em breve
      </h1>

      <p className={styles.description}>
        Estamos preparando um painel completo para gerenciar como o catálogo dos alunos aparece e se comporta. 
        Em breve você poderá definir destaques estratégicos, personalizar recomendações inteligentes e ajustar 
        configurações avançadas para tornar a experiência de leitura dos estudantes ainda mais envolvente.
      </p>

      <div className={styles.highlights}>
        <div className={styles.highlightCard}>
          <SparklesIcon width={24} height={24} color="#1d4ed8" />
          <div className={styles.highlightTitle}>Gerenciamento de destaques</div>
          <div className={styles.highlightText}>
            Monte coleções especiais, vitrines temáticas e campanhas promocionais para destacar os livros certos na hora certa.
          </div>
        </div>

        <div className={styles.highlightCard}>
          <AdjustmentsHorizontalIcon width={24} height={24} color="#1d4ed8" />
          <div className={styles.highlightTitle}>Configurações de recomendação</div>
          <div className={styles.highlightText}>
            Ajuste critérios de recomendação, públicos-alvo e prioridades para sugerir leituras mais relevantes aos estudantes.
          </div>
        </div>

        <div className={styles.highlightCard}>
          <WrenchScrewdriverIcon width={24} height={24} color="#1d4ed8" />
          <div className={styles.highlightTitle}>Painel centralizado</div>
          <div className={styles.highlightText}>
            Controle permissões, visibilidade do catálogo, mensagens da vitrine digital e integrações em um único lugar.
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon width={20} height={20} />
          Voltar
        </button>
        <a
          className={styles.secondaryLink}
          href="https://wa.me/5551996468758"
          target="_blank"
          rel="noopener noreferrer"
        >
          Fale com nossa equipe
        </a>
      </div>
    </div>
  );
};

export default OnlineCatalog;

