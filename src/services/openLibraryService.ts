/**
 * Serviço para integração com a API da Open Library
 * Documentação: https://openlibrary.org/developers/api
 * Search API: https://openlibrary.org/dev/docs/api/search
 *
 * Boas práticas: User-Agent com nome do app e contato para maior rate limit (3 req/s).
 */

import type { FormattedBookResult } from './googleBooksService';
import { isValidIsbn, normalizeIsbnInput, pickIsbnFromOpenLibraryList } from '../utils/isbn';

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_COVER_BASE = 'https://covers.openlibrary.org/b/id';

/** Cabeçalhos recomendados pela documentação para identificação e rate limit maior */
const DEFAULT_HEADERS: HeadersInit = {
  'User-Agent': 'Bibliotech (https://github.com/bibliotech)',
  Accept: 'application/json',
};

export interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  publisher?: string[];
  first_sentence?: string | string[];
  number_of_pages_median?: number;
}

export interface OpenLibrarySearchResponse {
  num_found: number;
  start: number;
  docs: OpenLibraryDoc[];
}

/**
 * Monta a URL da capa usando cover_i (ID numérico) da Open Library.
 * Tamanhos: S, M, L. Usamos M para thumbnail e L para capa.
 */
function getCoverUrls(coverId: number | undefined): { thumbnail: string; coverUrl: string } {
  if (!coverId) return { thumbnail: '', coverUrl: '' };
  const base = `${OPEN_LIBRARY_COVER_BASE}/${coverId}`;
  return {
    thumbnail: `${base}-M.jpg`,
    coverUrl: `${base}-L.jpg`,
  };
}

/**
 * Normaliza first_sentence que pode vir como string ou array de strings.
 */
function getFirstSentence(doc: OpenLibraryDoc): string {
  const raw = doc.first_sentence;
  if (!raw) return 'Sinopse não disponível';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) return raw[0];
  return 'Sinopse não disponível';
}

/**
 * Gera um ID estável para o resultado (key da OL ou key + primeiro isbn).
 */
function getStableId(doc: OpenLibraryDoc): string {
  const key = (doc.key || '').replace(/^\//, '').replace(/\//g, '_');
  if (key) return key;
  const isbn = doc.isbn?.[0];
  return isbn ? `isbn_${isbn}` : `ol_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Busca livros na API da Open Library (título ou ISBN).
 * Retorna resultados no mesmo formato do Google Books, com source: 'openlibrary'.
 */
export async function searchOpenLibrary(
  query: string
): Promise<(FormattedBookResult & { source: 'openlibrary' })[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('O termo de busca não pode estar vazio');
  }

  const normalizedQuery = normalizeIsbnInput(trimmed);
  const isbnSearch = isValidIsbn(normalizedQuery);
  const searchQuery = isbnSearch ? `isbn:${normalizedQuery}` : trimmed;
  const params = new URLSearchParams({
    q: searchQuery,
    limit: '10',
  });

  const url = `${OPEN_LIBRARY_SEARCH_URL}?${params.toString()}`;

  const response = await fetch(url, { headers: DEFAULT_HEADERS });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Erro ${response.status} na API da Open Library${errorBody ? ': ' + errorBody : ''}`
    );
  }

  const data: OpenLibrarySearchResponse = await response.json();

  if (!data.docs || data.docs.length === 0) {
    return [];
  }

  return data.docs
    .filter((doc) => doc.title)
    .map((doc) => {
      const { thumbnail, coverUrl } = getCoverUrls(doc.cover_i);
      const publisher =
        Array.isArray(doc.publisher) && doc.publisher.length > 0
          ? doc.publisher[0]
          : undefined;
      const publishedDate = doc.first_publish_year
        ? String(doc.first_publish_year)
        : undefined;
      const isbn = pickIsbnFromOpenLibraryList(
        doc.isbn,
        isbnSearch ? normalizedQuery : undefined
      );
      return {
        id: getStableId(doc),
        title: doc.title!,
        authors: doc.author_name || [],
        synopsis: getFirstSentence(doc),
        coverUrl,
        thumbnail,
        publisher,
        publishedDate,
        isbn,
        source: 'openlibrary' as const,
      };
    });
}
