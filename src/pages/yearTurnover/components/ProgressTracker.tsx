import React from 'react';
import { TurnoverStep } from '../../../types/yearTurnover';
import { CheckIcon } from '@heroicons/react/24/solid';
import styles from './ProgressTracker.module.css';

interface ProgressTrackerProps {
  steps: TurnoverStep[];
  currentStep: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ steps, currentStep }) => {
  return (
    <div className={styles.trackerContainer}>
      <div className={styles.stepsWrapper}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.completed || step.id < currentStep;
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.id}>
              <div className={styles.stepItem}>
                {/* Circle */}
                <div 
                  className={`
                    ${styles.stepCircle}
                    ${isActive ? styles.active : ''}
                    ${isCompleted ? styles.completed : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className={styles.checkIcon} />
                  ) : (
                    <span className={styles.stepNumber}>{step.id}</span>
                  )}
                </div>
                
                {/* Label */}
                <div className={styles.stepLabel}>
                  <span className={styles.stepTitle}>{step.label}</span>
                  <span className={styles.stepDescription}>{step.description}</span>
                </div>
              </div>
              
              {/* Connector Line */}
              {!isLast && (
                <div 
                  className={`
                    ${styles.stepConnector}
                    ${isCompleted ? styles.completedConnector : ''}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;

