import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { TagsProvider } from '../contexts/TagsContext';
import { AuthorsProvider } from '../contexts/AuthorsContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ThemeProvider } from '../styles/ThemeProvider';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { EducationalLevelsProvider } from '../contexts/EducationalLevelsContext';
import { DeveloperProvider } from '../contexts/DeveloperContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Provedor unificado que combina todos os providers necessários
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <DeveloperProvider>
        <SettingsProvider>
          <NotificationsProvider>
            <TagsProvider>
              <EducationalLevelsProvider>
                <AuthorsProvider>
                  <ThemeProvider>
                    {children}
                  </ThemeProvider>
                </AuthorsProvider>
              </EducationalLevelsProvider>
            </TagsProvider>
          </NotificationsProvider>
        </SettingsProvider>
      </DeveloperProvider>
    </AuthProvider>
  );
};

export default AppProviders; 