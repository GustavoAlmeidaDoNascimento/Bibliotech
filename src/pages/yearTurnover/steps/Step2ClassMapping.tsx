import React, { useState, useEffect } from 'react';
import { useYearTurnover } from '../../../contexts/YearTurnoverContext';
import { useEducationalLevels } from '../../../contexts/EducationalLevelsContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import styles from './Steps.module.css';

interface NewClass {
  id: string;
  name: string;
  shift: string;
  levelId: string;
}

const Step2ClassMapping: React.FC = () => {
  const { levels } = useEducationalLevels();
  const {
    allClasses,
    config,
    setConfig,
    goToNextStep,
    completeStep
  } = useYearTurnover();
  
  const [newClasses, setNewClasses] = useState<NewClass[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLevelForCreate, setSelectedLevelForCreate] = useState<string>('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassShift, setNewClassShift] = useState('manhã');
  
  // Agrupar turmas antigas por nível
  const oldClassesByLevel = levels.map(level => ({
    level,
    classes: allClasses.filter(c => c.levelId === level.id)
  }));
  
  const handleCreateClass = () => {
    if (!newClassName.trim() || !selectedLevelForCreate) {
      alert('Preencha o nome da turma e selecione um nível');
      return;
    }
    
    const newClass: NewClass = {
      id: `new_${Date.now()}`,
      name: newClassName.trim(),
      shift: newClassShift,
      levelId: selectedLevelForCreate
    };
    
    setNewClasses(prev => [...prev, newClass]);
    setNewClassName('');
    setShowCreateForm(false);
  };
  
  const handleRemoveClass = (id: string) => {
    setNewClasses(prev => prev.filter(c => c.id !== id));
  };
  
  const handleProceed = () => {
    if (newClasses.length === 0) {
      alert('Você precisa criar pelo menos uma turma para o próximo ano');
      return;
    }
    
    // Salvar as novas turmas no config
    setConfig({ newClasses });
    
    completeStep(2);
    goToNextStep();
  };
  
  // Agrupar novas turmas por nível
  const newClassesByLevel = levels.map(level => ({
    level,
    classes: newClasses.filter(c => c.levelId === level.id)
  }));
  
  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>Mapeamento de Turmas</h2>
      <p className={styles.stepDescription}>
        Visualize as turmas antigas e crie as novas turmas para o próximo ano
      </p>
      
      {/* Blueprint - Turmas Antigas */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 className={styles.sectionTitle}>📋 Turmas do Ano Atual ({config.fromYear})</h3>
        <div style={{
          background: '#F9FAFB',
          border: '2px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          {oldClassesByLevel.map(({ level, classes }) => (
            <div key={level.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontWeight: 600,
                fontSize: '1rem',
                color: '#1F2937',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  background: '#3B82F6',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  {level.name}
                </span>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                  ({classes.length} turma{classes.length !== 1 ? 's' : ''})
                </span>
              </div>
              
              {classes.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingLeft: '1rem'
                }}>
                  {classes.map(cls => (
                    <div
                      key={`${cls.className}_${cls.shift}`}
                      style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        color: '#4B5563'
                      }}
                    >
                      {cls.className} - {cls.shift} ({cls.students.length} aluno{cls.students.length !== 1 ? 's' : ''})
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  paddingLeft: '1rem'
                }}>
                  Nenhuma turma neste nível
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Criação de Novas Turmas */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 className={styles.sectionTitle}>✨ Criar Turmas para o Próximo Ano ({config.toYear})</h3>
        
        <div style={{
          background: '#EFF6FF',
          border: '2px solid #3B82F6',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          {newClassesByLevel.map(({ level, classes }) => (
            <div key={level.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    background: '#10B981',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    {level.name}
                  </span>
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                    ({classes.length} turma{classes.length !== 1 ? 's' : ''} criada{classes.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedLevelForCreate(level.id);
                    setShowCreateForm(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Criar Turma
                </button>
              </div>
              
              {classes.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  paddingLeft: '1rem'
                }}>
                  {classes.map(cls => (
                    <div
                      key={cls.id}
                      style={{
                        background: 'white',
                        border: '2px solid #10B981',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#1F2937' }}>
                          {cls.name}
                        </span>
                        <span style={{ color: '#6B7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                          • {cls.shift}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveClass(cls.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#FEE2E2',
                          color: '#EF4444',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{
                  color: '#6B7280',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  paddingLeft: '1rem'
                }}>
                  Nenhuma turma criada ainda. Clique em "Criar Turma" para adicionar.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal de Criação */}
      {showCreateForm && (
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
        onClick={() => setShowCreateForm(false)}
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
            <h3 style={{ marginBottom: '1rem' }}>Criar Nova Turma</h3>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Nível: <strong>{levels.find(l => l.id === selectedLevelForCreate)?.name}</strong>
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Nome da Turma:
              </label>
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Ex: 1º Ano A, 2º Ano B"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Turno:
              </label>
              <select
                value={newClassShift}
                onChange={(e) => setNewClassShift(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              >
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
                <option value="integral">Integral</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowCreateForm(false)}
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
                onClick={handleCreateClass}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Criar Turma
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Resumo */}
      <div style={{
        background: '#F9FAFB',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <strong>Resumo:</strong> {newClasses.length} turma{newClasses.length !== 1 ? 's' : ''} {newClasses.length !== 1 ? 'serão' : 'será'} criada{newClasses.length !== 1 ? 's' : ''} para {config.toYear}
      </div>
      
      {/* Botão de ação */}
      <div className={styles.stepActions}>
        <button
          onClick={handleProceed}
          disabled={newClasses.length === 0}
          className={styles.primaryButton}
        >
          Continuar para Gestão de Alunos
        </button>
      </div>
    </div>
  );
};

export default Step2ClassMapping;
