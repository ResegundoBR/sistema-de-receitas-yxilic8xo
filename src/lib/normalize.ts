/**
 * Text normalization utility for search
 * Converts to lowercase, strips accents/diacritics, strips punctuation and trims extra whitespace.
 * Searching for "pao" matches "Pão" and searching for "pão" matches "Pao".
 */
export function normalizeSearchText(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Creates a URL-friendly slug from a title
 */
export function slugify(text: string): string {
  return normalizeSearchText(text).replace(/\s+/g, '-').slice(0, 100)
}
