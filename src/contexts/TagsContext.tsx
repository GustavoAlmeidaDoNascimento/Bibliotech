import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Tag } from '../types/common';

// Lista inicial de gêneros/classes sugeridos para compatibilidade
const INITIAL_GENRES = [
  'Romance',
  'Ficção Científica',
  'Fantasia',
  'Terror',
  'Suspense',
  'Drama',
  'Aventura',
  'História',
  'Biografia',
  'Autoajuda',
  'Educacional',
  'Infantil',
  'Juvenil',
  'Técnico',
  'Científico',
  'Literatura Brasileira',
  'Literatura Estrangeira',
  'Poesia',
  'Quadrinhos',
  'Mangá',
  'Religião',
  'Filosofia',
  'Psicologia',
  'Sociologia',
  'Política',
  'Economia',
  'Direito',
  'Medicina',
  'Engenharia',
  'Informática'
].sort();

// Cores padrão para as tags
const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#22C55E', '#A855F7', '#0EA5E9'
];

interface TagsContextType {
  // Tags modernas
  tags: Tag[];
  loading: boolean;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  updateTag: (id: string, name: string, color: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;
  getTagsByIds: (ids: string[]) => Tag[];
  
  // Compatibilidade com sistema antigo de gêneros
  genres: string[];
  addGenre: (genre: string) => void;
  removeGenre: (genre: string) => void;
  capitalizeTag: (tag: string) => string;
}

export const TagsContext = createContext<TagsContextType | null>(null);

export const useTags = () => {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
};

export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [genres, setGenres] = useState<string[]>(INITIAL_GENRES);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Funções utilitárias
  const capitalizeTag = (tag: string): string => {
    return tag
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getRandomColor = (): string => {
    return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
  };

  // Carregar tags do Firebase
  const fetchTags = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const tagsRef = collection(db, `users/${currentUser.uid}/tags`);
      const q = query(tagsRef);
      const querySnapshot = await getDocs(q);
      
      const fetchedTags = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];
      
      setTags(fetchedTags);
    } catch (error) {
      console.error('❌ Erro ao buscar tags:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTags();
  }, [currentUser]); // Apenas quando o usuário muda

  // Criar nova tag
  const createTag = async (name: string, color?: string): Promise<Tag | null> => {
    if (!currentUser) return null;

    try {
      const capitalizedName = capitalizeTag(name);
      
      // Verificar se já existe uma tag com esse nome
      const existingTag = tags.find(tag => tag.name.toLowerCase() === capitalizedName.toLowerCase());
      if (existingTag) {
        return existingTag;
      }

      const selectedColor = color || getRandomColor();
      
      // Criar no Firebase primeiro
      const tagData = {
        name: capitalizedName,
        color: selectedColor,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const tagsRef = collection(db, `users/${currentUser.uid}/tags`);
      const docRef = await addDoc(tagsRef, tagData);

      // Criar objeto da tag com ID real
      const newTag: Tag = {
        id: docRef.id,
        name: capitalizedName,
        color: selectedColor,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Adicionar ao estado local
      setTags(prev => [...prev, newTag]);
      
      return newTag;
    } catch (error) {
      console.error('❌ Erro ao criar tag:', error);
      return null;
    }
  };

  // Atualizar tag
  const updateTag = async (id: string, name: string, color: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const tagRef = doc(db, `users/${currentUser.uid}/tags/${id}`);
      const updateData = {
        name: capitalizeTag(name),
        color,
        updatedAt: serverTimestamp()
      };

      await updateDoc(tagRef, updateData);

      setTags(prev => prev.map(tag => 
        tag.id === id 
          ? { ...tag, name: updateData.name, color, updatedAt: new Date() }
          : tag
      ));
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
      throw error;
    }
  };

  // Deletar tag
  const deleteTag = async (id: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const tagRef = doc(db, `users/${currentUser.uid}/tags/${id}`);
      await deleteDoc(tagRef);

      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      throw error;
    }
  };

  // Buscar tag por ID
  const getTagById = (id: string): Tag | undefined => {
    return tags.find(tag => tag.id === id);
  };

  // Buscar múltiplas tags por IDs
  const getTagsByIds = (ids: string[]): Tag[] => {
    return ids.map(id => getTagById(id)).filter(Boolean) as Tag[];
  };

  // Compatibilidade com sistema antigo de gêneros
  const addGenre = (genre: string) => {
    const capitalizedGenre = capitalizeTag(genre);
    if (!genres.includes(capitalizedGenre)) {
      setGenres(prev => [...prev, capitalizedGenre].sort());
    }
  };

  const removeGenre = (genre: string) => {
    setGenres(prev => prev.filter(g => g !== genre));
  };

  const value = {
    // Tags modernas
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
    
    // Compatibilidade
    genres,
    addGenre,
    removeGenre,
    capitalizeTag
  };

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  );
}; 