import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { authService, auth } from '../services/firebase';
import { AsyncState } from '../types/common';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  authState: AsyncState<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AsyncState<User>>({
    data: null,
    status: 'loading',
    error: null,
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, status: 'loading', error: null }));
    
    try {
      await authService.login(email, password);
      setAuthState(prev => ({ ...prev, status: 'success' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      setAuthState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, status: 'loading', error: null }));
    
    try {
      await authService.logout();
      setAuthState(prev => ({ ...prev, status: 'success', data: null }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer logout';
      setAuthState(prev => ({ ...prev, status: 'error', error: errorMessage }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthState({
        data: user,
        status: user ? 'success' : 'idle',
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    resetPassword,
    authState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 