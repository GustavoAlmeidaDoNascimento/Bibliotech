import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { settingsService } from '../../services/firebase';
import { useSettings } from '../../contexts/SettingsContext';
import { useNotifications, Notification } from '../../contexts/NotificationsContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { reservationService } from '../../services/reservationService';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BellIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  EllipsisVerticalIcon,
  MegaphoneIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from '../../constants';
import styles from './Layout.module.css';
import DummyContentGenerator from '../DummyContentGenerator/DummyContentGenerator';

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [reservationsCount, setReservationsCount] = useState<number>(0);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDummyGeneratorOpen, setIsDummyGeneratorOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarExpanded');
    return stored !== null ? stored === 'true' : true;
  });
  const [openSection, setOpenSection] = useState<string>('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { notifications, unreadCount, markAllAsRead, markAsRead, markAsUnread, deleteNotification, loading, isEnabled } = useNotifications();

  // Fechar dropdown quando a aba de notificações fechar
  useEffect(() => {
    if (!isNotificationsOpen) {
      setOpenDropdownId(null);
    }
  }, [isNotificationsOpen]);

  // Listener para atalho Ctrl+7 para abrir gerador de dummy content
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+7 ou Ctrl+& (7 no teclado numérico)
      if ((event.ctrlKey || event.metaKey) && event.key === '7') {
        event.preventDefault();
        setIsDummyGeneratorOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Buscar contador de reservas
  useEffect(() => {
    const fetchReservationsCount = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const reservations = await reservationService.getReservations(currentUser.uid);
        // Contar apenas reservas ativas (pending, ready)
        const activeReservations = reservations.filter(
          r => r.status === 'pending' || r.status === 'ready'
        );
        setReservationsCount(activeReservations.length);
      } catch (error) {
        console.error('Erro ao buscar contador de reservas:', error);
        setReservationsCount(0);
      }
    };

    fetchReservationsCount();
    
    // Atualizar contador quando a rota mudar para /reservations (após criar/deletar reservas)
    const interval = setInterval(fetchReservationsCount, 30000); // Atualizar a cada 30 segundos
    
    return () => clearInterval(interval);
  }, [currentUser?.uid, location.pathname]);

  // verifica se o link atual corresponde à página atual
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  // fecha menu ao navegar (mobile)
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/books') return 'Acervo';
    if (pathname.startsWith('/books/')) return 'Detalhes do Livro';
    if (pathname === '/student-loans') return 'Locações de Alunos';
    if (pathname === '/staff-loans') return 'Locações de Professores';
    if (pathname === '/students') return 'Alunos';
    if (pathname.startsWith('/students/')) return 'Perfil do Aluno';
    if (pathname === '/staff') return 'Professores e Funcionários';
    if (pathname.startsWith('/staff/')) return 'Perfil do Funcionário';
    if (pathname === '/classes') return 'Turmas';
    if (pathname === '/student-withdrawals') return 'Retirada — Alunos';
    if (pathname === '/staff-withdrawals') return 'Retirada — Professores';
    if (pathname === '/reservations') return 'Reservas';
    if (pathname === ROUTES.SETTINGS) return 'Configurações da Biblioteca';
    if (pathname === ROUTES.CATALOG) return 'Catálogo Online';
    return '';
  };

  const getSectionFromRoute = (pathname: string): string => {
    if (['/student-loans', '/staff-loans'].some(p => pathname === p || pathname.startsWith(p + '/'))) return 'locacoes';
    if (['/students', '/staff'].some(p => pathname === p || pathname.startsWith(p + '/'))) return 'cadastros';
    if (['/student-withdrawals', '/staff-withdrawals'].some(p => pathname === p || pathname.startsWith(p + '/'))) return 'retirar';
    if ([ROUTES.SETTINGS, ROUTES.CATALOG].some(p => pathname === p || pathname.startsWith(p + '/'))) return 'configuracoes';
    return '';
  };

  useEffect(() => {
    setOpenSection(getSectionFromRoute(location.pathname));
  }, [location.pathname]);

  const toggleSidebar = () => {
    const newValue = !isSidebarExpanded;
    setIsSidebarExpanded(newValue);
    localStorage.setItem('sidebarExpanded', String(newValue));
  };

  const toggleSection = (sectionId: string) => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true);
      localStorage.setItem('sidebarExpanded', 'true');
      setOpenSection(sectionId);
    } else {
      setOpenSection(prev => prev === sectionId ? '' : sectionId);
    }
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min atrás`;
    } else if (diffInMinutes < 1440) { // 24 horas
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
  };

  const handleBackdropClick = () => {
    setIsNotificationsOpen(false);
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const truncateText = (text: string, maxLength: number = 120): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida apenas quando clicar na notificação
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Verificar o tipo de notificação para navegação apropriada
    if (notification.type === 'update') {
      // Para notificações de atualização, abrir modal
      setSelectedNotification(notification);
    } else if (notification.type === 'reservation' && notification.reservationId) {
      // Para notificações de reserva, navegar para detalhes da reserva específica
      navigate(`/reservation-detail/${notification.reservationId}`);
      setIsNotificationsOpen(false);
    } else if (notification.loanId) {
      // Para notificações de empréstimo, navegar para detalhes
      navigate(`/student-loan-detail/${notification.loanId}`);
      setIsNotificationsOpen(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsRead(notificationId);
    setOpenDropdownId(null);
  };

  const handleMarkAsUnread = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsUnread(notificationId);
    setOpenDropdownId(null);
  };

  const handleDropdownToggle = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === notificationId ? null : notificationId);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest(`[data-dropdown-id="${openDropdownId}"]`)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const closeNotificationModal = () => {
    setSelectedNotification(null);
    setIsNotificationsOpen(false);
  };

  // Função para buscar dados do aluno
  const getStudentData = async (studentId: string) => {
    if (!currentUser || !studentId) return null;
    
    try {
      const studentRef = doc(db, `users/${currentUser.uid}/students`, studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        return studentDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do aluno:', error);
      return null;
    }
  };

  const generateWhatsAppMessageFromNotification = async (notification: Notification) => {
    if (notification.type === 'update') return '';
    
    const daysOverdue = notification.daysOverdue || 0;
    
    // Buscar data de retirada do empréstimo
    let borrowDateText = '';
    if (notification.loanId && currentUser) {
      try {
        const loanRef = doc(db, `users/${currentUser.uid}/loans`, notification.loanId);
        const loanDoc = await getDoc(loanRef);
        
        if (loanDoc.exists()) {
          const loanData = loanDoc.data();
          const borrowDate = loanData.borrowDate?.toDate ? loanData.borrowDate.toDate() : new Date(loanData.borrowDate);
          borrowDateText = borrowDate.toLocaleDateString('pt-BR');
        }
      } catch (error) {
        console.error('Erro ao buscar data de retirada:', error);
      }
    }
    
    // Verificar se deve usar formato para responsáveis
    if (settings.useGuardianContact) {
      const message = `*Lembrete de Devolucao - ${settings.schoolName}*

