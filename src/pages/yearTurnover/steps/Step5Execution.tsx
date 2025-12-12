import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { yearTurnoverService } from '../../../services/yearTurnoverService';
import { LoadingSpinner } from '../../../components/ui';
import styles from './Steps.module.css';

const loadingMessages = [
  'Criando snapshot do dashboard...',
  'Arquivando ano letivo anterior...',
  'Criando novo ano letivo...',
  'Processando alunos...',
  'Atualizando turmas...',
  'Removendo alunos transferidos e graduados...',
  'Finalizando processo...'
];

const Step5Execution: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    config,
    setStatistics,
    setError,
    setIsExecuting,
    setIsCompleted,
    goToNextStep,
    completeStep
  } = useYearTurnover();
  
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (currentUser) {
      executeYearTurnover();
    }
  }, [currentUser]);
  
  useEffect(() => {
    // Animar mensagens de loading
    const interval = setInterval(() => {
      setMessageIndex(prev => {
        const next = (prev + 1) % loadingMessages.length;
        setCurrentMessage(loadingMessages[next]);
        setProgress(((next + 1) / loadingMessages.length) * 100);
        return next;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const executeYearTurnover = async () => {
    if (!currentUser) return;
    
    try {
      setIsExecuting(true);
      
      console.log('🚀 Iniciando execução da virada de ano...');
      
      const result = await yearTurnoverService.executeTurnover(currentUser.uid, config);
      
      if (result.success && result.statistics) {
        console.log('✅ Virada de ano concluída com sucesso!');
        setStatistics(result.statistics);
        setIsCompleted(true);
        completeStep(5);
        
        // Aguardar um pouco antes de ir para a próxima etapa
        setTimeout(() => {
          goToNextStep();
        }, 1500);
      } else {
        console.error('❌ Erro na virada de ano:', result.error);
        setError(result.error || 'Erro desconhecido ao executar virada de ano');
        setIsCompleted(false);
      }
      
    } catch (error) {
      console.error('❌ Erro crítico na execução:', error);
      setError(error instanceof Error ? error.message : 'Erro crítico ao executar virada de ano');
      setIsCompleted(false);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className={styles.stepContainer}>
      <div className={styles.loadingContainer} style={{ minHeight: '500px' }}>
        {/* Spinner animado */}
        <div style={{ 
          width: '120px', 
          height: '120px',
          border: '8px solid #E5E7EB',
          borderTop: '8px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '2rem'
        }} />
        
        {/* Mensagem atual */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1F2937',
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          Executando Virada de Ano...
        </h2>
        
        <p style={{
          fontSize: '1rem',
          color: '#3B82F6',
          fontWeight: 500,
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {currentMessage}
        </p>
        
        {/* Barra de progresso */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          height: '8px',
          background: '#E5E7EB',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#3B82F6',
            transition: 'width 0.5s ease',
            borderRadius: '999px'
          }} />
        </div>
        
        <p style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          Por favor, não feche esta janela...
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Step5Execution;

