import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { 
  doc, 
  collection, 
  query, 
  getDocs, 
  deleteDoc,
  getFirestore, 
  setDoc,
  where
} from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import TagManager from '../../components/TagManager';
import EducationalLevelManager from '../../components/EducationalLevelManager';
import ClassesByLevel from '../../components/ClassesByLevel';
import styles from './Settings.module.css';

const Settings = () => {
  const { currentUser } = useAuth();
  const { settings, updateSettings, saveSettings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  
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
  const handleSettingChange = (setting: string, value: any) => {
    updateSettings({ [setting]: value });
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

  return (
    <div className={styles.container}>
      <h2>Configurações da Biblioteca</h2>
      
      {message.text && (
        <div className={message.isError ? styles.errorMessage : styles.successMessage}>
          {message.text}
        </div>
      )}
      
      <div className={styles.content}>
        {isAdmin && (
          <div className={styles.settingsSection}>
            <h3>Administração</h3>
            
            <div className={styles.settingGroup}>
              <p className={styles.helpText}>
                Funcionalidades exclusivas para administradores do sistema.
              </p>
              <button 
                className={styles.adminButton}
                onClick={() => navigate('/admin/update-notification')}
              >
                Escrever Notificação de Atualização
              </button>
            </div>
          </div>
        )}
        
        <div className={styles.settingsSection}>
          <h3>Configurações Gerais</h3>
          
          <div className={styles.settingGroup}>
            <label htmlFor="schoolName">Nome da Escola/Biblioteca</label>
            <input
              type="text"
              id="schoolName"
              value={settings.schoolName}
              onChange={(e) => handleSettingChange('schoolName', e.target.value)}
              className={styles.textInput}
              placeholder="Nome que aparecerá no cabeçalho"
              maxLength={50}
            />
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="loanDuration">Duração padrão do empréstimo (dias)</label>
            <input
              type="number"
              id="loanDuration"
              min="1"
              max="90"
              value={settings.loanDuration}
              onChange={(e) => handleSettingChange('loanDuration', parseInt(e.target.value))}
            />
          </div>
          
          <div className={styles.settingGroup}>
            <label htmlFor="maxBooksPerStudent">Máximo de livros por aluno</label>
            <input
              type="number"
              id="maxBooksPerStudent"
              min="1"
              max="10"
              value={settings.maxBooksPerStudent}
              onChange={(e) => handleSettingChange('maxBooksPerStudent', parseInt(e.target.value))}
            />
          </div>
          
          <div className={styles.settingGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
              />
              Habilitar notificações
            </label>
          </div>
          
          <div className={styles.settingGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.useDistinctCodes}
                onChange={(e) => handleSettingChange('useDistinctCodes', e.target.checked)}
              />
              Minha biblioteca usa códigos distintos para o mesmo título
            </label>
            <p className={styles.helpText}>
              Quando ativado, cada exemplar físico terá seu próprio código e a quantidade será calculada automaticamente pelo número de códigos. Quando desativado, você define manualmente a quantidade de exemplares para um mesmo Código.
            </p>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.useGuardianContact}
                onChange={(e) => handleSettingChange('useGuardianContact', e.target.checked)}
              />
              Usar contato dos responsáveis
            </label>
            <p className={styles.helpText}>
              Quando ativado, as notificações de lembrete de devolução serão direcionadas aos responsáveis, com uma mensagem personalizada solicitando que avisem o aluno sobre a devolução.
            </p>
          </div>

          <div className={styles.buttonContainer}>
            <button 
              className={styles.saveButton}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
        
        <div className={styles.settingsSection}>
          <TagManager />
        </div>
        
        <div className={styles.settingsSection}>
          <EducationalLevelManager />
        </div>
        
        <div className={styles.settingsSection}>
          <ClassesByLevel />
        </div>
        
        <div className={styles.settingsSection}>
          <h3>Suporte</h3>
          
          <div className={styles.supportContainer}>
            <div className={styles.teamImageContainer}>
              <img 
                src="/images/team.jpeg" 
                alt="Equipe Bibliotech" 
                className={styles.teamImage}
              />
            </div>
            
            <div className={styles.supportContent}>
              <div className={styles.supportHeader}>
                <h4>Nossa Equipe está Aqui para Ajudar!</h4>
                <p className={styles.supportDescription}>
                  Encontrou alguma dificuldade ou tem uma sugestão? Nossa equipe de desenvolvimento 
                  está sempre disponível para ajudar você a aproveitar ao máximo o Bibliotech.
                </p>
              </div>
              
              <div className={styles.supportActions}>
                <a 
                  href="https://wa.me/5551996468758" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.modernSupportButton}
                >
                  <svg className={styles.whatsappIcon} viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                  Falar com Nossa Equipe
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.settingsSection}>
          <h3>Backup e Restauração</h3>
          
          <div className={styles.backupSection}>
            <h4>Backup Completo de Dados</h4>
            <p>
              Faça o backup completo de <strong>todos</strong> os dados da sua biblioteca, incluindo:
              livros, alunos, funcionários, empréstimos, histórico, tags/gêneros personalizados,
              configurações e preferências. O arquivo pode ser usado para restaurar 100% dos seus dados.
            </p>
            
            <button 
              className={styles.actionButton}
              onClick={handleBackupData}
              disabled={backupLoading}
            >
              {backupLoading ? 'Gerando backup completo...' : 'Fazer Backup Completo'}
            </button>
            
            <h4>Restaurar a partir de Backup</h4>
            <p>
              <strong>Restauração completa:</strong> Todos os dados atuais serão substituídos pelos
              dados do backup. Isso inclui livros, alunos, empréstimos, histórico, tags e configurações.
              A restauração é 100% completa.
            </p>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            
            <button 
              className={styles.actionButton}
              onClick={triggerFileInput}
              disabled={restoreFromFileLoading}
            >
              {restoreFromFileLoading ? 'Restaurando...' : 'Carregar Arquivo de Backup'}
            </button>
          </div>
          
          <div className={styles.dangerZone}>
            <h4>Zona de Perigo</h4>
            <p>
              As ações abaixo são irreversíveis. Tenha certeza do que está fazendo antes de prosseguir.
            </p>
            
            <button 
              className={styles.dangerButton}
              onClick={handleDeleteReturnedLoansClick}
            >
              Apagar Empréstimos Devolvidos
            </button>
            <p className={styles.helpText}>
              Esta ação apagará permanentemente todos os registros de empréstimos já devolvidos.
            </p>
            
            <button 
              className={styles.dangerButton}
              onClick={handleRestoreDataClick}
            >
              Restaurar Todos os Dados
            </button>
            <p className={styles.helpText}>
              Esta ação apagará todos os livros, alunos, funcionários, empréstimos, histórico, tags/gêneros e configurações do sistema.
            </p>
          </div>
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