Prezado(a) responsavel,

O(a) aluno(a) *${notification.studentName}* retirou o livro "*${notification.bookTitle}*" da biblioteca ${borrowDateText ? `no dia ${borrowDateText}` : ''}.

${daysOverdue > 0 ? `O prazo de devolucao ja passou ha ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}.` : 'O prazo de devolucao esta se aproximando.'}

Por favor, lembre o(a) aluno(a) de retornar o livro a biblioteca da escola.

*${settings.schoolName}*
*Feito atraves do Bibliotech*`;

      return message;
    }
    
    // Formato original para contato direto com o aluno
    let statusMessage = '';
    if (daysOverdue > 0) {
      statusMessage = `*Status:* Atrasado ha ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}`;
    } else {
      statusMessage = `*Status:* Prazo de devolucao proximo`;
    }
    
    const message = `*LEMBRETE DE DEVOLUCAO - BIBLIOTECH*

*Aluno:* ${notification.studentName}
*Livro:* ${notification.bookTitle}
${borrowDateText ? `\n*Data de Retirada:* ${borrowDateText}` : ''}

${statusMessage}

${daysOverdue > 0 ? 'Por favor, retornar a biblioteca.' : 'Lembre-se de devolver o livro no prazo.'}

Voce pode acessar suas metricas pelo link: https://bibliotech.tech/student-dashboard/${notification.studentId}

