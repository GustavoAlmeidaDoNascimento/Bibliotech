import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  orderBy, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UseFirestorePaginationProps {
  collectionPath: string;
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useFirestorePagination = <T extends { id: string }>({
  collectionPath,
  pageSize = 50,
  orderByField = 'createdAt',
  orderDirection = 'desc'
}: UseFirestorePaginationProps) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalLoaded, setTotalLoaded] = useState(0);
  
  // Cursor para próxima página
  const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  /**
   * Carrega primeira página ou recarrega tudo
   */
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      
      const collectionRef = collection(db, collectionPath);
      const q = query(
        collectionRef,
        orderBy(orderByField, orderDirection),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      setItems(fetchedItems);
      setTotalLoaded(fetchedItems.length);
      
      // Salvar último documento para paginação
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      lastVisibleRef.current = lastDoc || null;
      
      // Se trouxe menos que pageSize, não há mais itens
      setHasMore(fetchedItems.length === pageSize);
      
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, pageSize, orderByField, orderDirection]);

  /**
   * Carrega próxima página
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastVisibleRef.current) return;

    try {
      setLoading(true);
      
      const collectionRef = collection(db, collectionPath);
      const q = query(
        collectionRef,
        orderBy(orderByField, orderDirection),
        startAfter(lastVisibleRef.current),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Adicionar aos itens existentes
      setItems(prev => [...prev, ...fetchedItems]);
      setTotalLoaded(prev => prev + fetchedItems.length);
      
      // Atualizar cursor
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      lastVisibleRef.current = lastDoc || null;
      
      // Se trouxe menos que pageSize, não há mais itens
      setHasMore(fetchedItems.length === pageSize);
      
    } catch (error) {
      console.error('Erro ao carregar mais itens:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, pageSize, orderByField, orderDirection, hasMore, loading]);

  /**
   * Recarrega primeira página (útil após adicionar/deletar)
   */
  const reload = useCallback(() => {
    lastVisibleRef.current = null;
    setItems([]);
    setTotalLoaded(0);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  /**
   * Carrega TODOS os itens (para exportação ou busca)
   * Retorna os itens sem atualizar o estado
   */
  const loadAll = useCallback(async (): Promise<T[]> => {
    try {
      const collectionRef = collection(db, collectionPath);
      const q = query(
        collectionRef,
        orderBy(orderByField, orderDirection)
      );

      const snapshot = await getDocs(q);
      
      const allItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      return allItems;
      
    } catch (error) {
      console.error('Erro ao carregar todos os itens:', error);
      return [];
    }
  }, [collectionPath, orderByField, orderDirection]);

  /**
   * Carrega TODOS os itens e ATUALIZA o estado
   * Útil quando precisa buscar em todo o acervo
   */
  const loadAllAndUpdate = useCallback(async () => {
    try {
      setLoading(true);
      
      const collectionRef = collection(db, collectionPath);
      const q = query(
        collectionRef,
        orderBy(orderByField, orderDirection)
      );

      const snapshot = await getDocs(q);
      
      const allItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      setItems(allItems);
      setTotalLoaded(allItems.length);
      setHasMore(false); // Já carregou tudo
      
      // Atualizar cursor para o último documento
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      lastVisibleRef.current = lastDoc || null;
      
    } catch (error) {
      console.error('Erro ao carregar todos os itens:', error);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, orderByField, orderDirection]);

  return {
    items,
    loading,
    hasMore,
    totalLoaded,
    loadInitial,
    loadMore,
    reload,
    loadAll,
    loadAllAndUpdate
  };
};

