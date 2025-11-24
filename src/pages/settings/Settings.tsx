import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { LibrarySettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  collection,
  query,
  getDocs,
  deleteDoc,
  getFirestore,
  setDoc,
  where,
  getDoc
} from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider, getAuth, sendPasswordResetEmail } from 'firebase/auth';
import GeneralSettingsTab from './components/GeneralSettingsTab';
import AccountTab from './components/AccountTab';
import TagsTab from './components/TagsTab';
import EducationalLevelsTab from './components/EducationalLevelsTab';
import SupportTab from './components/SupportTab';
import BackupTab from './components/BackupTab';
import YearTurnoverTab from './components/YearTurnoverTab';
import {
  Cog6ToothIcon,
  TagIcon,
  AcademicCapIcon,
  LifebuoyIcon,
  ArrowPathIcon,
  UserCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import styles from './Settings.module.css';

type TabDefinition = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  content: React.ReactNode;
};

const Settings = () => {
  const { currentUser, logout } = useAuth();
  const { settings, updateSettings, saveSettings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [activeTab, setActiveTab] = useState('account');
  const [plan, setPlan] = useState<number | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  useEffect(() => {
    const fetchPlan = async () => {
      if (!currentUser) {
        setPlan(null);
        setPlanError('');
        return;
      }

      setPlanLoading(true);
      setPlanError('');

      try {
        const db = getFirestore();
        const subscriptionRef = doc(db, `users/${currentUser.uid}/account/subscription`);
        const subscriptionSnapshot = await getDoc(subscriptionRef);

        if (subscriptionSnapshot.exists()) {
          const data = subscriptionSnapshot.data() as { plan?: number };
          if (typeof data.plan === 'number') {
            setPlan(data.plan);
          } else {
            setPlan(null);
            setPlanError('Plano ainda não configurado.');
          }
        } else {
          setPlan(null);
          setPlanError('Plano não encontrado para esta conta.');
        }
      } catch (error) {
        console.error('Erro ao carregar plano da assinatura:', error);
        setPlan(null);
        setPlanError('Não foi possível carregar o plano. Tente novamente mais tarde.');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [currentUser]);
  
  // Estado para restauração
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  
  // Estado para apagar empréstimos devolvidos
  const [showDeleteReturnedConfirm, setShowDeleteReturnedConfirm] = useState(false);
  const [deleteReturnedPassword, setDeleteReturnedPassword] = useState('');
  const [deleteReturnedLoading, setDeleteReturnedLoading] = useState(false);
  const [deleteReturnedError, setDeleteReturnedError] = useState('');
  
  // Referência para input de upload de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreFromFileLoading, setRestoreFromFileLoading] = useState(false);
  
  // pega todos os dados do firebase
  const getAllData = async () => {
    if (!currentUser) return null;
    
    const db = getFirestore();
    const collections = ['books', 'students', 'loans', 'staff', 'staffLoans', 'tags'];
    const allData: Record<string, any> = {};
    
    // Buscar todas as coleções normais
    for (const collectionName of collections) {
      const collectionRef = collection(db, `users/${currentUser.uid}/${collectionName}`);
      const querySnapshot = await getDocs(query(collectionRef));
      
      allData[collectionName] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Buscar configurações (buscar toda a coleção settings)
    try {
      const settingsCollectionRef = collection(db, `users/${currentUser.uid}/settings`);
      const settingsSnapshot = await getDocs(query(settingsCollectionRef));
      
      allData.settings = settingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.warn('Erro ao buscar configurações para backup:', error);
      allData.settings = [];
    }
    
    return allData;
  };
  
  // faz o backup dos dados em JSON
  const handleBackupData = async () => {
    try {
      setBackupLoading(true);
      setMessage({ text: '', isError: false });
      
      const data = await getAllData();
      if (!data) {
        throw new Error('Não foi possível obter os dados para backup');
      }
      
      // Contar total de registros para mostrar pro usuário
      let totalRecords = 0;
      const collections = ['books', 'students', 'loans', 'staff', 'staffLoans', 'tags', 'settings'];
      collections.forEach(col => {
        if (data[col]) {
          totalRecords += data[col].length;
        }
      });
      
      // coloco algumas infos extras no backup
      const backupData = {
        version: '2.0', // Versão atualizada com mais coleções
        timestamp: new Date().toISOString(),
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        totalRecords,
        collections: collections.filter(col => data[col] && data[col].length > 0),
        data,
        metadata: {
          books: data.books?.length || 0,
          students: data.students?.length || 0,
          loans: data.loans?.length || 0,
          staff: data.staff?.length || 0,
          staffLoans: data.staffLoans?.length || 0,
          tags: data.tags?.length || 0,
          settings: data.settings?.length || 0
        }
      };
      
      // converte pra JSON e cria um blob
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // truque pra fazer o download automático
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `bibliotech_backup_completo_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ 
        text: `Backup completo realizado com sucesso! ${totalRecords} registros salvos. O arquivo foi baixado.`, 
        isError: false 
      });
    } catch (error) {
      console.error('Erro ao fazer backup dos dados:', error);
      setMessage({ 
        text: 'Erro ao fazer backup dos dados. Tente novamente.', 
        isError: true 
      });
    } finally {
      setBackupLoading(false);
    }
  };
  
  // restaura os dados de um arquivo de backup
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) {
      return;
    }
    
    try {
      setRestoreFromFileLoading(true);
      setMessage({ text: 'Processando arquivo de backup...', isError: false });
      
      // lê o arquivo como texto
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validação mais robusta do arquivo de backup
      if (!backupData.data || !backupData.version) {
        throw new Error('Formato de arquivo de backup inválido');
      }
      
      // Verificar se é um backup do Bibliotech
      if (!backupData.userId && !backupData.data.books && !backupData.data.students) {
        throw new Error('Este arquivo não parece ser um backup válido do Bibliotech');
      }
      
      setMessage({ text: 'Arquivo válido! Limpando dados existentes...', isError: false });
      
      // agora vamos restaurar
      const db = getFirestore();
      const collections = ['books', 'students', 'loans', 'staff', 'staffLoans', 'tags', 'settings'];
      
      // primeiro limpo tudo
      await restoreAllData();
      
      setMessage({ text: 'Restaurando dados do backup...', isError: false });
      
      let restoredCount = 0;
      
      // depois restauro os dados do backup
      for (const collectionName of collections) {
        if (Array.isArray(backupData.data[collectionName]) && backupData.data[collectionName].length > 0) {
          const collectionData = backupData.data[collectionName];
          
          for (const item of collectionData) {
            const { id, ...data } = item;
            
            // Para settings, preciso tratar de forma especial porque usa estrutura diferente
            if (collectionName === 'settings') {
              await setDoc(
                doc(db, `users/${currentUser.uid}/settings/${id}`),
                data
              );
            } else {
              await setDoc(
                doc(db, `users/${currentUser.uid}/${collectionName}/${id}`),
                data
              );
            }
            restoredCount++;
          }
        }
      }
      
      // Informar detalhes do que foi restaurado
      const metadata = backupData.metadata;
      let detailMessage = `Restauração completa! ${restoredCount} registros restaurados.`;
      
      if (metadata) {
        const details = [];
        if (metadata.books > 0) details.push(`${metadata.books} livros`);
        if (metadata.students > 0) details.push(`${metadata.students} alunos`);
        if (metadata.loans > 0) details.push(`${metadata.loans} empréstimos`);
        if (metadata.staff > 0) details.push(`${metadata.staff} funcionários`);
        if (metadata.staffLoans > 0) details.push(`${metadata.staffLoans} empréstimos de funcionários`);
        if (metadata.tags > 0) details.push(`${metadata.tags} tags/gêneros`);
        if (metadata.settings > 0) details.push(`${metadata.settings} configurações`);
        
        if (details.length > 0) {
          detailMessage += ` Restaurado: ${details.join(', ')}.`;
        }
      }
      
      setMessage({ 
        text: detailMessage, 
        isError: false 
      });
    } catch (error) {
      console.error('Erro ao restaurar dados do arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ 
        text: `Erro ao restaurar dados: ${errorMessage}. Verifique se o arquivo é válido.`, 
        isError: true 
      });
    } finally {
      setRestoreFromFileLoading(false);
      // limpa o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // apaga tudo do firebase
  const restoreAllData = async () => {
    if (!currentUser) return;
    
    const db = getFirestore();
    const collections = ['books', 'students', 'loans', 'staff', 'staffLoans', 'tags', 'settings'];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, `users/${currentUser.uid}/${collectionName}`);
      const querySnapshot = await getDocs(query(collectionRef));
      
      // deleta todos os documentos de uma vez
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, `users/${currentUser.uid}/${collectionName}/${docSnapshot.id}`))
      );
      
      await Promise.all(deletePromises);
    }
  };
  
  // Funções para gerenciar as configurações
  const handleSettingChange = <K extends keyof LibrarySettings>(
    setting: K,
    value: LibrarySettings[K]
  ) => {
    updateSettings({ [setting]: value } as Partial<LibrarySettings>);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
      setMessage({ text: 'Erro ao sair da conta. Tente novamente.', isError: true });
    }
  };

  const handleSendPasswordReset = async () => {
    if (!currentUser?.email) {
      setMessage({
        text: 'Não foi possível enviar o e-mail de redefinição. Usuário sem e-mail cadastrado.',
        isError: true
      });
      return;
    }

    try {
      setResetPasswordLoading(true);
      setMessage({ text: '', isError: false });
      const auth = getAuth();
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage({
        text: 'Enviamos um e-mail com instruções para redefinir sua senha.',
        isError: false
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
      setMessage({
        text: 'Não foi possível enviar o e-mail de redefinição. Tente novamente mais tarde.',
        isError: true
      });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleAdminNavigation = () => {
    navigate('/admin/update-notification');
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setMessage({ text: '', isError: false });
      
      await saveSettings();
      
      setMessage({ text: 'Configurações salvas com sucesso!', isError: false });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage({ text: 'Erro ao salvar configurações. Tente novamente.', isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  // Funções para restauração de dados
  const handleRestoreDataClick = () => {
    setShowRestoreConfirm(true);
    setPassword('');
    setConfirmPhrase('');
    setRestoreError('');
  };
  
  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setPassword('');
    setConfirmPhrase('');
    setRestoreError('');
  };
  
  const handleRestoreConfirm = async () => {
    if (!currentUser || !currentUser.email) {
      setRestoreError('Usuário não autenticado.');
      return;
    }
    
    // Verificar a frase de confirmação
    const expectedPhrase = 'eu quero restaurar todos os dados da minha biblioteca';
    if (confirmPhrase.toLowerCase().trim() !== expectedPhrase) {
      setRestoreError('A frase de confirmação não corresponde exatamente ao esperado.');
      return;
    }
    
    try {
      setRestoreLoading(true);
      setRestoreError('');
      
      // Reautenticar o usuário com a senha fornecida
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Proceder com a restauração de dados
      await restoreAllData();
      
      setShowRestoreConfirm(false);
      setMessage({ text: 'Todos os dados foram restaurados com sucesso!', isError: false });
    } catch (error) {
      console.error('Erro ao restaurar dados:', error);
      
      if (error instanceof Error) {
        // Verificar se é erro de autenticação
        if (error.message.includes('auth')) {
          setRestoreError('Senha incorreta. Por favor, verifique e tente novamente.');
        } else {
          setRestoreError(`Erro ao restaurar dados: ${error.message}`);
        }
      } else {
        setRestoreError('Erro desconhecido ao restaurar dados.');
      }
    } finally {
      setRestoreLoading(false);
    }
  };

  // Funções para apagar empréstimos devolvidos
  const handleDeleteReturnedLoansClick = () => {
    setShowDeleteReturnedConfirm(true);
    setDeleteReturnedPassword('');
    setDeleteReturnedError('');
  };
  
  const cancelDeleteReturned = () => {
    setShowDeleteReturnedConfirm(false);
    setDeleteReturnedPassword('');
    setDeleteReturnedError('');
  };
  
  const handleDeleteReturnedConfirm = async () => {
    if (!currentUser || !currentUser.email) {
      setDeleteReturnedError('Usuário não autenticado.');
      return;
    }
    
    try {
      setDeleteReturnedLoading(true);
      setDeleteReturnedError('');
      
      // Reautenticar o usuário com a senha fornecida
      const credential = EmailAuthProvider.credential(currentUser.email, deleteReturnedPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Proceder com a exclusão de empréstimos devolvidos
      await deleteReturnedLoans();
      
      setShowDeleteReturnedConfirm(false);
      setMessage({ 
        text: 'Todos os registros de empréstimos devolvidos foram excluídos com sucesso!', 
        isError: false 
      });
    } catch (error) {
      console.error('Erro ao excluir empréstimos devolvidos:', error);
      
      if (error instanceof Error) {
        // Verificar se é erro de autenticação
        if (error.message.includes('auth')) {
          setDeleteReturnedError('Senha incorreta. Por favor, verifique e tente novamente.');
        } else {
          setDeleteReturnedError(`Erro ao excluir empréstimos devolvidos: ${error.message}`);
        }
      } else {
        setDeleteReturnedError('Erro desconhecido ao excluir empréstimos devolvidos.');
      }
    } finally {
      setDeleteReturnedLoading(false);
    }
  };
  
  // apaga os empréstimos que já foram devolvidos
  const deleteReturnedLoans = async () => {
    if (!currentUser) return;
    
    const db = getFirestore();
    
    // pega os empréstimos devolvidos dos estudantes
    const loansRef = collection(db, `users/${currentUser.uid}/loans`);
    const returnedLoansQuery = query(loansRef, where('status', '==', 'returned'));
    const returnedSnapshot = await getDocs(returnedLoansQuery);
    
    // deleta todos os empréstimos devolvidos
    const deletePromises = returnedSnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, `users/${currentUser.uid}/loans/${docSnapshot.id}`))
    );
    
    await Promise.all(deletePromises);
    
    // também deleta dos funcionários se tiver
    const staffLoansRef = collection(db, `users/${currentUser.uid}/staffLoans`);
    const returnedStaffLoansQuery = query(staffLoansRef, where('status', '==', 'returned'));
    const returnedStaffSnapshot = await getDocs(returnedStaffLoansQuery);
    
    const deleteStaffPromises = returnedStaffSnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, `users/${currentUser.uid}/staffLoans/${docSnapshot.id}`))
    );
    
    await Promise.all(deleteStaffPromises);
  };

  // Verificar se é admin
  const isAdmin = currentUser?.email === 'admin@admin.com';

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  };

  const getPlanLabel = (planValue: number | null) => {
    if (planValue === 1) return 'Plano Básico';
    if (planValue === 2) return 'Plano Intermediário';
    if (planValue === 3) return 'Plano Avançado';
    return 'Plano não definido';
  };

  const planLabel = getPlanLabel(plan);
  const formattedCreation = formatDateTime(currentUser?.metadata?.creationTime);
  const formattedLastSignIn = formatDateTime(currentUser?.metadata?.lastSignInTime);

  const tabs: TabDefinition[] = [
    {
      id: 'account',
      label: 'Conta',
      icon: UserCircleIcon,
      content: (
        <AccountTab
          email={currentUser?.email ?? null}
          userId={currentUser?.uid ?? null}
          emailVerified={Boolean(currentUser?.emailVerified)}
          creationTime={formattedCreation}
          lastSignInTime={formattedLastSignIn}
          planLabel={planLabel}
          planLevel={plan}
          planLoading={planLoading}
          planError={planError}
          onResetPassword={handleSendPasswordReset}
          resetLoading={resetPasswordLoading}
          onLogout={handleLogout}
        />
      )
    },
    {
      id: 'general',
      label: 'Configurações Gerais',
      icon: Cog6ToothIcon,
      content: (
        <GeneralSettingsTab
          settings={settings}
          onSettingChange={handleSettingChange}
          onSaveSettings={handleSaveSettings}
          loading={loading}
          isAdmin={Boolean(isAdmin)}
          onNavigateToAdmin={handleAdminNavigation}
        />
      )
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: TagIcon,
      content: <TagsTab />
    },
    {
      id: 'education',
      label: 'Níveis Educacionais',
      icon: AcademicCapIcon,
      content: <EducationalLevelsTab />
    },
    {
      id: 'support',
      label: 'Suporte',
      icon: LifebuoyIcon,
      content: <SupportTab />
    },
    {
      id: 'backup',
      label: 'Backup e Restauração',
      icon: ArrowPathIcon,
      content: (
        <BackupTab
          backupLoading={backupLoading}
          onBackup={handleBackupData}
          restoreFromFileLoading={restoreFromFileLoading}
          onTriggerFileInput={triggerFileInput}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onDeleteReturnedClick={handleDeleteReturnedLoansClick}
          onRestoreDataClick={handleRestoreDataClick}
        />
      )
    },
    {
      id: 'year-turnover',
      label: 'Gerenciar Virada de Ano',
      icon: CalendarDaysIcon,
      content: <YearTurnoverTab />
    }
  ];

  const activeTabDefinition =
    tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className={styles.container}>
      <h2>Configurações da Biblioteca</h2>
      
      {message.text && (
        <div className={message.isError ? styles.errorMessage : styles.successMessage}>
          {message.text}
        </div>
      )}
      
      <div
        className={styles.tabList}
        role="tablist"
        aria-label="Configurações da Biblioteca"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabDefinition.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`settings-tab-${tab.id}`}
              aria-controls={`settings-panel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className={styles.tabIcon} />
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
        </div>
        
      <div className={styles.content}>
        <div
          className={styles.tabContent}
          role="tabpanel"
          id={`settings-panel-${activeTabDefinition.id}`}
          aria-labelledby={`settings-tab-${activeTabDefinition.id}`}
        >
          {activeTabDefinition.content}
        </div>
      </div>
      
      {showRestoreConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Restauração de Dados</h3>
            
            <p className={styles.warningText}>
              <strong>Atenção:</strong> Esta ação apagará <strong>permanentemente</strong> todos os
              registros da sua biblioteca, incluindo livros, alunos, funcionários, empréstimos,
              histórico completo, tags/gêneros personalizados e configurações.
              Esta ação é irreversível!
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Digite sua senha para confirmar:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPhrase">Digite a frase abaixo exatamente como aparece:</label>
              <div className={styles.confirmationPhrase}>
                eu quero restaurar todos os dados da minha biblioteca
              </div>
              <input
                type="text"
                id="confirmPhrase"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="Digite a frase de confirmação..."
              />
            </div>
            
            {restoreError && (
              <div className={styles.errorMessage}>
                {restoreError}
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={cancelRestore}
                disabled={restoreLoading}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmDangerButton}
                onClick={handleRestoreConfirm}
                disabled={!password || !confirmPhrase || restoreLoading}
              >
                {restoreLoading ? 'Restaurando...' : 'Confirmar Restauração'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteReturnedConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirmar Exclusão de Empréstimos Devolvidos</h3>
            
            <p className={styles.warningText}>
              <strong>Atenção:</strong> Esta ação apagará <strong>permanentemente</strong> todos os
              registros de empréstimos já devolvidos do sistema. Esta ação é irreversível!
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="deleteReturnedPassword">Digite sua senha para confirmar:</label>
              <input
                type="password"
                id="deleteReturnedPassword"
                value={deleteReturnedPassword}
                onChange={(e) => setDeleteReturnedPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>
            
            {deleteReturnedError && (
              <div className={styles.errorMessage}>
                {deleteReturnedError}
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={cancelDeleteReturned}
                disabled={deleteReturnedLoading}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmDangerButton}
                onClick={handleDeleteReturnedConfirm}
                disabled={!deleteReturnedPassword || deleteReturnedLoading}
              >
                {deleteReturnedLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 