*Biblioteca Escolar*
*Feito atraves do Bibliotech*`;

    return message;
  };

  const handleWhatsAppNotificationFromNotification = async (notification: Notification) => {
    if (!notification.studentId) {
      alert('ID do aluno não encontrado na notificação');
      return;
    }

    try {
      // Buscar dados do aluno para obter o número de telefone
      const studentData = await getStudentData(notification.studentId);
      
      if (!studentData) {
        alert('Dados do aluno não encontrados');
        return;
      }

      // Verificar se o aluno tem número de telefone
      const phoneNumber = studentData.contact || studentData.number;
      
      if (!phoneNumber) {
        alert('Número de telefone não encontrado para este aluno');
        return;
      }

      // Limpar número de telefone (remover caracteres não numéricos)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      if (cleanPhoneNumber.length < 10) {
        alert('Número de telefone inválido');
        return;
      }

      // Gerar mensagem
      const message = await generateWhatsAppMessageFromNotification(notification);
      const encodedMessage = encodeURIComponent(message);
      
      // Adicionar código do país (55 para Brasil) se não estiver presente
      const fullPhoneNumber = cleanPhoneNumber.startsWith('55') 
        ? cleanPhoneNumber 
        : `55${cleanPhoneNumber}`;
      
      // Abrir WhatsApp com número específico do aluno
      const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
      alert('Erro ao tentar enviar mensagem pelo WhatsApp');
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    if (notification.type === 'update') {
      return (
        <>
          <div className={styles.notificationTitle}>
            <MegaphoneIcon className={styles.notificationIcon} />
            {notification.title}
          </div>
          <div className={styles.notificationMessage}>
            {truncateText(notification.message)}
          </div>
          <div className={styles.notificationMeta}>
            <span className={styles.notificationTime}>
              {formatNotificationTime(notification.createdAt)}
            </span>
            <span className={`${styles.notificationBadgeType} ${styles.update}`}>
              Atualização
            </span>
          </div>
        </>
      );
    }
    
    if (notification.type === 'reservation') {
      return (
        <>
          <div className={styles.notificationTitle}>
            <CalendarDaysIcon className={styles.notificationIcon} />
            {notification.title}
          </div>
          <div className={styles.notificationMessage}>
            {truncateText(notification.message)}
          </div>
          <div className={styles.notificationMeta}>
            <span className={styles.notificationTime}>
              {formatNotificationTime(notification.createdAt)}
            </span>
            <span className={`${styles.notificationBadgeType} ${styles.reservation}`}>
              Reserva
            </span>
          </div>
        </>
      );
    }
    
    // Renderização para notificações de empréstimo
    return (
      <>
        <div className={styles.notificationTitle}>
          <span 
            style={{
              cursor: 'pointer',
              color: '#1e3a8a',
              borderBottom: '1px dotted #1e3a8a',
              transition: 'all 0.2s ease',
              fontWeight: 'bold'
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/students/${notification.studentId}`);
              setIsNotificationsOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.borderBottomStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#1e3a8a';
              e.currentTarget.style.borderBottomStyle = 'dotted';
            }}
            title={`Ir para o perfil de ${notification.studentName}`}
          >
            Aluno(a) {notification.studentName}
          </span>
          {` está com a devolução do livro "${notification.bookTitle}" atrasada!`}
        </div>
        <div className={styles.notificationMessage}>
          {notification.message}
        </div>
        <div className={styles.notificationMeta}>
          <span className={styles.notificationTime}>
            {formatNotificationTime(notification.createdAt)}
          </span>
          <span className={`${styles.notificationBadgeType} ${styles[notification.type]}`}>
            {notification.daysOverdue} dia(s) de atraso
          </span>
        </div>
        <div className={styles.notificationActions}>
          <button 
            className={styles.whatsappNotificationButton}
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsAppNotificationFromNotification(notification);
            }}
            title="Enviar lembrete por WhatsApp"
          >
            WhatsApp
          </button>
        </div>
      </>
    );
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {/* Seção alinhada com o sidebar */}
        <div className={styles.headerSidebar}>
          <button
            className={styles.sidebarToggleBtn}
            onClick={toggleSidebar}
            title={isSidebarExpanded ? 'Recolher menu' : 'Expandir menu'}
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="1.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="1.5" y="1.5" width="5.5" height="15" rx="2.5" fill="currentColor"/>
              <line x1="7" y1="1.5" x2="7" y2="16.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        {/* Conteúdo principal do header */}
        <div className={styles.headerMain}>
          <Link to="/dashboard" className={styles.logoLink}>
            <h1>{settings.schoolName}</h1>
          </Link>
          {getPageTitle(location.pathname) && (
            <span className={styles.headerTitle}>{getPageTitle(location.pathname)}</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className={styles.notificationButton}
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Abrir notificações"
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <BellIcon 
                width={28} 
                height={28} 
                style={{ 
                  color: 'white', 
                  opacity: isEnabled ? 1 : 0.5 
                }} 
              />
              {isEnabled && unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
              {!isEnabled && (
                <BellIcon 
                  className={styles.disabledIndicator}
                  style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    opacity: 0.5
                  }} 
                />
              )}
            </button>
            <button
              className={`${styles.menuButton} ${isMenuOpen ? styles.open : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={styles.menuIcon}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop para fechar notificações */}
      {isNotificationsOpen && (
        <div className={styles.notificationsBackdrop} onClick={handleBackdropClick}></div>
      )}

      {/* Gaveta de Notificações */}
      {isNotificationsOpen && (
        <div className={styles.notificationsDrawer}>
          <div className={styles.notificationsHeader}>
            <h3>Notificações</h3>
            <button
              className={styles.closeDrawerButton}
              onClick={() => setIsNotificationsOpen(false)}
              aria-label="Fechar notificações"
            >
              ×
            </button>
          </div>
          <div className={styles.notificationsList}>
            {!isEnabled ? (
              <div className={styles.emptyNotifications}>
                <BellIcon className={styles.emptyIcon} style={{ width: '2rem', height: '2rem', opacity: 0.3, marginBottom: '0.5rem' }} />
                <strong>Notificações desabilitadas</strong>
                <br />
                Habilite em configurações da biblioteca
              </div>
            ) : loading ? (
              <div className={styles.emptyNotifications}>Carregando notificações...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyNotifications}>
                <BellIcon className={styles.emptyIcon} style={{ width: '2rem', height: '2rem', opacity: 0.5, marginBottom: '0.5rem' }} />
                Nenhuma notificação pendente, está tudo em dia!
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`${styles.notificationItem} ${notification.read ? styles.read : ''} ${notification.type === 'update' ? styles.updateNotification : ''} ${notification.type === 'reservation' ? styles.reservationNotification : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.read && (
                    <div className={styles.unreadIndicator}></div>
                  )}
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <button
                        className={styles.deleteNotificationButton}
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        aria-label="Deletar notificação"
                        title="Deletar notificação"
                      >
                        ×
                      </button>
                      <div className={styles.notificationMenuContainer} data-dropdown-id={notification.id}>
                        <button
                          className={styles.notificationMenuButton}
                          onClick={(e) => handleDropdownToggle(notification.id, e)}
                          aria-label="Menu de opções"
                          title="Menu de opções"
                        >
                          <EllipsisVerticalIcon className={styles.notificationMenuIcon} />
                        </button>
                        {openDropdownId === notification.id && (
                          <div className={styles.dropdownMenu}>
                            {!notification.read ? (
                              <button
                                className={styles.dropdownItem}
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                              >
                                Marcar como lido
                              </button>
                            ) : (
                              <button
                                className={styles.dropdownItem}
                                onClick={(e) => handleMarkAsUnread(notification.id, e)}
                              >
                                Marcar como não lido
                              </button>
                            )}
                            <button
                              className={styles.dropdownItem}
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                            >
                              Deletar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {renderNotificationContent(notification)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop mobile para fechar sidebar */}
      {isMenuOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setIsMenuOpen(false)} />
      )}

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed} ${isMenuOpen ? styles.sidebarMobileOpen : ''}`}>
          <nav className={styles.sidebarNav}>
            {/* Dashboard — link direto */}
            <div className={styles.sidebarSection}>
              <Link
                to="/dashboard"
                className={`${styles.sectionBtn} ${styles.sectionBtnAsLink} ${isActiveLink('/dashboard') ? styles.sectionBtnActive : ''}`}
                onClick={handleLinkClick}
                title={!isSidebarExpanded ? 'Dashboard' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M12,24c-1.65,0-3-1.35-3-3V3c0-1.65,1.35-3,3-3s3,1.35,3,3V21c0,1.65-1.35,3-3,3Zm9,0c-1.65,0-3-1.35-3-3V9c0-1.65,1.35-3,3-3s3,1.35,3,3v12c0,1.65-1.35,3-3,3Zm-18,0c-1.65,0-3-1.35-3-3v-6c0-1.65,1.35-3,3-3s3,1.35,3,3v6c0,1.65-1.35,3-3,3Z"/>
                </svg>
                {isSidebarExpanded && (
                  <span className={styles.sectionLabel}>Dashboard</span>
                )}
              </Link>
            </div>

            {/* Livros — link direto para o Acervo */}
            <div className={styles.sidebarSection}>
              <Link
                to="/books"
                className={`${styles.sectionBtn} ${styles.sectionBtnAsLink} ${isActiveLink('/books') ? styles.sectionBtnActive : ''}`}
                onClick={handleLinkClick}
                title={!isSidebarExpanded ? 'Livros' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M17,0H7C4.243,0,2,2.243,2,5v15c0,2.206,1.794,4,4,4h11c2.757,0,5-2.243,5-5V5c0-2.757-2.243-5-5-5Zm3,5v11H8V2h4V10.347c0,.623,.791,.89,1.169,.395l1.331-1.743,1.331,1.743c.378,.495,1.169,.228,1.169-.395V2c1.654,0,3,1.346,3,3ZM6,2.184v13.816c-.732,0-1.409,.212-2,.556V5c0-1.302,.839-2.402,2-2.816Zm11,19.816H6c-2.629-.047-2.627-3.954,0-4h14v1c0,1.654-1.346,3-3,3Z"/>
                </svg>
                {isSidebarExpanded && (
                  <span className={styles.sectionLabel}>Livros</span>
                )}
              </Link>
            </div>

            {/* Locações — toggle com sub-itens */}
            <div className={styles.sidebarSection}>
              <button
                className={`${styles.sectionBtn} ${openSection === 'locacoes' ? styles.sectionBtnActive : ''}`}
                onClick={() => toggleSection('locacoes')}
                title={!isSidebarExpanded ? 'Locações' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M22.922,9.689c-.684-.571-1.577-.807-2.458-.648l-6.18,1.124c-.913,.166-1.707,.634-2.284,1.289-.578-.655-1.371-1.123-2.285-1.289l-6.179-1.124c-.879-.16-1.774,.077-2.459,.648s-1.078,1.411-1.078,2.303v9.834l12,2.182,12-2.182V11.992c0-.892-.393-1.731-1.078-2.303Zm-11.922,12.104l-9-1.636V11.992c0-.407,.225-.656,.359-.768,.134-.112,.417-.289,.82-.216l6.179,1.124c.952,.173,1.642,1,1.642,1.968v7.694Zm11-1.636l-9,1.636v-7.694c0-.967,.69-1.795,1.642-1.968l6.18-1.124c.407-.07,.686,.104,.819,.216s.359,.36,.359,.768v8.165ZM12,9c2.481,0,4.5-2.019,4.5-4.5S14.481,0,12,0,7.5,2.019,7.5,4.5s2.019,4.5,4.5,4.5Zm0-7c1.379,0,2.5,1.122,2.5,2.5s-1.121,2.5-2.5,2.5-2.5-1.122-2.5-2.5,1.122-2.5,2.5-2.5Z"/>
                </svg>
                {isSidebarExpanded && (
                  <>
                    <span className={styles.sectionLabel}>Locações</span>
                    <ChevronDownIcon className={`${styles.sectionChevron} ${openSection === 'locacoes' ? styles.chevronOpen : ''}`} />
                  </>
                )}
              </button>
              {isSidebarExpanded && openSection === 'locacoes' && (
                <div className={styles.sectionLinks}>
                  <Link to="/student-loans" className={`${styles.sidebarLink} ${isActiveLink('/student-loans') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <AcademicCapIcon className={styles.linkIcon} />
                    <span>Alunos</span>
                  </Link>
                  <Link to="/staff-loans" className={`${styles.sidebarLink} ${isActiveLink('/staff-loans') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <UserGroupIcon className={styles.linkIcon} />
                    <span>Professores</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Cadastros */}
            <div className={styles.sidebarSection}>
              <button
                className={`${styles.sectionBtn} ${openSection === 'cadastros' ? styles.sectionBtnActive : ''}`}
                onClick={() => toggleSection('cadastros')}
                title={!isSidebarExpanded ? 'Cadastros' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M20,0H3V3H1V5H3V7H1V9H3v2H1v2H3v2H1v2H3v2H1v2H3v3H20a3,3,0,0,0,3-3V3A3,3,0,0,0,20,0Zm1,21a1,1,0,0,1-1,1H5V2H20a1,1,0,0,1,1,1Zm-8-9a3,3,0,1,0-3-3A3,3,0,0,0,13,12Zm5,4v2H16V16a1,1,0,0,0-1-1H11a1,1,0,0,0-1,1v2H8V16a3,3,0,0,1,3-3h4A3,3,0,0,1,18,16Z"/>
                </svg>
                {isSidebarExpanded && (
                  <>
                    <span className={styles.sectionLabel}>Cadastros</span>
                    <ChevronDownIcon className={`${styles.sectionChevron} ${openSection === 'cadastros' ? styles.chevronOpen : ''}`} />
                  </>
                )}
              </button>
              {isSidebarExpanded && openSection === 'cadastros' && (
                <div className={styles.sectionLinks}>
                  <Link to="/students" className={`${styles.sidebarLink} ${isActiveLink('/students') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <AcademicCapIcon className={styles.linkIcon} />
                    <span>Alunos</span>
                  </Link>
                  <Link to="/staff" className={`${styles.sidebarLink} ${isActiveLink('/staff') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <UserGroupIcon className={styles.linkIcon} />
                    <span>Professores e Funcionários</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Retirar */}
            <div className={styles.sidebarSection}>
              <button
                className={`${styles.sectionBtn} ${openSection === 'retirar' ? styles.sectionBtnActive : ''}`}
                onClick={() => toggleSection('retirar')}
                title={!isSidebarExpanded ? 'Retirar' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M22.293,15.895l-1.293-1.293v8.398c-.006,1.308-1.995,1.307-2,0V14.602l-1.293,1.293c-.391,.391-1.023,.391-1.414,0-.391-.39-.391-1.023,0-1.414l1.613-1.614c1.153-1.153,3.031-1.155,4.187,0l1.614,1.614c.921,.928-.486,2.335-1.414,1.414Z"/>
                  <path d="M17,0H7C4.239,0,2,2.239,2,5v15c0,2.209,1.791,4,4,4h10c1.308-.006,1.307-1.995,0-2H6c-1.213,0-2.178-1.086-1.972-2.338,.162-.984,1.088-1.662,2.085-1.662h7.888c1.308-.006,1.307-1.995,0-2h-6V2h9c1.657,0,3,1.343,3,3v4c.006,1.308,1.994,1.307,2,0V5c0-2.761-2.239-5-5-5ZM6,16c-.732,0-1.409,.212-2,.556V5c0-1.302,.839-2.402,2-2.816v13.816Z"/>
                </svg>
                {isSidebarExpanded && (
                  <>
                    <span className={styles.sectionLabel}>Retirar</span>
                    <ChevronDownIcon className={`${styles.sectionChevron} ${openSection === 'retirar' ? styles.chevronOpen : ''}`} />
                  </>
                )}
              </button>
              {isSidebarExpanded && openSection === 'retirar' && (
                <div className={styles.sectionLinks}>
                  <Link to="/student-withdrawals" className={`${styles.sidebarLink} ${isActiveLink('/student-withdrawals') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <AcademicCapIcon className={styles.linkIcon} />
                    <span>Alunos</span>
                  </Link>
                  <Link to="/staff-withdrawals" className={`${styles.sidebarLink} ${isActiveLink('/staff-withdrawals') ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <UserGroupIcon className={styles.linkIcon} />
                    <span>Professores e Funcionários</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Turmas — link direto */}
            <div className={styles.sidebarSection}>
              <Link
                to="/classes"
                className={`${styles.sectionBtn} ${styles.sectionBtnAsLink} ${isActiveLink('/classes') ? styles.sectionBtnActive : ''}`}
                onClick={handleLinkClick}
                title={!isSidebarExpanded ? 'Turmas' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="m22.004,4.498c.001-.865-.525-1.61-1.34-1.898L14.199.319c-1.386-.491-2.915-.492-4.302-.007L3.353,2.602c-.818.287-1.346,1.031-1.346,1.898,0,.866.529,1.61,1.347,1.896l2.646.923v1.681c0,3.309,2.691,6,6,6s6-2.691,6-6v-1.682l2-.698v4.379c0,.553.448,1,1,1s1-.447,1-1c0,0,.004-6.493.004-6.502Zm-6.004,4.502c0,2.206-1.794,4-4,4s-4-1.794-4-4v-.984l1.862.65c.689.24,1.413.36,2.137.36s1.448-.12,2.138-.36l1.863-.65v.984Zm-2.522-2.223c-.954.332-2.004.332-2.958,0l-6.507-2.287,6.544-2.289c.962-.337,2.019-.334,2.976.004l6.464,2.298-6.52,2.274Zm6.847,16.021c.111.541-.236,1.07-.777,1.182-.068.014-.136.021-.203.021-.464,0-.881-.325-.979-.798-.356-1.726-1.426-3.256-2.936-4.196l-2.662,3.154c-.38.455-1.156.455-1.536,0l-2.631-3.156c-1.541.942-2.611,2.472-2.967,4.198-.111.541-.641.885-1.182.777-.541-.112-.889-.641-.777-1.182.467-2.261,1.866-4.261,3.837-5.488.856-.534,1.984-.355,2.625.413l1.863,2.235,1.862-2.235c.64-.769,1.769-.948,2.624-.415,1.974,1.229,3.372,3.23,3.839,5.49Z"/>
                </svg>
                {isSidebarExpanded && (
                  <span className={styles.sectionLabel}>Turmas</span>
                )}
              </Link>
            </div>

            {/* Reservas — link direto */}
            <div className={styles.sidebarSection}>
              <Link
                to="/reservations"
                className={`${styles.sectionBtn} ${styles.sectionBtnAsLink} ${isActiveLink('/reservations') ? styles.sectionBtnActive : ''}`}
                onClick={handleLinkClick}
                title={!isSidebarExpanded ? 'Reservas' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="m8,12h-2c-1.103,0-2,.897-2,2v2c0,1.103.897,2,2,2h2c1.103,0,2-.897,2-2v-2c0-1.103-.897-2-2-2Zm-2,4v-2h2v2s-2,0-2,0ZM19,2h-1v-1c0-.552-.447-1-1-1s-1,.448-1,1v1h-8v-1c0-.552-.447-1-1-1s-1,.448-1,1v1h-1C2.243,2,0,4.243,0,7v12c0,2.757,2.243,5,5,5h14c2.757,0,5-2.243,5-5V7c0-2.757-2.243-5-5-5Zm-14,2h14c1.654,0,3,1.346,3,3v1H2v-1c0-1.654,1.346-3,3-3Zm14,18H5c-1.654,0-3-1.346-3-3v-9h20v9c0,1.654-1.346,3-3,3Z"/>
                </svg>
                {isSidebarExpanded && (
                  <span className={styles.sectionLabel}>
                    Reservas
                    {reservationsCount > 0 && (
                      <span className={styles.reservationBadge} style={{ marginLeft: 'auto' }}>{reservationsCount}</span>
                    )}
                  </span>
                )}
              </Link>
            </div>

            {/* Configurações */}
            <div className={styles.sidebarSection}>
              <button
                className={`${styles.sectionBtn} ${openSection === 'configuracoes' ? styles.sectionBtnActive : ''}`}
                onClick={() => toggleSection('configuracoes')}
                title={!isSidebarExpanded ? 'Configurações' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIcon}>
                  <path d="M12.208,8.328c-.916-.077-1.788,.326-2.67,1.209-1.634,1.635-1.634,3.292,0,4.925,.481,.482,1.239,1.142,2.254,1.21,.966,.064,1.854-.392,2.67-1.21,1.634-1.634,1.633-3.292,0-4.925-.481-.482-1.239-1.132-2.254-1.21Zm.84,4.721s0,0,0,0c-.302,.302-.767,.655-1.102,.629-.262-.02-.596-.232-.993-.629-.787-.787-.897-1.2,0-2.098,.291-.291,.706-.63,1.061-.63,.014,0,.028,0,.041,.001,.262,.02,.596,.232,.993,.629,.787,.787,.897,1.2,0,2.098Z"/>
                  <path d="M22.994,11.954c.006-1.206-.452-2.662-2.571-3.05-.11-.21-.231-.421-.364-.633,1.068-1.479,.986-2.851-.248-4.085-1.235-1.236-2.607-1.317-4.087-.245-.209-.132-.418-.252-.627-.36-.382-2.112-1.824-2.58-3.027-2.58-1.69,0-2.771,.891-3.086,2.624-.208,.109-.418,.23-.629,.362-1.473-1.064-2.846-.973-4.093,.272-1.243,1.244-1.333,2.618-.272,4.091-.133,.212-.255,.423-.366,.633-1.729,.316-2.609,1.345-2.618,3.063-.006,1.206,.452,2.662,2.571,3.05,.11,.21,.231,.421,.365,.633-1.069,1.479-.987,2.851,.247,4.085,1.235,1.236,2.608,1.317,4.087,.245,.209,.132,.418,.252,.627,.36,.382,2.112,1.824,2.58,3.027,2.58,1.721,0,2.771-.891,3.086-2.624,.208-.109,.418-.23,.629-.362,1.471,1.061,2.84,.968,4.092-.272s1.334-2.618,.273-4.092c.133-.212,.255-.423,.366-.632,1.729-.316,2.609-1.345,2.618-3.063Zm-3.369,1.147c-.364,.031-.682,.259-.829,.593-.201,.456-.483,.934-.839,1.419-.282,.385-.252,.917,.071,1.269,1.073,1.166,.713,1.527,.295,1.945-.435,.436-.78,.78-1.943-.296-.352-.324-.883-.354-1.27-.072-.483,.354-.959,.635-1.416,.834-.335,.147-.563,.465-.595,.831-.118,1.37-.6,1.373-1.157,1.375-.565,0-1.018,.006-1.122-1.326-.029-.371-.261-.695-.603-.841-.454-.195-.927-.472-1.405-.825-.177-.131-.386-.195-.594-.195-.244,0-.487,.089-.678,.265-1.179,1.087-1.532,.732-1.939,.324-.409-.409-.762-.763,.322-1.94,.325-.353,.354-.886,.068-1.272-.356-.481-.635-.955-.83-1.407-.146-.341-.47-.573-.839-.602-1.325-.106-1.323-.555-1.32-1.123,.003-.581,.005-1.04,1.369-1.158,.364-.031,.682-.259,.829-.593,.202-.457,.484-.935,.839-1.42,.282-.385,.252-.917-.071-1.269-1.073-1.165-.712-1.526-.295-1.944,.435-.435,.78-.779,1.943,.295,.352,.325,.883,.354,1.269,.072,.484-.354,.96-.634,1.417-.834,.335-.147,.563-.465,.595-.831,.118-1.37,.6-1.373,1.157-1.375,.573,.004,1.018-.006,1.122,1.326,.029,.371,.261,.695,.603,.841,.454,.195,.927,.472,1.405,.825,.385,.284,.919,.255,1.271-.069,1.179-1.087,1.531-.732,1.939-.324,.409,.409,.763,.763-.322,1.94-.325,.353-.354,.887-.069,1.272,.356,.481,.635,.955,.83,1.407,.146,.341,.47,.573,.839,.602,1.325,.106,1.323,.555,1.32,1.123-.003,.581-.005,1.04-1.369,1.158Z"/>
                </svg>
                {isSidebarExpanded && (
                  <>
                    <span className={styles.sectionLabel}>Configurações</span>
                    <ChevronDownIcon className={`${styles.sectionChevron} ${openSection === 'configuracoes' ? styles.chevronOpen : ''}`} />
                  </>
                )}
              </button>
              {isSidebarExpanded && openSection === 'configuracoes' && (
                <div className={styles.sectionLinks}>
                  <Link to={ROUTES.SETTINGS} className={`${styles.sidebarLink} ${isActiveLink(ROUTES.SETTINGS) ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <Cog6ToothIcon className={styles.linkIcon} />
                    <span>Configurações da Biblioteca</span>
                  </Link>
                  <Link to={ROUTES.CATALOG} className={`${styles.sidebarLink} ${isActiveLink(ROUTES.CATALOG) ? styles.activeSidebarLink : ''}`} onClick={handleLinkClick}>
                    <GlobeAltIcon className={styles.linkIcon} />
                    <span>Catálogo Online</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </aside>

        <main className={`${styles.main} ${isSidebarExpanded ? styles.mainExpanded : styles.mainCollapsed}`}>
          <Outlet />
        </main>
      </div>

      {/* Modal de Notificação de Atualização */}
      {selectedNotification && selectedNotification.type === 'update' && (
        <div className={styles.notificationModalBackdrop} onClick={closeNotificationModal}>
          <div className={styles.notificationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.notificationModalHeader}>
              <h3>
                <MegaphoneIcon className={styles.modalHeaderIcon} />
                {selectedNotification.title}
              </h3>
              <button
                className={styles.closeModalButton}
                onClick={closeNotificationModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className={styles.notificationModalContent}>
              <div className={styles.notificationModalMessage}>
                {selectedNotification.message.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <div className={styles.notificationModalMeta}>
                <span className={styles.notificationTime}>
                  {formatNotificationTime(selectedNotification.createdAt)}
                </span>
                <span className={`${styles.notificationBadgeType} ${styles.update}`}>
                  Atualização do Sistema
                </span>
              </div>
            </div>
            <div className={styles.notificationModalActions}>
              <button 
                className={styles.modalActionButton}
                onClick={closeNotificationModal}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gerador de Dummy Content */}
      <DummyContentGenerator 
        isOpen={isDummyGeneratorOpen} 
        onClose={() => setIsDummyGeneratorOpen(false)} 
      />
    </div>
  );
};

export default Layout; 