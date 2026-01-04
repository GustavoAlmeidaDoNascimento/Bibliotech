import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAsync } from '../../hooks/useAsync';
import { feedbackService, Feedback, FeedbackStats } from '../../services/feedbackService';
import { feedbackCampaignService } from '../../services/feedbackCampaignService';
import { formatPlanDisplayName, inferTierFromPlanValue } from '../../services/subscriptionService';
import FeedbackDetailModal from '../../components/feedback/FeedbackDetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, MessageSquare, TrendingUp, LogOut, Filter, Bell } from 'lucide-react';
import styles from './DevDashboard.module.css';

type TabType = 'feedbacks' | 'notifications' | 'campaigns';

const DevDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, authState } = useAuth();
  const { sendUpdateNotificationToAllUsers } = useNotifications();
  const { execute: executeSend, isLoading: isSendingNotification } = useAsync<void>();
  
  const [activeTab, setActiveTab] = useState<TabType>('feedbacks');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<'all' | 'reservation' | 'other'>('all');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  
  // Estados para modal de feedback
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para notificações
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationContent, setNotificationContent] = useState('');
  const [notificationMessage, setNotificationMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Estados para campanhas de feedback
  const [isResettingCampaign, setIsResettingCampaign] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (authState.status === 'loading') {
      return;
    }

    // Verificar se é conta dev
    if (currentUser?.email !== 'dev@bibliotech.tech') {
      navigate('/');
      return;
    }

    loadData();
  }, [currentUser, navigate, filterSource, filterRating, authState.status]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Preparar filtros
      const filters: any = {};
      if (filterSource !== 'all') {
        filters.source = filterSource;
      }
      if (filterRating !== 'all') {
        filters.rating = filterRating;
      }

      // Buscar feedbacks
      const feedbackData = await feedbackService.getFeedbacks(filters);
      setFeedbacks(feedbackData);

      // Buscar estatísticas
      const statsData = await feedbackService.getFeedbackStats(
        filterSource !== 'all' ? filterSource : undefined
      );
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      setNotificationMessage({ text: 'Por favor, preencha todos os campos.', isError: true });
      return;
    }

    try {
      await executeSend(() => sendUpdateNotificationToAllUsers(notificationTitle, notificationContent));
      setNotificationMessage({ text: 'Notificação enviada com sucesso para todos os usuários!', isError: false });
      
      // Limpar formulário após sucesso
      setNotificationTitle('');
      setNotificationContent('');
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => {
        setNotificationMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      setNotificationMessage({ text: 'Erro ao enviar notificação. Tente novamente.', isError: true });
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      setIsDeleting(true);
      await feedbackService.deleteFeedback(feedbackId);
      
      // Atualizar lista de feedbacks
      setFeedbacks(feedbacks.filter(f => f.id !== feedbackId));
      
      // Recarregar estatísticas
      const filters: any = {};
      if (filterSource !== 'all') filters.source = filterSource;
      if (filterRating !== 'all') filters.rating = filterRating;
      const statsData = await feedbackService.getFeedbackStats(
        filterSource !== 'all' ? filterSource : undefined
      );
      setStats(statsData);
      
      // Fechar modal
      setSelectedFeedback(null);
      
      console.log('✅ Feedback deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar feedback:', error);
      alert('Erro ao deletar feedback. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetCampaign = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja iniciar uma nova campanha de feedback?\n\n' +
      'Isso irá resetar o status de feedback de TODOS os alunos do Bibliotech, ' +
      'permitindo que o sistema peça feedback novamente para cada um deles.'
    );
    
    if (!confirmed) return;
    
    try {
      setIsResettingCampaign(true);
      setCampaignMessage(null);
      
      // NOTA: Este é um placeholder. Para implementar totalmente, seria necessário:
      // 1. Criar uma Cloud Function para iterar sobre todos os alunos de todas as escolas
      // 2. Ou implementar um batch job no backend
      // Por enquanto, vou mostrar uma mensagem informativa
      
      setCampaignMessage({
        text: 'Funcionalidade em desenvolvimento. ' +
              'Para resetar todos os alunos, será necessário implementar uma Cloud Function ' +
              'que itere sobre todas as escolas e seus alunos.',
        isError: false
      });
      
      // Limpar mensagem após 10 segundos
      setTimeout(() => {
        setCampaignMessage(null);
      }, 10000);
    } catch (error) {
      console.error('❌ Erro ao resetar campanha:', error);
      setCampaignMessage({
        text: 'Erro ao resetar campanha. Tente novamente.',
        isError: true
      });
    } finally {
      setIsResettingCampaign(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não informada';
    try {
      if (timestamp.toDate) {
        return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      if (typeof timestamp === 'number') {
        return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? styles.starFilled : styles.starEmpty}
            fill={star <= rating ? '#fbbf24' : 'none'}
          />
        ))}
      </div>
    );
  };

  const getPlanBadgeClass = (schoolPlan?: string) => {
    if (!schoolPlan) return styles.schoolPlanDefault;
    
    const tier = inferTierFromPlanValue(schoolPlan);
    
    switch (tier) {
      case 'basic':
        return styles.schoolPlanBasic;
      case 'intermediate':
        return styles.schoolPlanIntermediate;
      case 'advanced':
        return styles.schoolPlanAdvanced;
      default:
        return styles.schoolPlanDefault;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto autentica
  if (authState.status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Painel do Desenvolvedor</h1>
            <p className={styles.subtitle}>Sistema de Feedback e Notificações - Bibliotech</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'feedbacks' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          <MessageSquare size={20} />
          Feedbacks
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notifications' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={20} />
          Notificações
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'campaigns' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <TrendingUp size={20} />
          Campanhas
        </button>
      </div>

      {/* Feedbacks Tab */}
      {activeTab === 'feedbacks' && (
        <>
          {/* Stats Cards */}
          {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <MessageSquare size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total de Feedbacks</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <TrendingUp size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Média de Avaliação</p>
              <p className={styles.statValue}>{stats.averageRating.toFixed(2)}</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className={styles.statCardWide}>
            <p className={styles.statLabel}>Distribuição de Notas</p>
            <div className={styles.distributionGrid}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className={styles.distributionItem}>
                  <div className={styles.distributionLabel}>
                    {rating} <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  </div>
                  <div className={styles.distributionBar}>
                    <div
                      className={styles.distributionFill}
                      style={{
                        width: stats.total > 0
                          ? `${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.total) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <div className={styles.distributionCount}>
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersHeader}>
          <Filter size={20} />
          <span>Filtros</span>
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Origem:</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">Todas</option>
              <option value="reservation">Reservas</option>
              <option value="other">Outras</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Nota:</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className={styles.filterSelect}
            >
              <option value="all">Todas</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedbacks List */}
      <div className={styles.feedbacksSection}>
        <h2 className={styles.sectionTitle}>
          Feedbacks Recentes ({feedbacks.length})
        </h2>

        {feedbacks.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} />
            <p>Nenhum feedback encontrado</p>
          </div>
        ) : (
          <div className={styles.feedbacksList}>
            {feedbacks.map((feedback) => (
              <div 
                key={feedback.id} 
                className={styles.feedbackCard}
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className={styles.feedbackHeader}>
                  <div className={styles.feedbackMeta}>
                    <span className={styles.feedbackSource}>
                      {feedback.source === 'reservation' ? 'Reserva' : 'Outro'}
                    </span>
                    {feedback.metadata?.bookTitle && (
                      <span className={styles.feedbackBook}>
                        {feedback.metadata.bookTitle}
                      </span>
                    )}
                  </div>
                  {renderStars(feedback.rating)}
                </div>

                {feedback.comment && (
                  <p className={styles.feedbackComment}>{feedback.comment}</p>
                )}

                <div className={styles.feedbackFooter}>
                  <div className={styles.feedbackInfo}>
                    <span className={styles.feedbackDate}>
                      {formatDate(feedback.createdAt)}
                    </span>
                    <span className={styles.feedbackStudent}>
                      Aluno: {feedback.studentName}
                    </span>
                  </div>
                  <div className={styles.feedbackSchool}>
                    <span className={styles.schoolName}>
                      {feedback.schoolName}
                    </span>
                    {feedback.schoolPlan && (
                      <span className={`${styles.schoolPlan} ${getPlanBadgeClass(feedback.schoolPlan)}`}>
                        {formatPlanDisplayName(feedback.schoolPlan)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className={styles.notificationsSection}>
          <div className={styles.notificationsCard}>
            <h2 className={styles.sectionTitle}>Criar Notificação de Atualização</h2>
            <p className={styles.notificationSubtitle}>
              Esta notificação será enviada para todos os usuários do sistema.
            </p>

            {notificationMessage && (
              <div className={notificationMessage.isError ? styles.errorMessage : styles.successMessage}>
                {notificationMessage.text}
              </div>
            )}

            <form onSubmit={handleSendNotification} className={styles.notificationForm}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Título da Notificação *</label>
                <input
                  type="text"
                  id="title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Ex: Nova atualização disponível!"
                  maxLength={100}
                  required
                  disabled={isSendingNotification}
                  className={styles.input}
                />
                <span className={styles.charCount}>{notificationTitle.length}/100</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="content">Conteúdo da Notificação *</label>
                <textarea
                  id="content"
                  value={notificationContent}
                  onChange={(e) => setNotificationContent(e.target.value)}
                  placeholder="Descreva as novidades e melhorias incluídas nesta atualização..."
                  rows={8}
                  maxLength={2000}
                  required
                  disabled={isSendingNotification}
                  className={styles.textarea}
                />
                <span className={styles.charCount}>{notificationContent.length}/2000</span>
              </div>

              <div className={styles.preview}>
                <h4>Pré-visualização:</h4>
                <div className={styles.previewBox}>
                  <div className={styles.previewTitle}>
                    {notificationTitle || 'Título da notificação aparecerá aqui'}
                  </div>
                  <div className={styles.previewContent}>
                    {notificationContent || 'Conteúdo da notificação aparecerá aqui'}
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSendingNotification || !notificationTitle.trim() || !notificationContent.trim()}
              >
                {isSendingNotification ? 'Enviando...' : 'Notificar Todos os Usuários'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className={styles.campaignsSection}>
          <div className={styles.campaignsCard}>
            <h2 className={styles.sectionTitle}>Gerenciar Campanhas de Feedback</h2>
            <p className={styles.campaignSubtitle}>
              Controle quando o sistema deve pedir feedback aos alunos.
            </p>

            <div className={styles.campaignInfo}>
              <div className={styles.infoBox}>
                <h3>📊 Como Funciona</h3>
                <ul>
                  <li>Cada aluno é perguntado <strong>apenas uma vez por campanha</strong></li>
                  <li>Após responder, o aluno <strong>não é mais perguntado</strong> nesta campanha</li>
                  <li>Se não responder, o sistema aguarda <strong>7 dias</strong> antes de perguntar novamente</li>
                  <li>Inicie uma nova campanha para <strong>resetar todos os alunos</strong></li>
                </ul>
              </div>

              <div className={styles.infoBox}>
                <h3>🎯 Quando Usar</h3>
                <ul>
                  <li><strong>Nova Feature:</strong> Após lançar uma atualização importante</li>
                  <li><strong>Período de Avaliação:</strong> Para coletar feedback em épocas específicas</li>
                  <li><strong>Pesquisa de Satisfação:</strong> Campanhas periódicas (mensal/trimestral)</li>
                </ul>
              </div>
            </div>

            {campaignMessage && (
              <div className={campaignMessage.isError ? styles.errorMessage : styles.successMessage}>
                {campaignMessage.text}
              </div>
            )}

            <div className={styles.campaignActions}>
              <button
                onClick={handleResetCampaign}
                className={styles.resetCampaignButton}
                disabled={isResettingCampaign}
              >
                <TrendingUp size={20} />
                {isResettingCampaign ? 'Resetando...' : 'Iniciar Nova Campanha'}
              </button>
              
              <div className={styles.warningBox}>
                <strong>⚠️ Atenção:</strong> Esta ação irá permitir que o sistema peça feedback
                novamente para todos os alunos que já responderam em campanhas anteriores.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onDelete={handleDeleteFeedback}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default DevDashboard;

