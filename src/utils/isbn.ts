/**
 * Normaliza entrada do usuário para comparação (remove hífens/espaços, ISBN-10 com X maiúsculo).
 */
export function normalizeIsbnInput(raw: string): string {
  return raw.replace(/[-\s]/g, '').trim().toUpperCase();
}

/**
 * Verifica se a string já normalizada tem formato de ISBN-10 ou ISBN-13 (não valida dígito verificador).
 */
export function isValidIsbn(normalized: string): boolean {
  if (!normalized) return false;
  if (/^\d{13}$/.test(normalized)) return true;
  if (/^\d{9}[\dX]$/.test(normalized)) return true;
  return false;
}

export function isValidIsbnRaw(raw: string): boolean {
  return isValidIsbn(normalizeIsbnInput(raw));
}

/**
 * Extrai o melhor identificador a partir da lista industryIdentifiers do Google Books.
 */
export function pickIsbnFromIndustryIdentifiers(
  identifiers?: { type?: string; identifier?: string }[]
): string | undefined {
  if (!identifiers?.length) return undefined;
  const isbn13 = identifiers.find((i) => i.type === 'ISBN_13' && i.identifier);
  if (isbn13?.identifier) return isbn13.identifier.replace(/[-\s]/g, '');
  const isbn10 = identifiers.find((i) => i.type === 'ISBN_10' && i.identifier);
  if (isbn10?.identifier) return isbn10.identifier.replace(/[-\s]/g, '').toUpperCase();
  return undefined;
}

/**
 * Escolhe um ISBN da lista da Open Library, priorizando o que bate com a busca e depois ISBN-13.
 */
export function pickIsbnFromOpenLibraryList(
  list: string[] | undefined,
  normalizedQuery?: string
): string | undefined {
  if (!list?.length) return undefined;
  const cleaned = list.map((s) => normalizeIsbnInput(s)).filter(Boolean);
  if (normalizedQuery && isValidIsbn(normalizedQuery)) {
    const match = cleaned.find((c) => c === normalizedQuery);
    if (match) return match;
  }
  const isbn13 = cleaned.find((c) => c.length === 13 && /^\d{13}$/.test(c));
  if (isbn13) return isbn13;
  const isbn10 = cleaned.find((c) => isValidIsbn(c) && c.length === 10);
  if (isbn10) return isbn10;
  return cleaned[0];
}
