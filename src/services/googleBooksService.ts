/**
 * Serviço para integração com a API do Google Books
 * Documentação: https://developers.google.com/books/docs/v1/using
 */

import {
  isValidIsbn,
  normalizeIsbnInput,
  pickIsbnFromIndustryIdentifiers,
} from '../utils/isbn';

export interface GoogleBookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    publisher?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBookResult[];
  totalItems: number;
}

export interface FormattedBookResult {
  id: string;
  title: string;
  authors: string[];
  synopsis: string;
  coverUrl: string;
  thumbnail: string;
  publisher?: string;
  publishedDate?: string;
  /** ISBN-10 ou ISBN-13 quando informado pela API */
  isbn?: string;
  /** Origem do resultado: Google Books ou Open Library */
  source?: 'google' | 'openlibrary';
}

/**
 * Busca livros na API do Google Books
 * @param query - Termo de busca (título do livro)
 * @returns Promise com array de resultados formatados
 */
export const searchGoogleBooks = async (query: string): Promise<FormattedBookResult[]> => {
  if (!query.trim()) {
    throw new Error('O termo de busca não pode estar vazio');
  }

  try {
    const cleanQuery = query.trim();
    const normalizedIsbn = normalizeIsbnInput(cleanQuery);
    const isbn = isValidIsbn(normalizedIsbn);
    const searchQuery = isbn ? `isbn:${normalizedIsbn}` : cleanQuery;
    const encodedQuery = encodeURIComponent(searchQuery);

    const apiKey = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=10${keyParam}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      // Mensagens amigáveis para erros conhecidos (evita exibir JSON bruto ao usuário)
      if (response.status === 503 || response.status === 502) {
        console.error('Google Books API indisponível:', response.status, errorBody);
        throw new Error(
          'O serviço do Google Books está temporariamente indisponível. Tente novamente em alguns minutos.'
        );
      }
      if (response.status === 429) {
        console.error('Google Books API rate limit:', errorBody);
        throw new Error(
          'Muitas buscas em pouco tempo. Aguarde alguns minutos e tente novamente.'
        );
      }
      if (response.status >= 500) {
        console.error('Erro do servidor Google Books:', response.status, errorBody);
        throw new Error(
          'Erro temporário no serviço do Google Books. Tente novamente em alguns minutos.'
        );
      }
      throw new Error(`Erro ${response.status} na API do Google Books${errorBody ? ': ' + errorBody : ''}`);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Formatar os resultados
    return data.items.map(formatBookResult).filter((book): book is FormattedBookResult => book !== null);
  } catch (error) {
    console.error('Erro ao buscar livros no Google Books:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Não foi possível buscar livros. Verifique sua conexão e tente novamente.');
  }
};

/**
 * Formata um resultado da API do Google Books para o formato usado no sistema
 */
const formatBookResult = (item: GoogleBookResult): FormattedBookResult | null => {
  try {
    const { volumeInfo } = item;
    
    // Título é obrigatório
    if (!volumeInfo.title) {
      return null;
    }
    
    // Obter URL da capa (preferir thumbnail maior, fallback para menor)
    const thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
    
    // Converter thumbnail para HTTPS e obter versão de maior qualidade
    const coverUrl = thumbnail
      ? thumbnail.replace('http://', 'https://').replace('&zoom=1', '&zoom=2')
      : '';
    
    const thumbnailUrl = thumbnail
      ? thumbnail.replace('http://', 'https://')
      : '';
    
    const isbnId = pickIsbnFromIndustryIdentifiers(volumeInfo.industryIdentifiers);

    return {
      id: item.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || [],
      synopsis: volumeInfo.description || 'Sinopse não disponível',
      coverUrl: coverUrl,
      thumbnail: thumbnailUrl,
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate,
      isbn: isbnId,
      source: 'google' as const,
    };
  } catch (error) {
    console.error('Erro ao formatar resultado do livro:', error);
    return null;
  }
};

/**
 * Trunca texto para exibição no dropdown
 */
export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
};

