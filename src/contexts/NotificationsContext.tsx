import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'overdue' | 'warning' | 'info' | 'update';
  studentId?: string;
  studentName?: string;
  bookTitle?: string;
  loanId?: string;
  daysOverdue?: number;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isEnabled: boolean;
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  refreshNotifications: () => Promise<void>;
  sendUpdateNotificationToAllUsers: (title: string, content: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [deletedNotifications, setDeletedNotifications] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.read).length;
  const isEnabled = settings.enableNotifications;

  // Carregar notificações lidas do Firebase
  const loadReadNotifications = async (): Promise<Set<string>> => {
    if (!currentUser) return new Set();

    try {
      const readNotificationsRef = doc(db, `users/${currentUser.uid}/settings/readNotifications`);
      const readNotificationsDoc = await getDoc(readNotificationsRef);
      
      if (readNotificationsDoc.exists()) {
        const data = readNotificationsDoc.data();
        return new Set(data.readIds || []);
      }
      
      return new Set();
    } catch (error) {
      console.error('Erro ao carregar notificações lidas:', error);
      return new Set();
    }
  };

  // Carregar notificações deletadas do Firebase
  const loadDeletedNotifications = async (): Promise<Set<string>> => {
    if (!currentUser) return new Set();

    try {
      const deletedNotificationsRef = doc(db, `users/${currentUser.uid}/settings/deletedNotifications`);
      const deletedNotificationsDoc = await getDoc(deletedNotificationsRef);
      
      if (deletedNotificationsDoc.exists()) {
        const data = deletedNotificationsDoc.data();
        return new Set(data.deletedIds || []);
      }
      
      return new Set();
    } catch (error) {
      console.error('Erro ao carregar notificações deletadas:', error);
      return new Set();
    }
  };

  // Carregar datas de criação das notificações do Firebase
  const loadNotificationCreationDates = async (): Promise<Map<string, Date>> => {
    if (!currentUser) return new Map();

    try {
      const creationDatesRef = doc(db, `users/${currentUser.uid}/settings/notificationCreationDates`);
      const creationDatesDoc = await getDoc(creationDatesRef);
      
      if (creationDatesDoc.exists()) {
        const data = creationDatesDoc.data();
        const creationDates = new Map<string, Date>();
        
        if (data.dates) {
          Object.entries(data.dates).forEach(([notificationId, timestamp]: [string, any]) => {
            try {
              // Converter timestamp para Date
              const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
              creationDates.set(notificationId, date);
            } catch (error) {
              console.error(`Erro ao converter timestamp para notificação ${notificationId}:`, error);
            }
          });
        }
        
        return creationDates;
      }
      
      return new Map();
    } catch (error) {
      console.error('Erro ao carregar datas de criação das notificações:', error);
      return new Map();
    }
  };

  // Salvar datas de criação das notificações no Firebase
  const saveNotificationCreationDates = async (creationDates: Map<string, Date>) => {
    if (!currentUser) return;

    try {
      const creationDatesRef = doc(db, `users/${currentUser.uid}/settings/notificationCreationDates`);
      
      // Converter Map para objeto simples
      const datesObject: { [key: string]: Date } = {};
      creationDates.forEach((date, notificationId) => {
        datesObject[notificationId] = date;
      });
      
      await setDoc(creationDatesRef, {
        dates: datesObject,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar datas de criação das notificações:', error);
    }
  };

  // salva as notificações lidas no Firebase
  const saveReadNotifications = async (readIds: Set<string>) => {
    if (!currentUser) return;

    try {
      const readNotificationsRef = doc(db, `users/${currentUser.uid}/settings/readNotifications`);
      await setDoc(readNotificationsRef, {
        readIds: Array.from(readIds),
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar notificações lidas:', error);
    }
  };

  // salva as notificações deletadas no Firebase
  const saveDeletedNotifications = async (deletedIds: Set<string>) => {
    if (!currentUser) return;

    try {
      const deletedNotificationsRef = doc(db, `users/${currentUser.uid}/settings/deletedNotifications`);
      await setDoc(deletedNotificationsRef, {
        deletedIds: Array.from(deletedIds),
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar notificações deletadas:', error);
    }
  };

  // Carregar notificações de atualização do Firebase
  const loadUpdateNotifications = async (): Promise<Notification[]> => {
    if (!currentUser) return [];

    try {
      const updateNotificationsRef = doc(db, `globalNotifications/updateNotifications`);
      const updateNotificationsDoc = await getDoc(updateNotificationsRef);
      
      if (updateNotificationsDoc.exists()) {
        const data = updateNotificationsDoc.data();
        const notifications: Notification[] = [];
        
        if (data.notifications && Array.isArray(data.notifications)) {
          // Carregar IDs das notificações lidas e deletadas
          const [readIds, deletedIds] = await Promise.all([
            loadReadNotifications(),
            loadDeletedNotifications()
          ]);
          
          data.notifications.forEach((notif: any) => {
            if (!deletedIds.has(notif.id)) {
              const isRead = readIds.has(notif.id);
              
              notifications.push({
                id: notif.id,
                title: notif.title,
                message: notif.message,
                type: 'update',
                read: isRead,
                createdAt: notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt)
              });
            }
          });
        }
        
        return notifications;
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao carregar notificações de atualização:', error);
      return [];
    }
  };

  // Enviar notificação de atualização para todos os usuários
  const sendUpdateNotificationToAllUsers = async (title: string, content: string): Promise<void> => {
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    // Verificar se é admin
    if (currentUser.email !== 'admin@admin.com') {
      throw new Error('Apenas o administrador pode enviar notificações de atualização');
    }

    try {
      const notificationId = `update-${Date.now()}`;
      const newNotification = {
        id: notificationId,
        title,
        message: content,
        createdAt: new Date()
      };

      // Salvar na coleção global de notificações
      const updateNotificationsRef = doc(db, `globalNotifications/updateNotifications`);
      const updateNotificationsDoc = await getDoc(updateNotificationsRef);
      
      let existingNotifications = [];
      if (updateNotificationsDoc.exists()) {
        const data = updateNotificationsDoc.data();
        existingNotifications = data.notifications || [];
      }
      
      // Adicionar nova notificação no início da lista
      const updatedNotifications = [newNotification, ...existingNotifications];
      
      // Manter apenas as últimas 50 notificações para não sobrecarregar
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      await setDoc(updateNotificationsRef, {
        notifications: limitedNotifications,
        lastUpdated: new Date()
      }, { merge: true });
      
    } catch (error) {
      console.error('Erro ao enviar notificação de atualização:', error);
      throw error;
    }
  };

  const generateNotificationFromLoan = (loan: any, isRead: boolean = false, existingCreatedAt?: Date): Notification => {
    const today = new Date();
    const dueDate = loan.dueDate?.toDate ? loan.dueDate.toDate() : new Date(loan.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id: `overdue-${loan.id}`,
      title: `Aluno(a) ${loan.studentName} está com a devolução do livro "${loan.bookTitle}" atrasada!`,
      message: `O empréstimo deveria ter sido devolvido em ${dueDate.toLocaleDateString('pt-BR')}. Já se passaram ${daysOverdue} dia(s) do prazo.`,
      type: daysOverdue > 7 ? 'overdue' : 'warning',
      studentId: loan.studentId,
      studentName: loan.studentName,
      bookTitle: loan.bookTitle,
      loanId: loan.id,
      daysOverdue,
      read: isRead,
      createdAt: existingCreatedAt || new Date() // Usa a data existente ou cria uma nova
    };
  };

  const fetchOverdueLoans = useCallback(async (): Promise<Notification[]> => {
    if (!currentUser) return [];

    try {
      // Carregar notificações lidas, deletadas e datas de criação
      const [readIds, deletedIds, creationDates] = await Promise.all([
        loadReadNotifications(),
        loadDeletedNotifications(),
        loadNotificationCreationDates()
      ]);
      
      setReadNotifications(readIds);
      setDeletedNotifications(deletedIds);

      const loansRef = collection(db, `users/${currentUser.uid}/loans`);
      const q = query(loansRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);

      const overdueNotifications: Notification[] = [];
      const newCreationDates = new Map(creationDates);
      const today = new Date();
      let hasNewNotifications = false;

      querySnapshot.docs.forEach(doc => {
        const loanData = doc.data();
        const dueDate = loanData.dueDate?.toDate ? loanData.dueDate.toDate() : new Date(loanData.dueDate);
        
        // verifica se está atrasado
        if (dueDate < today) {
          const notificationId = `overdue-${doc.id}`;
          
          // não inclui notificações deletadas
          if (!deletedIds.has(notificationId)) {
            const isRead = readIds.has(notificationId);
            
            // Verifica se já existe uma data de criação para esta notificação
            let existingCreatedAt = creationDates.get(notificationId);
            
            // Se não existe, cria uma nova e marca para salvar
            if (!existingCreatedAt) {
              existingCreatedAt = new Date();
              newCreationDates.set(notificationId, existingCreatedAt);
              hasNewNotifications = true;
            }
            
            const notification = generateNotificationFromLoan({
              id: doc.id,
              ...loanData
            }, isRead, existingCreatedAt);
            
            overdueNotifications.push(notification);
          }
        }
      });

      // Salva as novas datas de criação se houver
      if (hasNewNotifications) {
        await saveNotificationCreationDates(newCreationDates);
      }

      return overdueNotifications;
    } catch (error) {
      console.error('Erro ao buscar empréstimos atrasados:', error);
      return [];
    }
  }, [currentUser]);

  const refreshNotifications = useCallback(async () => {
    // não busca notificações se estiverem desabilitadas
    if (!settings.enableNotifications) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      // Buscar tanto notificações de empréstimos atrasados quanto de atualização
      const [overdueNotifications, updateNotifications] = await Promise.all([
        fetchOverdueLoans(),
        loadUpdateNotifications()
      ]);
      
      // Combinar e ordenar por data de criação (mais recentes primeiro)
      const allNotifications = [...overdueNotifications, ...updateNotifications]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [settings.enableNotifications, fetchOverdueLoans]);

  const markAsRead = async (notificationId: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.add(notificationId);
    
    setReadNotifications(newReadNotifications);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    // salva no Firebase
    await saveReadNotifications(newReadNotifications);
  };

  const markAsUnread = async (notificationId: string) => {
    const newReadNotifications = new Set(readNotifications);
    newReadNotifications.delete(notificationId);
    
    setReadNotifications(newReadNotifications);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: false }
          : notification
      )
    );

    // salva no Firebase
    await saveReadNotifications(newReadNotifications);
  };

  const markAllAsRead = async () => {
    const allNotificationIds = notifications.map(n => n.id);
    const newReadNotifications = new Set([...Array.from(readNotifications), ...allNotificationIds]);
    
    setReadNotifications(newReadNotifications);
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    // salva no Firebase
    await saveReadNotifications(newReadNotifications);
  };

  const deleteNotification = async (notificationId: string) => {
    const newDeletedNotifications = new Set(deletedNotifications);
    newDeletedNotifications.add(notificationId);
    
    setDeletedNotifications(newDeletedNotifications);
    
    // remove da lista local
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );

    // salva no Firebase
    await saveDeletedNotifications(newDeletedNotifications);
    
    // Remove a data de criação da notificação deletada
    try {
      const creationDates = await loadNotificationCreationDates();
      if (creationDates.has(notificationId)) {
        creationDates.delete(notificationId);
        await saveNotificationCreationDates(creationDates);
      }
    } catch (error) {
      console.error('Erro ao limpar data de criação da notificação deletada:', error);
    }
  };

  // busca notificações ao carregar e a cada 5 minutos
  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      
      // só configura o intervalo se as notificações estiverem habilitadas
      if (settings.enableNotifications) {
        const interval = setInterval(refreshNotifications, 5 * 60 * 1000); // 5 minutos
        return () => clearInterval(interval);
      }
    }
  }, [currentUser, settings.enableNotifications, refreshNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    isEnabled,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    sendUpdateNotificationToAllUsers
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}; 