/**
 * Serviço para integração com a API do Google Books
 * Documentação: https://developers.google.com/books/docs/v1/using
 */

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
    // Codificar o termo de busca para URL
    const encodedQuery = encodeURIComponent(query.trim());
    
    // URL da API do Google Books com limite de 10 resultados
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=10&langRestrict=pt`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Erro na API do Google Books: ${response.status}`);
    }
    
    const data: GoogleBooksResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Formatar os resultados
    return data.items.map(formatBookResult).filter((book): book is FormattedBookResult => book !== null);
  } catch (error) {
    console.error('Erro ao buscar livros no Google Books:', error);
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
    
    return {
      id: item.id,
      title: volumeInfo.title,
      authors: volumeInfo.authors || [],
      synopsis: volumeInfo.description || 'Sinopse não disponível',
      coverUrl: coverUrl,
      thumbnail: thumbnailUrl,
      publisher: volumeInfo.publisher,
      publishedDate: volumeInfo.publishedDate
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

