import React from 'react';
import type { LibrarySettings } from '../../../contexts/SettingsContext';
import {
  BellIcon,
  HashtagIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import styles from '../Settings.module.css';

interface GeneralSettingsTabProps {
  settings: LibrarySettings;
  onSettingChange: <K extends keyof LibrarySettings>(
    setting: K,
    value: LibrarySettings[K]
  ) => void;
  onSaveSettings: () => Promise<void> | void;
  loading: boolean;
  isAdmin: boolean;
  onNavigateToAdmin: () => void;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  settings,
  onSettingChange,
  onSaveSettings,
  loading,
  isAdmin,
  onNavigateToAdmin
}) => {
  return (
    <div className={styles.tabPanel}>
      {isAdmin && (
        <div className={styles.settingsSection}>
          <h3>Administração</h3>
          <div className={styles.settingGroup}>
            <p className={styles.helpText}>
              Funcionalidades exclusivas para administradores do sistema.
            </p>
            <button
              className={styles.adminButton}
              onClick={onNavigateToAdmin}
            >
              Escrever Notificação de Atualização
            </button>
          </div>
        </div>
      )}

      <div className={styles.settingsSection}>
        <h3>Configurações Gerais</h3>

        <div className={styles.settingsGrid}>
          <div className={styles.settingGroup}>
            <label htmlFor="schoolName">Nome da Escola/Biblioteca</label>
            <input
              type="text"
              id="schoolName"
              value={settings.schoolName}
              onChange={(e) => onSettingChange('schoolName', e.target.value)}
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
              min={1}
              max={90}
              value={settings.loanDuration}
              onChange={(e) => onSettingChange('loanDuration', Number(e.target.value))}
            />
          </div>

          <div className={styles.settingGroup}>
            <label htmlFor="maxBooksPerStudent">Máximo de livros por aluno</label>
            <input
              type="number"
              id="maxBooksPerStudent"
              min={1}
              max={10}
              value={settings.maxBooksPerStudent}
              onChange={(e) => onSettingChange('maxBooksPerStudent', Number(e.target.value))}
            />
          </div>

          <div className={`${styles.settingGroup} ${styles.toggleGroup}`}>
            <label className={styles.checkboxLabel}>
              <div className={styles.checkboxIconGroup}>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => onSettingChange('enableNotifications', e.target.checked)}
                />
                <div className={`${styles.iconWrapper} ${styles.iconNotifications}`}>
                  <BellIcon className={styles.checkboxIcon} />
                </div>
              </div>
              Habilitar notificações
            </label>
            <p className={styles.helpText}>
              Quando ativado, o sistema enviará notificações automáticas com lembretes e comunicados
              importantes para a comunidade escolar.
            </p>
          </div>

          <div className={`${styles.settingGroup} ${styles.toggleGroup}`}>
            <label className={styles.checkboxLabel}>
              <div className={styles.checkboxIconGroup}>
                <input
                  type="checkbox"
                  checked={settings.useDistinctCodes}
                  onChange={(e) => onSettingChange('useDistinctCodes', e.target.checked)}
                />
                <div className={`${styles.iconWrapper} ${styles.iconCodes}`}>
                  <HashtagIcon className={styles.checkboxIcon} />
                </div>
              </div>
              Minha biblioteca usa códigos distintos para o mesmo título
            </label>
            <p className={styles.helpText}>
              Quando ativado, cada exemplar físico terá seu próprio código e a quantidade será
              calculada automaticamente pelo número de códigos. Quando desativado, você define
              manualmente a quantidade de exemplares para um mesmo código.
            </p>
          </div>

          <div className={`${styles.settingGroup} ${styles.toggleGroup}`}>
            <label className={styles.checkboxLabel}>
              <div className={styles.checkboxIconGroup}>
                <input
                  type="checkbox"
                  checked={settings.useGuardianContact}
                  onChange={(e) => onSettingChange('useGuardianContact', e.target.checked)}
                />
                <div className={`${styles.iconWrapper} ${styles.iconGuardians}`}>
                  <UserGroupIcon className={styles.checkboxIcon} />
                </div>
              </div>
              Usar contato dos responsáveis
            </label>
            <p className={styles.helpText}>
              Quando ativado, as notificações de lembrete de devolução serão direcionadas aos
              responsáveis, com uma mensagem personalizada solicitando que avisem o aluno sobre a
              devolução.
            </p>
          </div>

          <div className={`${styles.settingGroup} ${styles.toggleGroup}`}>
            <label className={styles.checkboxLabel}>
              <div className={styles.checkboxIconGroup}>
                <input
                  type="checkbox"
                  checked={settings.fastCheckoutEnabled ?? false}
                  onChange={(e) => onSettingChange('fastCheckoutEnabled', e.target.checked)}
                />
                <div className={`${styles.iconWrapper} ${styles.iconFastCheckout}`}>
                  <BoltIcon className={styles.checkboxIcon} />
                </div>
              </div>
              Registro de retiradas ágeis (experimental)
            </label>
            <p className={styles.helpText}>
              Quando ativado, muda o processo de registro de retiradas para um processo mais ágil e
              simplificado, otimizando o fluxo de empréstimos.
            </p>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={onSaveSettings}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;

