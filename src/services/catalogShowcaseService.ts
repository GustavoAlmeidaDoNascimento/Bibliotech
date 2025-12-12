import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { BookWithStats } from './bookRecommendationService';

export interface ShowcaseConfig {
  mode: 'specific' | 'random';
  specificBookId?: string;
}

export const catalogShowcaseService = {
  /**
   * Salva a configuração da vitrine para a escola
   */
  saveShowcaseConfig: async (userId: string, config: ShowcaseConfig): Promise<void> => {
    try {
      const showcaseRef = doc(db, `users/${userId}/settings/catalogShowcase`);
      
      // Preparar dados para salvar (remover undefined)
      const dataToSave: any = {
        mode: config.mode,
        updatedAt: new Date()
      };
      
      // Só adicionar specificBookId se existir
      if (config.specificBookId) {
        dataToSave.specificBookId = config.specificBookId;
      }
      
      await setDoc(showcaseRef, dataToSave, { merge: true });
      
      console.log('✅ Configuração da vitrine salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configuração da vitrine:', error);
      throw new Error('Erro ao salvar configuração da vitrine.');
    }
  },

  /**
   * Busca a configuração da vitrine para a escola
   */
  getShowcaseConfig: async (userId: string): Promise<ShowcaseConfig | null> => {
    try {
      const showcaseRef = doc(db, `users/${userId}/settings/catalogShowcase`);
      const showcaseDoc = await getDoc(showcaseRef);
      
      if (showcaseDoc.exists()) {
        return showcaseDoc.data() as ShowcaseConfig;
      }
      
      // Retorna configuração padrão (modo aleatório)
      return { mode: 'random' };
    } catch (error) {
      console.error('Erro ao buscar configuração da vitrine:', error);
      return { mode: 'random' };
    }
  },

  /**
   * Busca o livro da vitrine diretamente pelo ID salvo (sem depender de lista)
   */
  getShowcaseBook: async (userId: string): Promise<BookWithStats | null> => {
    try {
      const config = await catalogShowcaseService.getShowcaseConfig(userId);
      
      if (!config || !config.specificBookId) {
        // Se não tem configuração ou não tem livro salvo, retorna null
        console.log('⚠️ Nenhum livro configurado na vitrine');
        return null;
      }

      // Buscar livro diretamente pelo ID salvo
      const book = await catalogShowcaseService.getBookById(userId, config.specificBookId);
      
      if (!book) {
        console.warn('Livro da vitrine não encontrado:', config.specificBookId);
        return null;
      }

      // Verificar se tem capa e sinopse
      if (!book.coverUrl || !book.coverUrl.trim() || !book.synopsis || !book.synopsis.trim()) {
        console.warn('Livro da vitrine não tem capa ou sinopse:', config.specificBookId);
        return null;
      }

      return book;
    } catch (error) {
      console.error('Erro ao buscar livro da vitrine:', error);
      return null;
    }
  },

  /**
   * Seleciona um livro aleatório que tenha capa e sinopse
   */
  getRandomShowcaseBook: (allBooks: BookWithStats[]): BookWithStats | null => {
    // Filtrar livros que tenham capa E sinopse (não descrição)
    const eligibleBooks = allBooks.filter(book => 
      book.coverUrl && 
      book.coverUrl.trim() !== '' && 
      book.synopsis && 
      book.synopsis.trim() !== ''
    );

    if (eligibleBooks.length === 0) {
      console.warn('Nenhum livro elegível para vitrine (precisa ter capa e sinopse)');
      return null;
    }

    // Selecionar um livro aleatório
    const randomIndex = Math.floor(Math.random() * eligibleBooks.length);
    return eligibleBooks[randomIndex];
  },

  /**
   * Busca um livro específico pelo ID
   */
  getBookById: async (userId: string, bookId: string): Promise<BookWithStats | null> => {
    try {
      const bookRef = doc(db, `users/${userId}/books/${bookId}`);
      const bookDoc = await getDoc(bookRef);
      
      if (!bookDoc.exists()) {
        return null;
      }

      const bookData = bookDoc.data();
      
      // Garantir que authors seja sempre um array
      let authors: string[] = [];
      if (bookData.authors) {
        if (Array.isArray(bookData.authors)) {
          authors = bookData.authors;
        } else if (typeof bookData.authors === 'string') {
          authors = [bookData.authors];
        }
      }
      
      // Garantir que genres seja sempre um array
      let genres: string[] = [];
      if (bookData.genres) {
        if (Array.isArray(bookData.genres)) {
          genres = bookData.genres;
        } else if (typeof bookData.genres === 'string') {
          genres = [bookData.genres];
        }
      }

      // Buscar estatísticas de empréstimo
      const loansRef = collection(db, `users/${userId}/loans`);
      const loansQuery = query(loansRef, where('bookId', '==', bookId));
      const loansSnapshot = await getDocs(loansQuery);
      
      const loanCount = loansSnapshot.size;
      const activeLoans = loansSnapshot.docs.filter(doc => doc.data().status === 'active').length;
      const totalCopies = bookData.totalCopies || bookData.quantity || 1;
      const availableCopies = Math.max(0, totalCopies - activeLoans);
      
      // Verificar reservas
      const reservationsRef = collection(db, `users/${userId}/reservations`);
      const reservationsQuery = query(
        reservationsRef, 
        where('bookId', '==', bookId),
        where('status', '==', 'ready')
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const readyReservations = reservationsSnapshot.size;
      
      let isAvailable = availableCopies > 0;
      if (isAvailable && activeLoans === 0 && readyReservations >= availableCopies) {
        isAvailable = false;
      }

      return {
        id: bookDoc.id,
        title: bookData.title || 'Título não informado',
        authors,
        genres,
        description: bookData.description, // Descrição interna para gestor
        synopsis: bookData.synopsis, // Sinopse pública para alunos
        loanCount,
        available: isAvailable,
        createdAt: bookData.createdAt?.toDate ? bookData.createdAt.toDate() : new Date(),
        coverUrl: bookData.coverUrl
      };
    } catch (error) {
      console.error('Erro ao buscar livro por ID:', error);
      return null;
    }
  }
};
