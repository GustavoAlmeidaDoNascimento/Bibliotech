import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useYearTurnover, YearTurnoverProvider } from '../../contexts/YearTurnoverContext';
import Step1Preparation from './steps/Step1Preparation';
import Step2ClassMapping from './steps/Step2ClassMapping';
import Step3StudentManagement from './steps/Step3StudentManagement';
import Step4Review from './steps/Step4Review';
import Step5Execution from './steps/Step5Execution';
import Step6Completion from './steps/Step6Completion';
import ProgressTracker from './components/ProgressTracker';
import styles from './YearTurnover.module.css';
import { XMarkIcon } from '@heroicons/react/24/outline';

const YearTurnoverWizardContent: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    steps,
    goToNextStep,
    goToPreviousStep,
    isExecuting,
    isCompleted
  } = useYearTurnover();
  
  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar a virada de ano? Todo o progresso será perdido.')) {
      navigate('/settings');
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Preparation />;
      case 2:
        return <Step2ClassMapping />;
      case 3:
        return <Step3StudentManagement />;
      case 4:
        return <Step4Review />;
      case 5:
        return <Step5Execution />;
      case 6:
        return <Step6Completion />;
      default:
        return <Step1Preparation />;
    }
  };
  
  const canGoBack = currentStep > 1 && !isExecuting && !isCompleted;
  const showNavigation = currentStep < 5; // Não mostrar navegação na execução e conclusão
  
  return (
    <div className={styles.wizardContainer}>
      {/* Header */}
      <div className={styles.wizardHeader}>
        <div>
          <h1 className={styles.wizardTitle}>Virada de Ano Letivo</h1>
          <p className={styles.wizardSubtitle}>
            Gerencie a transição de dados entre anos letivos de forma segura e organizada
          </p>
        </div>
        <button 
          onClick={handleCancel}
          className={styles.cancelButton}
          disabled={isExecuting}
        >
          <XMarkIcon className={styles.cancelIcon} />
          Cancelar
        </button>
      </div>
      
      {/* Progress Tracker */}
      <div className={styles.progressSection}>
        <ProgressTracker steps={steps} currentStep={currentStep} />
      </div>
      
      {/* Step Content */}
      <div className={styles.stepContent}>
        {renderStep()}
      </div>
      
      {/* Navigation Buttons */}
      {showNavigation && (
        <div className={styles.wizardActions}>
          <button
            onClick={goToPreviousStep}
            disabled={!canGoBack}
            className={styles.secondaryButton}
          >
            Voltar
          </button>
          
          <button
            onClick={goToNextStep}
            className={styles.primaryButton}
            disabled={isExecuting}
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
};

const YearTurnoverWizard: React.FC = () => {
  return (
    <YearTurnoverProvider>
      <YearTurnoverWizardContent />
    </YearTurnoverProvider>
  );
};

export default YearTurnoverWizard;

