import React, { ChangeEvent, RefObject } from 'react';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import styles from '../Settings.module.css';

interface BackupTabProps {
  backupLoading: boolean;
  onBackup: () => void;
  restoreFromFileLoading: boolean;
  onTriggerFileInput: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteReturnedClick: () => void;
  onRestoreDataClick: () => void;
}

const BackupTab: React.FC<BackupTabProps> = ({
  backupLoading,
  onBackup,
  restoreFromFileLoading,
  onTriggerFileInput,
  fileInputRef,
  onFileChange,
  onDeleteReturnedClick,
  onRestoreDataClick
}) => {
  return (
    <div className={styles.tabPanel}>
      <div className={styles.settingsSection}>
        <h3>Backup Completo</h3>
        <p className={styles.sectionDescription}>
          Faça download dos dados da biblioteca e mantenha uma cópia de segurança sempre atualizada.
        </p>

        <div className={styles.backupSection}>
          <h4>Backup Completo de Dados</h4>
          <p>
            Faça o backup completo de <strong>todos</strong> os dados da sua biblioteca, incluindo:
            livros, alunos, funcionários, empréstimos, histórico, tags/gêneros personalizados,
            configurações e preferências. O arquivo pode ser usado para restaurar 100% dos seus dados.
          </p>

          <button
            className={styles.actionButton}
            onClick={onBackup}
            disabled={backupLoading}
          >
            {backupLoading ? (
              'Gerando backup completo...'
            ) : (
              <>
                <ArrowUpTrayIcon className={styles.actionButtonIcon} />
                Fazer Backup Completo
              </>
            )}
          </button>

          <h4>Restaurar a partir de Backup</h4>
          <p>
            <strong>Restauração completa:</strong> Todos os dados atuais serão substituídos pelos dados
            do backup. Isso inclui livros, alunos, empréstimos, histórico, tags e configurações. A
            restauração é 100% completa.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button
            className={styles.actionButton}
            onClick={onTriggerFileInput}
            disabled={restoreFromFileLoading}
          >
            {restoreFromFileLoading ? (
              'Restaurando...'
            ) : (
              <>
                <ArrowDownTrayIcon className={styles.actionButtonIcon} />
                Carregar Arquivo de Backup
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>Zona de Perigo</h3>
        <p className={styles.sectionDescription}>
          Ações irreversíveis. Certifique-se de entender o impacto antes de continuar.
        </p>

        <div className={styles.dangerZone}>
          <h4>Atenção</h4>
          <p>
            As ações abaixo são irreversíveis. Tenha certeza do que está fazendo antes de prosseguir.
          </p>

          <button
            className={styles.dangerButton}
            onClick={onDeleteReturnedClick}
          >
            <TrashIcon className={styles.dangerButtonIcon} />
            Apagar Empréstimos Devolvidos
          </button>
          <p className={styles.helpText}>
            Esta ação apagará permanentemente todos os registros de empréstimos já devolvidos.
          </p>

          <button
            className={styles.dangerButton}
            onClick={onRestoreDataClick}
          >
            <ArrowPathIcon className={styles.dangerButtonIcon} />
            Restaurar Todos os Dados
          </button>
          <p className={styles.helpText}>
            Esta ação apagará todos os livros, alunos, funcionários, empréstimos, histórico,
            tags/gêneros e configurações do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupTab;

