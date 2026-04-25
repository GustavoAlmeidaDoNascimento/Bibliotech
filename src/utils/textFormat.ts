/**
 * Autores (lista separada por vírgulas): em cada trecho entre vírgulas,
 * a primeira letra de cada palavra (delimitada por espaço) passa para maiúscula em pt-BR.
 * Vírgulas, espaços ao redor delas e o restante de cada palavra são preservados.
 */
export function formatAuthorsInput(value: string): string {
  return value
    .split(/(\s*,\s*)/)
    .map(segment => {
      if (/^\s*,\s*$/.test(segment)) return segment;
      return segment.replace(/(^|[\s\u00A0])(\S)/gu, (match, prefix, firstChar) => {
        return prefix + firstChar.toLocaleUpperCase('pt-BR');
      });
    })
    .join('');
}
