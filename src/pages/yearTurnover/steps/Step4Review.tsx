import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { yearTurnoverService } from '../../../services/yearTurnoverService';
import { LoadingSpinner } from '../../../components/ui';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import styles from './Steps.module.css';

const Step4Review: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    config,
    allStudents,
    setValidation,
    goToNextStep,
    completeStep,
    validation
  } = useYearTurnover();
  
  const [validating, setValidating] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      validateConfiguration();
    }
  }, [currentUser]);
  
  const validateConfiguration = async () => {
    if (!currentUser) return;
    
    try {
      setValidating(true);
      const result = await yearTurnoverService.validateTurnover(currentUser.uid, config);
      setValidation(result);
    } catch (error) {
      console.error('Erro na validação:', error);
    } finally {
      setValidating(false);
    }
  };
  
  const handleProceed = () => {
    if (validation?.valid) {
      completeStep(4);
      goToNextStep();
    }
  };
  
  // Traduzir tipos de erro para mensagens amigáveis
  const getErrorTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'missing_level': 'Nível educacional ausente',
      'duplicate_mapping': 'Duplicação de dados',
      'no_action': 'Ações pendentes',
      'no_mapping': 'Mapeamento incompleto',
      'invalid_target': 'Destino inválido'
    };
    return titles[type] || 'Erro';
  };
  
  // Traduzir tipos de aviso para mensagens amigáveis
  const getWarningTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'active_loans': 'Empréstimos ativos',
      'no_students': 'Turma sem alunos',
      'large_class': 'Turma grande'
    };
    return titles[type] || 'Aviso';
  };
  
  const stats = {
    promoted: config.studentActions.filter(s => s.action === 'promote').length,
    retained: config.studentActions.filter(s => s.action === 'retain').length,
    transferred: config.studentActions.filter(s => s.action === 'transfer').length,
    graduated: config.studentActions.filter(s => s.action === 'graduate').length,
    totalDeleted: config.studentActions.filter(s => s.action === 'transfer' || s.action === 'graduate').length
  };
  
  if (validating) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>Validando configuração...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Revisão Final</h2>
      <p className={styles.stepDescription}>
        Revise todas as mudanças antes de executar a virada de ano
      </p>
      
      {/* Transição de Ano */}
      <div className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h3>Transição de Ano Letivo</h3>
        </div>
        <div className={styles.yearTransition}>
          <div className={styles.yearBox}>
            <span className={styles.yearLabel}>De</span>
            <span className={styles.yearValue}>{config.fromYear}</span>
          </div>
          <div className={styles.arrow}>→</div>
          <div className={styles.yearBox}>
            <span className={styles.yearLabel}>Para</span>
            <span className={styles.yearValue}>{config.toYear}</span>
          </div>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statValue}>{stats.promoted}</span>
          <span className={styles.statLabel}>Serão Promovidos</span>
        </div>
        <div className={`${styles.statCard} ${styles.statPurple}`}>
          <span className={styles.statValue}>{stats.retained}</span>
          <span className={styles.statLabel}>Serão Retidos</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <span className={styles.statValue}>{stats.totalDeleted}</span>
          <span className={styles.statLabel}>Serão Removidos</span>
        </div>
      </div>
      
      {/* Resultados da Validação */}
      {validation && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className={styles.sectionTitle}>Resultados da Validação</h3>
          
          {validation.valid ? (
            <div className={styles.checkItem} style={{ background: '#D1FAE5', border: '2px solid #10B981' }}>
              <CheckCircleIcon className={`${styles.checkIcon} ${styles.successIcon}`} />
              <div className={styles.checkContent}>
                <strong className={styles.checkTitle}>Validação aprovada!</strong>
                <p className={styles.checkDescription}>
                  Todas as verificações passaram. O sistema está pronto para executar a virada de ano.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {validation.errors.map((error, index) => (
                <div key={index} className={styles.checkItem} style={{ background: '#FEE2E2', border: '2px solid #EF4444', marginBottom: '0.5rem' }}>
                  <XCircleIcon className={`${styles.checkIcon} ${styles.errorIcon}`} />
                  <div className={styles.checkContent}>
                    <strong className={styles.checkTitle}>{getErrorTitle(error.type)}</strong>
                    <p className={styles.checkDescription}>{error.message}</p>
                    {error.affectedItems.length > 0 && (
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        {error.affectedItems.slice(0, 5).map((item, i) => (
                          <li key={i} style={{ fontSize: '0.875rem' }}>{item}</li>
                        ))}
                        {error.affectedItems.length > 5 && (
                          <li style={{ fontSize: '0.875rem' }}>... e mais {error.affectedItems.length - 5}</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Avisos:</h4>
              {validation.warnings.map((warning, index) => (
                <div key={index} className={styles.checkItem} style={{ background: '#FEF3C7', border: '2px solid #F59E0B', marginBottom: '0.5rem' }}>
                  <ExclamationTriangleIcon className={`${styles.checkIcon} ${styles.warningIcon}`} />
                  <div className={styles.checkContent}>
                    <strong className={styles.checkTitle}>{getWarningTitle(warning.type)}</strong>
                    <p className={styles.checkDescription}>{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Avisos Importantes */}
      <div className={styles.warningBox}>
        <ExclamationTriangleIcon className={styles.warningIcon} />
        <div>
          <strong>Avisos Importantes:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            <li>{stats.totalDeleted} aluno(s) serão REMOVIDOS PERMANENTEMENTE do sistema (transferidos e graduados)</li>
            <li>Empréstimos ativos de alunos removidos ficarão como "anônimos" até a devolução</li>
            <li>Um snapshot completo do dashboard será criado para preservar dados de {config.fromYear}</li>
            <li>Esta ação NÃO pode ser desfeita após a execução</li>
            <li>Todos os caches do sistema serão limpos</li>
          </ul>
        </div>
      </div>
      
      <div className={styles.stepActions}>
        <button
          onClick={handleProceed}
          disabled={!validation?.valid}
          className={styles.primaryButton}
        >
          {validation?.valid ? 'Executar Virada de Ano' : 'Corrigir Erros Primeiro'}
        </button>
      </div>
    </div>
  );
};

export default Step4Review;

