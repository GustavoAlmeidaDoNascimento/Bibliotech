import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface DeveloperContextType {
  isDeveloper: boolean;
}

const DeveloperContext = createContext<DeveloperContextType | null>(null);

export const useDeveloper = () => {
  const context = useContext(DeveloperContext);
  if (!context) {
    throw new Error('useDeveloper must be used within a DeveloperProvider');
  }
  return context;
};

export const DeveloperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const isDeveloper = currentUser?.email === 'dev@bibliotech.tech';

  const value = {
    isDeveloper,
  };

  return (
    <DeveloperContext.Provider value={value}>
      {children}
    </DeveloperContext.Provider>
  );
};



