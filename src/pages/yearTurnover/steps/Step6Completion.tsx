import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { CheckCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import styles from './Steps.module.css';

const Step6Completion: React.FC = () => {
  const navigate = useNavigate();
  const { config, statistics, error } = useYearTurnover();
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleDownloadReport = () => {
    if (!statistics) return;
    
    // Criar relatório em formato CSV (compatível com Excel)
    const reportLines = [
      'RELATÓRIO DE VIRADA DE ANO LETIVO',
      '',
      `De: ${config.fromYear}`,
      `Para: ${config.toYear}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      '',
      'ESTATÍSTICAS GERAIS',
      `Total de Alunos Processados: ${statistics.totalStudents}`,
      `Alunos Promovidos: ${statistics.promoted}`,
      `Alunos Retidos: ${statistics.retained}`,
      `Alunos Transferidos: ${statistics.transferred}`,
      `Alunos Graduados: ${statistics.graduated}`,
      `Total Removidos (Transferidos + Graduados): ${statistics.studentsDeleted}`,
      `Turmas Criadas: ${statistics.classesCreated}`,
      `Empréstimos Ativos Mantidos: ${statistics.activeLoansKept}`,
      '',
      'DETALHAMENTO DAS MUDANÇAS',
      '',
      'Aluno,Turma Anterior,Turno Anterior,Ação,Turma Nova,Turno Novo,Empréstimos Ativos',
      ...config.studentActions.map(action => {
        const actionText = {
          'promote': 'Promovido',
          'retain': 'Retido',
          'transfer': 'Transferido',
          'graduate': 'Graduado'
        }[action.action];
        
        return `"${action.studentName}","${action.fromClass}","${action.fromShift}","${actionText}","${action.toClass || '-'}","${action.toShift || '-'}","${action.hasActiveLoans ? 'Sim (' + action.activeLoansCount + ')' : 'Não'}"`;
      })
    ];
    
    // Criar blob e fazer download
    const csvContent = reportLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `virada_ano_${config.fromYear}_para_${config.toYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (error) {
    return (
      <div className={styles.stepContainer}>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 2rem',
            borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '4rem' }}>❌</span>
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#EF4444', marginBottom: '1rem' }}>
            Erro na Virada de Ano
          </h2>
          
          <p style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '2rem' }}>
            {error}
          </p>
          
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '0.875rem 2rem',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Voltar para Configurações
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.stepContainer}>
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        {/* Ícone de Sucesso */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 2rem',
          borderRadius: '50%',
          background: '#D1FAE5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CheckCircleIcon style={{ width: '80px', height: '80px', color: '#10B981' }} />
        </div>
        
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937', marginBottom: '0.5rem' }}>
          Virada de Ano Concluída!
        </h2>
        
        <p style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '3rem' }}>
          A transição de {config.fromYear} para {config.toYear} foi realizada com sucesso
        </p>
        
        {/* Estatísticas */}
        {statistics && (
          <div className={styles.statsGrid} style={{ marginBottom: '3rem' }}>
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <span className={styles.statValue}>{statistics.totalStudents}</span>
              <span className={styles.statLabel}>Total de Alunos</span>
            </div>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <span className={styles.statValue}>{statistics.promoted}</span>
              <span className={styles.statLabel}>Promovidos</span>
            </div>
            <div className={`${styles.statCard} ${styles.statPurple}`}>
              <span className={styles.statValue}>{statistics.retained}</span>
              <span className={styles.statLabel}>Retidos</span>
            </div>
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <span className={styles.statValue}>{statistics.studentsDeleted}</span>
              <span className={styles.statLabel}>Removidos</span>
            </div>
            <div className={`${styles.statCard} ${styles.statGreen}`}>
              <span className={styles.statValue}>{statistics.classesCreated}</span>
              <span className={styles.statLabel}>Turmas Criadas</span>
            </div>
            <div className={`${styles.statCard} ${styles.statPurple}`}>
              <span className={styles.statValue}>{statistics.activeLoansKept}</span>
              <span className={styles.statLabel}>Empréstimos Ativos</span>
            </div>
          </div>
        )}
        
        {/* Informações Importantes */}
        <div className={styles.infoCard} style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <div className={styles.cardHeader}>
            <h3>O que aconteceu:</h3>
          </div>
          <ul style={{ margin: '1rem 0 0 0', paddingLeft: '1.5rem', color: '#4B5563' }}>
            <li>✅ Ano letivo {config.fromYear} foi arquivado</li>
            <li>✅ Ano letivo {config.toYear} foi criado e está ativo</li>
            <li>✅ {statistics?.promoted || 0} alunos foram promovidos para próxima turma</li>
            <li>✅ {statistics?.retained || 0} alunos foram retidos na mesma turma</li>
            <li>✅ {statistics?.studentsDeleted || 0} alunos foram removidos (transferidos/graduados)</li>
            <li>✅ {statistics?.classesCreated || 0} novas turmas foram criadas</li>
            <li>✅ Snapshot do dashboard de {config.fromYear} foi salvo</li>
            <li>✅ Todos os caches foram limpos</li>
          </ul>
        </div>
        
        {/* Ações */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadReport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              background: 'white',
              color: '#3B82F6',
              border: '2px solid #3B82F6',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <DocumentArrowDownIcon style={{ width: '20px', height: '20px' }} />
            Baixar Relatório
          </button>
          
          <button
            onClick={handleGoToDashboard}
            style={{
              padding: '0.875rem 2rem',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6Completion;

