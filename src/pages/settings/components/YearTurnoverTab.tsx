import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { yearTurnoverService } from '../../../services/yearTurnoverService';
import { academicYearService } from '../../../services/academicYearService';
import { YearTurnoverHistory, AcademicYear } from '../../../types/yearTurnover';
import { ArrowRightIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import styles from '../Settings.module.css';

const YearTurnoverTab: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<YearTurnoverHistory[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingYear, setCreatingYear] = useState(false);
  
  // Ano atual do sistema
  const currentYear = new Date().getFullYear().toString();
  const nextYear = (new Date().getFullYear() + 1).toString();
  
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);
  
  const loadData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Buscar ano letivo ativo
      const year = await academicYearService.getActiveYear(currentUser.uid);
      setActiveYear(year);
      
      // Buscar histórico em background
      yearTurnoverService.getTurnoverHistory(currentUser.uid)
        .then(setHistory)
        .catch(console.error);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateFirstYear = async () => {
    if (!currentUser) return;
    
    try {
      setCreatingYear(true);
      const newYear = await academicYearService.createYear(currentUser.uid, currentYear);
      setActiveYear(newYear);
    } catch (error) {
      console.error('Erro ao criar ano letivo:', error);
      alert('Erro ao criar ano letivo. Tente novamente.');
    } finally {
      setCreatingYear(false);
    }
  };
  
  const handleStartTurnover = () => {
    navigate('/year-turnover');
  };
  
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Gerenciar Virada de Ano Letivo</h3>
        <p className={styles.sectionDescription}>
          Gerencie a transição de dados entre anos letivos de forma segura e organizada.
        </p>
        
        {/* Tutorial em Vídeo */}
        <div style={{
          marginBottom: '2rem',
          background: '#F9FAFB',
          border: '2px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.125rem', 
            fontWeight: 600,
            color: '#1F2937'
          }}>
            Aprenda a fazer o processo de virada da escola!
          </h4>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            background: '#000'
          }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              src="https://www.youtube.com/embed/PFYED2sJ9us"
              title="Tutorial de Virada de Ano Letivo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        
        {/* Status do Ano Atual */}
        <div style={{
          background: '#F9FAFB',
          border: '2px solid #E5E7EB',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
            Ano Letivo Atual
          </h4>
          
          {loading ? (
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Carregando...</p>
          ) : activeYear ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#3B82F6' }}>
                  {activeYear.year}
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: '#10B981',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  Ativo
                </span>
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                Próximo ano: {nextYear}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Nenhum ano letivo ativo encontrado
              </p>
              <button
                onClick={handleCreateFirstYear}
                disabled={creatingYear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: creatingYear ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: creatingYear ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!creatingYear) {
                    e.currentTarget.style.background = '#2563EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creatingYear) {
                    e.currentTarget.style.background = '#3B82F6';
                  }
                }}
              >
                <PlusIcon style={{ width: '18px', height: '18px' }} />
                {creatingYear ? 'Criando...' : `Criar Ano Letivo ${currentYear}`}
              </button>
            </div>
          )}
        </div>
        
        {/* Botão Iniciar Virada */}
        <button
          onClick={handleStartTurnover}
          disabled={!activeYear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            background: activeYear ? '#3B82F6' : '#9CA3AF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: activeYear ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            marginBottom: '2rem'
          }}
          onMouseEnter={(e) => {
            if (activeYear) {
              e.currentTarget.style.background = '#2563EB';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeYear) {
              e.currentTarget.style.background = '#3B82F6';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <ArrowRightIcon style={{ width: '20px', height: '20px' }} />
          Iniciar Virada de Ano
        </button>
        
        {!activeYear && (
          <p style={{ 
            color: '#6B7280', 
            fontSize: '0.875rem', 
            marginTop: '-1.5rem',
            marginBottom: '2rem',
            fontStyle: 'italic'
          }}>
            Você precisa criar um ano letivo antes de iniciar a virada
          </p>
        )}
        
        {/* Histórico */}
        {history.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
              Histórico de Viradas
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ClockIcon style={{ width: '24px', height: '24px', color: '#6B7280' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1F2937' }}>
                        {item.fromYear} → {item.toYear}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        {new Date(item.executedAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(item.executedAt).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: item.status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                      color: item.status === 'completed' ? '#065F46' : '#991B1B',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {item.status === 'completed' ? 'Concluída' : 
                     item.status === 'in_progress' ? 'Em Andamento' :
                     item.status === 'failed' ? 'Falhou' : 'Cancelada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Informações Importantes */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#EFF6FF',
          border: '2px solid #3B82F6',
          borderRadius: '12px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E40AF', fontSize: '1rem', fontWeight: 600 }}>
            ℹ️ Informações Importantes
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1E3A8A', fontSize: '0.875rem' }}>
            <li><strong>Antes de iniciar:</strong> É crucial ter todas as informações atualizadas de todas as turmas e alunos da escola. Recomendamos consultar os relatórios do sistema para verificar que todos os dados estão completos e organizados, incluindo as informações sobre as turmas e alunos que farão parte do novo ano letivo</li>
            <li>A virada de ano é um processo guiado passo a passo</li>
            <li>Você terá controle total sobre o destino de cada aluno e turma</li>
            <li>Um snapshot completo do dashboard será criado para preservar os dados do ano anterior</li>
            <li>Alunos graduados e transferidos serão removidos do sistema, mas seus empréstimos ativos permanecerão rastreáveis</li>
            <li>Este processo não pode ser desfeito após a execução</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default YearTurnoverTab;

