import React, { useState, useEffect } from 'react';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { useEducationalLevels } from '../../../contexts/EducationalLevelsContext';
import { StudentAction } from '../../../types/yearTurnover';
import { ExclamationTriangleIcon, UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import styles from './Steps.module.css';

const Step3StudentManagement: React.FC = () => {
  const { levels } = useEducationalLevels();
  const {
    allStudents,
    allClasses,
    config,
    setStudentAction,
    setBulkStudentActions,
    goToNextStep,
    completeStep
  } = useYearTurnover();
  
  const [studentActions, setStudentActionsLocal] = useState<StudentAction[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalAction, setModalAction] = useState<'promote' | 'retain' | 'transfer' | 'graduate'>('promote');
  const [selectedTargetClass, setSelectedTargetClass] = useState<string>('');
  
  useEffect(() => {
    // Inicializar ações vazias (todas pendentes)
    const defaultActions = allStudents.map(student => ({
      ...student,
      action: '' as any, // Sem ação definida ainda
      toClass: '',
      toShift: '',
      toLevelId: ''
    }));
    
    setStudentActionsLocal(defaultActions);
  }, [allStudents]);
  
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    const filtered = getFilteredStudents();
    if (selectedStudents.size === filtered.length && filtered.length > 0) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filtered.map(s => s.studentId)));
    }
  };
  
  const handleOpenActionModal = (action: 'promote' | 'retain' | 'transfer' | 'graduate') => {
    if (selectedStudents.size === 0) {
      alert('Selecione pelo menos um aluno');
      return;
    }
    
    setModalAction(action);
    setSelectedTargetClass('');
    setShowActionModal(true);
  };
  
  const handleApplyAction = () => {
    if (selectedStudents.size === 0) return;
    
    // Para promover/reter, precisa escolher turma
    if ((modalAction === 'promote' || modalAction === 'retain') && !selectedTargetClass) {
      alert('Selecione uma turma de destino');
      return;
    }
    
    // Verificar empréstimos ativos para transfer/graduate
    const studentsWithLoans = studentActions.filter(s => 
      selectedStudents.has(s.studentId) && 
      s.hasActiveLoans &&
      (modalAction === 'transfer' || modalAction === 'graduate')
    );
    
    if (studentsWithLoans.length > 0) {
      const totalLoans = studentsWithLoans.reduce((sum, s) => sum + s.activeLoansCount, 0);
      const confirmMsg = `${studentsWithLoans.length} aluno(s) selecionado(s) possui(em) ${totalLoans} empréstimo(s) ativo(s). Se prosseguir, os empréstimos continuarão ativos até serem devolvidos ou cancelados, mas os alunos serão removidos do sistema. Deseja continuar?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    // Buscar dados da turma selecionada
    let targetClass = '';
    let targetShift = '';
    let targetLevelId = '';
    
    if (selectedTargetClass && config.newClasses) {
      const selectedClass = config.newClasses.find(c => c.id === selectedTargetClass);
      if (selectedClass) {
        targetClass = selectedClass.name;
        targetShift = selectedClass.shift;
        targetLevelId = selectedClass.levelId;
      }
    }
    
    const updatedActions = studentActions.map(action => {
      if (selectedStudents.has(action.studentId)) {
        return {
          ...action,
          action: modalAction,
          toClass: targetClass,
          toShift: targetShift,
          toLevelId: targetLevelId
        };
      }
      return action;
    });
    
    setStudentActionsLocal(updatedActions);
    setBulkStudentActions(updatedActions);
    setSelectedStudents(new Set());
    setShowActionModal(false);
  };
  
  const getFilteredStudents = () => {
    if (selectedLevel === 'all') {
      return studentActions;
    }
    
    // Filtrar por nível educacional
    return studentActions.filter(s => {
      const studentClass = allClasses.find(
        c => c.className === s.fromClass && c.shift === s.fromShift
      );
      return studentClass?.levelId === selectedLevel;
    });
  };
  
  const handleProceed = () => {
    // Verificar se todos os alunos têm ação definida
    const pending = studentActions.filter(s => !s.action);
    
    if (pending.length > 0) {
      alert(`Ainda há ${pending.length} aluno(s) sem ação definida. Você precisa definir o que acontecerá com TODOS os alunos.`);
      return;
    }
    
    completeStep(3);
    goToNextStep();
  };
  
  const filteredStudents = getFilteredStudents();
  const allSelected = selectedStudents.size === filteredStudents.length && filteredStudents.length > 0;
  
  // Determinar o último nível educacional (baseado na ordem)
  const lastLevel = levels.length > 0 ? levels[levels.length - 1] : null;
  
  // Verificar se todos os alunos selecionados estão no último nível
  const selectedStudentsInLastLevel = Array.from(selectedStudents).every(studentId => {
    const student = studentActions.find(s => s.studentId === studentId);
    if (!student) return false;
    
    const studentClass = allClasses.find(
        c => c.className === student.fromClass && c.shift === student.fromShift
      );
      
    return studentClass?.levelId === lastLevel?.id;
  });
  
  const canGraduate = selectedStudents.size > 0 && selectedStudentsInLastLevel;
  
  // Estatísticas
  const stats = {
    total: studentActions.length,
    pending: studentActions.filter(s => !s.action).length,
    promote: studentActions.filter(s => s.action === 'promote').length,
    retain: studentActions.filter(s => s.action === 'retain').length,
    transfer: studentActions.filter(s => s.action === 'transfer').length,
    graduate: studentActions.filter(s => s.action === 'graduate').length
  };
  
  // Níveis únicos para filtro (dos alunos atuais)
  const uniqueLevels = Array.from(
    new Set(allClasses.map(c => c.levelId).filter(Boolean))
  ).map(levelId => {
    const level = levels.find(l => l.id === levelId);
    const studentsInLevel = studentActions.filter(s => {
      const studentClass = allClasses.find(
        c => c.className === s.fromClass && c.shift === s.fromShift
      );
      return studentClass?.levelId === levelId;
    });
    
    return {
      id: levelId,
      name: level?.name || 'Sem nível',
      count: studentsInLevel.length
    };
  });
  
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Gestão de Alunos</h2>
      <p className={styles.stepDescription}>
        Defina o que acontecerá com cada aluno na virada de ano
      </p>
      
      {/* Contador de Pendentes */}
      <div style={{
        background: stats.pending > 0 ? '#FEF3C7' : '#D1FAE5',
        border: `2px solid ${stats.pending > 0 ? '#F59E0B' : '#10B981'}`,
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {stats.pending > 0 ? (
          <>
            <ExclamationTriangleIcon style={{ width: '24px', height: '24px', color: '#F59E0B' }} />
            <div>
              <strong style={{ color: '#92400E' }}>
                {stats.pending} aluno{stats.pending !== 1 ? 's' : ''} pendente{stats.pending !== 1 ? 's' : ''}
              </strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#78350F' }}>
                Você precisa definir o que acontecerá com todos os alunos
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircleIcon style={{ width: '24px', height: '24px', color: '#10B981' }} />
            <div>
              <strong style={{ color: '#065F46' }}>
                Todos os alunos foram processados!
              </strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#047857' }}>
                Você pode continuar para a próxima etapa
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Estatísticas */}
      <div className={styles.statsGrid} style={{ marginBottom: '2rem' }}>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statValue}>{stats.promote}</span>
          <span className={styles.statLabel}>Promover</span>
        </div>
        <div className={`${styles.statCard} ${styles.statPurple}`}>
          <span className={styles.statValue}>{stats.retain}</span>
          <span className={styles.statLabel}>Reter</span>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <span className={styles.statValue}>{stats.transfer}</span>
          <span className={styles.statLabel}>Transferir</span>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statValue}>{stats.graduate}</span>
          <span className={styles.statLabel}>Graduar</span>
        </div>
      </div>
      
      {/* Filtro por Nível + Ações em Massa */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '1rem',
            flex: 1,
            minWidth: '200px'
          }}
        >
          <option value="all">Todos os Níveis ({stats.total} alunos)</option>
          {uniqueLevels.map(level => (
            <option key={level.id} value={level.id}>
              {level.name} ({level.count} alunos)
            </option>
          ))}
        </select>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenActionModal('promote')}
            disabled={selectedStudents.size === 0}
            style={{
              padding: '0.75rem 1.25rem',
              background: selectedStudents.size > 0 ? '#3B82F6' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Promover
          </button>
          
          <button
            onClick={() => handleOpenActionModal('retain')}
            disabled={selectedStudents.size === 0}
            style={{
              padding: '0.75rem 1.25rem',
              background: selectedStudents.size > 0 ? '#8B5CF6' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Reter
          </button>
          
          <button
            onClick={() => handleOpenActionModal('transfer')}
            disabled={selectedStudents.size === 0}
            style={{
              padding: '0.75rem 1.25rem',
              background: selectedStudents.size > 0 ? '#F59E0B' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: selectedStudents.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Transferir
          </button>
          
          <button
            onClick={() => handleOpenActionModal('graduate')}
            disabled={!canGraduate}
            title={!canGraduate && selectedStudents.size > 0 ? `Apenas alunos do último nível (${lastLevel?.name}) podem ser graduados` : ''}
            style={{
              padding: '0.75rem 1.25rem',
              background: canGraduate ? '#10B981' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: canGraduate ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Graduar
          </button>
        </div>
      </div>
      
      {/* Modal de Ação */}
      {showActionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowActionModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>
              {modalAction === 'promote' && 'Promover Alunos'}
              {modalAction === 'retain' && 'Reter Alunos'}
              {modalAction === 'transfer' && 'Transferir Alunos'}
              {modalAction === 'graduate' && 'Graduar Alunos'}
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Aplicar ação para {selectedStudents.size} aluno(s) selecionado(s)
            </p>
            
            {(modalAction === 'promote' || modalAction === 'retain') && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Selecione a turma de destino:
                </label>
                <select
                  value={selectedTargetClass}
                  onChange={(e) => setSelectedTargetClass(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione uma turma...</option>
                  {levels.map(level => {
                    const classesInLevel = config.newClasses?.filter(c => c.levelId === level.id) || [];
                    if (classesInLevel.length === 0) return null;
                    
                    return (
                      <optgroup key={level.id} label={level.name}>
                        {classesInLevel.map(cls => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.shift}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            )}
            
            {(modalAction === 'transfer' || modalAction === 'graduate') && (
              <div style={{
                padding: '1rem',
                background: '#FEF3C7',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <strong style={{ color: '#92400E', fontSize: '0.875rem' }}>
                  ⚠️ Atenção:
                </strong>
                <p style={{ color: '#78350F', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                  Os alunos serão REMOVIDOS do sistema. Empréstimos ativos continuarão rastreáveis até resolução.
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowActionModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'white',
                  color: '#3B82F6',
                  border: '2px solid #3B82F6',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyAction}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de Alunos */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: '#F9FAFB',
          borderRadius: '8px'
        }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, color: '#1F2937' }}>
            Selecionar todos ({filteredStudents.length})
          </span>
        </div>
        
        {filteredStudents.map((student) => {
          const isSelected = selectedStudents.has(student.studentId);
          const hasAction = !!student.action;
          
          return (
            <div
              key={student.studentId}
              style={{
                background: 'white',
                border: `2px solid ${isSelected ? '#3B82F6' : hasAction ? '#10B981' : '#E5E7EB'}`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectStudent(student.studentId)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '4px' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <UserIcon style={{ width: '20px', height: '20px', color: '#6B7280' }} />
                    <span style={{ fontWeight: 600, fontSize: '1.125rem', color: '#1F2937' }}>
                      {student.studentName}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    {student.fromClass} - {student.fromShift}
                  </div>
                  
                  {student.hasActiveLoans && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      padding: '0.5rem',
                      background: '#FEF3C7',
                      borderRadius: '6px',
                      width: 'fit-content'
                    }}>
                      <ExclamationTriangleIcon style={{ width: '16px', height: '16px', color: '#92400E' }} />
                      <span style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 500 }}>
                        {student.activeLoansCount} empréstimo(s) ativo(s)
                      </span>
                    </div>
                  )}
                  
                  {/* Status da Ação */}
                  {hasAction ? (
                    <div style={{
                      padding: '0.75rem',
                      background: '#EFF6FF',
                      borderRadius: '8px',
                      border: '1px solid #3B82F6'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#1E40AF', fontWeight: 600 }}>
                        {student.action === 'promote' && `✓ Será promovido para: ${student.toClass} - ${student.toShift}`}
                        {student.action === 'retain' && `✓ Será retido em: ${student.toClass} - ${student.toShift}`}
                        {student.action === 'transfer' && '✓ Será transferido (removido do sistema)'}
                        {student.action === 'graduate' && '✓ Será graduado (removido do sistema)'}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#FEF3C7',
                      borderRadius: '8px',
                      border: '1px solid #F59E0B'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#92400E', fontWeight: 600 }}>
                        ⏳ Ação pendente - Selecione e escolha uma ação
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Botão de ação */}
      <div className={styles.stepActions}>
        <button
          onClick={handleProceed}
          disabled={stats.pending > 0}
          className={styles.primaryButton}
        >
          Continuar para Revisão
        </button>
      </div>
    </div>
  );
};

export default Step3StudentManagement;
