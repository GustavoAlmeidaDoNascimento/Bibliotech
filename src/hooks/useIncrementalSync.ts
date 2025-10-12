import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface SyncOptions {
  userId: string;
  lastSyncTimestamp: number;
}

interface MergeResult<T> {
  merged: T[];
  newCount: number;
  updatedCount: number;
}

/**
 * Hook para sincronização incremental de dados do Firestore
 * Busca apenas documentos modificados desde a última sincronização
 */
export function useIncrementalSync() {
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Mescla dados em cache com novos dados, substituindo duplicatas
   */
  const mergeData = useCallback(<T extends { id: string }>(
    cachedData: T[],
    newData: T[]
  ): MergeResult<T> => {
    const dataMap = new Map(cachedData.map(item => [item.id, item]));
    const existingIds = new Set(cachedData.map(item => item.id));
    
    let updatedCount = 0;
    let newCount = 0;

    newData.forEach(item => {
      if (existingIds.has(item.id)) {
        updatedCount++;
      } else {
        newCount++;
      }
      dataMap.set(item.id, item);
    });

    return {
      merged: Array.from(dataMap.values()),
      newCount,
      updatedCount
    };
  }, []);

  /**
   * Busca empréstimos modificados desde o último sync
   */
  const syncLoans = useCallback(async (options: SyncOptions) => {
    const { userId, lastSyncTimestamp } = options;

    try {
      setIsSyncing(true);

      const loansRef = collection(db, `users/${userId}/loans`);
      
      // Se é primeira vez (sem timestamp), busca todos
      if (lastSyncTimestamp === 0) {
        const snapshot = await getDocs(loansRef);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date(),
            dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
            returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : undefined,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
      }

      // Sincronização incremental: busca apenas modificados
      const lastSyncDate = new Date(lastSyncTimestamp);
      const q = query(
        loansRef,
        where('updatedAt', '>', Timestamp.fromDate(lastSyncDate))
      );

      const snapshot = await getDocs(q);
      console.log(`📊 Sincronização incremental: ${snapshot.size} empréstimos modificados`);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          borrowDate: data.borrowDate?.toDate ? data.borrowDate.toDate() : new Date(),
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : new Date(),
          returnDate: data.returnDate?.toDate ? data.returnDate.toDate() : undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });
    } catch (error) {
      console.error('Erro na sincronização incremental de empréstimos:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Busca livros modificados desde o último sync
   */
  const syncBooks = useCallback(async (options: SyncOptions) => {
    const { userId, lastSyncTimestamp } = options;

    try {
      setIsSyncing(true);

      const booksRef = collection(db, `users/${userId}/books`);
      
      // Se é primeira vez, busca todos
      if (lastSyncTimestamp === 0) {
        const snapshot = await getDocs(booksRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Sincronização incremental
      const lastSyncDate = new Date(lastSyncTimestamp);
      const q = query(
        booksRef,
        where('updatedAt', '>', Timestamp.fromDate(lastSyncDate))
      );

      const snapshot = await getDocs(q);
      console.log(`📚 Sincronização incremental: ${snapshot.size} livros modificados`);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro na sincronização incremental de livros:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Busca alunos modificados desde o último sync
   */
  const syncStudents = useCallback(async (options: SyncOptions) => {
    const { userId, lastSyncTimestamp } = options;

    try {
      setIsSyncing(true);

      const studentsRef = collection(db, `users/${userId}/students`);
      
      // Se é primeira vez, busca todos
      if (lastSyncTimestamp === 0) {
        const snapshot = await getDocs(studentsRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Sincronização incremental
      const lastSyncDate = new Date(lastSyncTimestamp);
      const q = query(
        studentsRef,
        where('updatedAt', '>', Timestamp.fromDate(lastSyncDate))
      );

      const snapshot = await getDocs(q);
      console.log(`👥 Sincronização incremental: ${snapshot.size} alunos modificados`);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro na sincronização incremental de alunos:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    syncLoans,
    syncBooks,
    syncStudents,
    mergeData
  };
}



