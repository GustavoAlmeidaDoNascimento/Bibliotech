import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { EducationalLevel } from '../types/educationalLevel';

interface EducationalLevelsContextType {
  levels: EducationalLevel[];
  loading: boolean;
  createLevel: (name: string, abbreviation?: string, order?: number) => Promise<EducationalLevel | null>;
  updateLevel: (id: string, name: string, abbreviation?: string, order?: number) => Promise<void>;
  deleteLevel: (id: string) => Promise<void>;
  refreshLevels: () => Promise<void>;
  getLevelById: (id: string) => EducationalLevel | undefined;
}

const EducationalLevelsContext = createContext<EducationalLevelsContextType | null>(null);

export const useEducationalLevels = () => {
  const context = useContext(EducationalLevelsContext);
  if (!context) {
    throw new Error('useEducationalLevels must be used within an EducationalLevelsProvider');
  }
  return context;
};

export const EducationalLevelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [levels, setLevels] = useState<EducationalLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Buscar níveis educacionais do usuário
  const fetchLevels = async () => {
    if (!currentUser) {
      setLevels([]);
      setLoading(false);
      return;
    }

    try {
      const levelsRef = collection(db, `users/${currentUser.uid}/educationalLevels`);
      const q = query(levelsRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const levelsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as EducationalLevel[];

      setLevels(levelsData);
    } catch (error) {
      console.error('Erro ao buscar níveis educacionais:', error);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [currentUser]);

  // Criar novo nível educacional
  const createLevel = async (name: string, abbreviation?: string, order?: number): Promise<EducationalLevel | null> => {
    if (!currentUser) return null;

    try {
      // Verificar se já existe um nível com esse nome
      const existingLevel = levels.find(level => level.name.toLowerCase() === name.toLowerCase());
      if (existingLevel) {
        throw new Error('Já existe um nível educacional com este nome');
      }

      // Se não especificou ordem, usar a próxima disponível
      const finalOrder = order || (levels.length > 0 ? Math.max(...levels.map(l => l.order)) + 1 : 1);
      
      const levelData = {
        name: name.trim(),
        abbreviation: abbreviation?.trim() || '',
        order: finalOrder,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const levelsRef = collection(db, `users/${currentUser.uid}/educationalLevels`);
      const docRef = await addDoc(levelsRef, levelData);

      const newLevel: EducationalLevel = {
        id: docRef.id,
        name: name.trim(),
        abbreviation: abbreviation?.trim() || '',
        order: finalOrder,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setLevels(prev => [...prev, newLevel].sort((a, b) => a.order - b.order));
      
      return newLevel;
    } catch (error) {
      console.error('Erro ao criar nível educacional:', error);
      throw error;
    }
  };

  // Atualizar nível educacional
  const updateLevel = async (id: string, name: string, abbreviation?: string, order?: number): Promise<void> => {
    if (!currentUser) return;

    try {
      const levelRef = doc(db, `users/${currentUser.uid}/educationalLevels/${id}`);
      const updateData = {
        name: name.trim(),
        abbreviation: abbreviation?.trim() || '',
        order: order || 1,
        updatedAt: serverTimestamp()
      };

      await updateDoc(levelRef, updateData);

      setLevels(prev => 
        prev.map(level => 
          level.id === id 
            ? { ...level, name: name.trim(), abbreviation: abbreviation?.trim() || '', order: order || level.order, updatedAt: new Date() }
            : level
        ).sort((a, b) => a.order - b.order)
      );
    } catch (error) {
      console.error('Erro ao atualizar nível educacional:', error);
      throw error;
    }
  };

  // Deletar nível educacional
  const deleteLevel = async (id: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const levelRef = doc(db, `users/${currentUser.uid}/educationalLevels/${id}`);
      await deleteDoc(levelRef);

      setLevels(prev => prev.filter(level => level.id !== id));
    } catch (error) {
      console.error('Erro ao deletar nível educacional:', error);
      throw error;
    }
  };

  // Refresh dos níveis
  const refreshLevels = async (): Promise<void> => {
    await fetchLevels();
  };

  // Buscar nível por ID
  const getLevelById = (id: string): EducationalLevel | undefined => {
    return levels.find(level => level.id === id);
  };

  const value = {
    levels,
    loading,
    createLevel,
    updateLevel,
    deleteLevel,
    refreshLevels,
    getLevelById
  };

  return (
    <EducationalLevelsContext.Provider value={value}>
      {children}
    </EducationalLevelsContext.Provider>
  );
};
