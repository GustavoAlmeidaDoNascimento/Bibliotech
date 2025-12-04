import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export type ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'brown';

export interface LibrarySettings {
  schoolName: string;
  loanDuration: number;
  maxBooksPerStudent: number;
  enableNotifications: boolean;
  showOverdueWarnings: boolean;
  allowDashboard: boolean;
  themeColor: ThemeColor;
  useDistinctCodes: boolean;
  useGuardianContact: boolean;
  fastCheckoutEnabled: boolean;
}

interface SettingsContextType {
  settings: LibrarySettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<LibrarySettings>) => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: LibrarySettings = {
  schoolName: 'Biblioteca',
  loanDuration: 30,
  maxBooksPerStudent: 3,
  enableNotifications: true,
  showOverdueWarnings: true,
  allowDashboard: true,
  themeColor: 'blue',
  useDistinctCodes: false,
  useGuardianContact: false,
  fastCheckoutEnabled: false
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<LibrarySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [persistedSettings, setPersistedSettings] = useState<LibrarySettings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const db = getFirestore();
        const settingsRef = doc(db, `users/${currentUser.uid}/settings/library`);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          // Garantir que todos os campos do defaultSettings sejam preservados
          const mergedSettings: LibrarySettings = {
            ...defaultSettings,
            ...data,
            // Garantir que campos booleanos não sejam undefined
            fastCheckoutEnabled: data.fastCheckoutEnabled !== undefined ? Boolean(data.fastCheckoutEnabled) : defaultSettings.fastCheckoutEnabled,
            useDistinctCodes: data.useDistinctCodes !== undefined ? Boolean(data.useDistinctCodes) : defaultSettings.useDistinctCodes,
            useGuardianContact: data.useGuardianContact !== undefined ? Boolean(data.useGuardianContact) : defaultSettings.useGuardianContact,
            enableNotifications: data.enableNotifications !== undefined ? Boolean(data.enableNotifications) : defaultSettings.enableNotifications,
            showOverdueWarnings: data.showOverdueWarnings !== undefined ? Boolean(data.showOverdueWarnings) : defaultSettings.showOverdueWarnings,
            allowDashboard: data.allowDashboard !== undefined ? Boolean(data.allowDashboard) : defaultSettings.allowDashboard,
          };
          console.log('Configurações carregadas:', mergedSettings);
          setSettings(mergedSettings);
          setPersistedSettings(mergedSettings);
        } else {
          // cria documento de configurações padrão se não existir
          await setDoc(settingsRef, {
            ...defaultSettings,
            loanDuration: 30,
            createdAt: serverTimestamp()
          });
          setPersistedSettings({
            ...defaultSettings,
            loanDuration: 30
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser]);

  const recalculateLoanDueDates = async (newDuration: number) => {
    if (!currentUser) return;

    try {
      const dbInstance = getFirestore();
      const loansRef = collection(dbInstance, `users/${currentUser.uid}/loans`);
      const activeLoansSnapshot = await getDocs(query(loansRef, where('status', '==', 'active')));

      const updatePromises = activeLoansSnapshot.docs.map(async (loanDoc) => {
        const data = loanDoc.data();

        if (data.loanDurationDays === newDuration) {
          return;
        }

        const borrowDateValue = data.renewedAt?.toDate
          ? data.renewedAt.toDate()
          : data.borrowDate?.toDate
            ? data.borrowDate.toDate()
            : data.borrowDate instanceof Date
              ? data.borrowDate
              : null;

        if (!borrowDateValue) {
          return;
        }

        const newDueDate = new Date(borrowDateValue);
        newDueDate.setDate(newDueDate.getDate() + newDuration);

        await updateDoc(loanDoc.ref, {
          dueDate: Timestamp.fromDate(newDueDate),
          loanDurationDays: newDuration,
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Erro ao recalcular prazos de devolução:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<LibrarySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const saveSettings = async () => {
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const settingsRef = doc(db, `users/${currentUser.uid}/settings/library`);
      
      const loanDurationChanged = settings.loanDuration !== persistedSettings.loanDuration;

      // Garantir que todos os campos sejam salvos explicitamente
      const settingsToSave: LibrarySettings = {
        schoolName: settings.schoolName,
        loanDuration: settings.loanDuration,
        maxBooksPerStudent: settings.maxBooksPerStudent,
        enableNotifications: settings.enableNotifications ?? false,
        showOverdueWarnings: settings.showOverdueWarnings ?? false,
        allowDashboard: settings.allowDashboard ?? false,
        themeColor: settings.themeColor,
        useDistinctCodes: settings.useDistinctCodes ?? false,
        useGuardianContact: settings.useGuardianContact ?? false,
        fastCheckoutEnabled: settings.fastCheckoutEnabled ?? false,
      };

      console.log('Salvando configurações:', settingsToSave);

      // Usar setDoc com merge para garantir que todos os campos sejam salvos
      await setDoc(settingsRef, {
        ...settingsToSave,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('Configurações salvas com sucesso');

      if (loanDurationChanged) {
        await recalculateLoanDueDates(settings.loanDuration);
      }

      setPersistedSettings(settingsToSave);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return Promise.reject(error);
    }
  };

  const value = {
    settings,
    loading,
    updateSettings,
    saveSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext; 