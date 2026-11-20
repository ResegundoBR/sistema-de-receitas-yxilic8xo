// URLs de compartilhamento público do Rodela.
//
// O frontend (*.goskip.app) serve APENAS arquivos estáticos — não executa
// hooks. O hook GET /r/{username}/{slug} (routes.pb.js, com as meta tags OG
// que montam o cartão do WhatsApp) responde apenas no domínio do BACKEND.
// Por isso todo link compartilhável aponta para o backend; o próprio hook
// redireciona humanos (302) para o frontend.
//
// O link carrega um sufixo de versão (?v=<epoch da atualização>) que muda
// sempre que a receita é editada — assim o cache do cartão do WhatsApp é
// invalidado e o cartão novo aparece depois de reenviar o link.
//
// VITE_POCKETBASE_URL é gerido pela Skip Cloud e aponta para o backend.

const BACKEND_BASE_URL = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/+$/, '')

/** Base absoluta do frontend (destino do redirect para humanos no hook). */
export const FRONTEND_BASE_URL = 'https://sistema-de-receitas-6b58a.goskip.app'

/** Epoch (segundos) da última atualização de um registro PocketBase, ou null. */
function recordVersionStamp(record?: { updated?: string; created?: string } | null): string | null {
  if (!record) return null
  const raw = record.updated || record.created || ''
  const ms = raw ? Date.parse(raw) : NaN
  return Number.isNaN(ms) ? null : String(Math.floor(ms / 1000))
}

/**
 * Normaliza barras duplicadas no caminho de uma URL, preservando o esquema
 * ("https://" continua intacto). Ex.: "https://h//r//user/slug" → "https://h/r/user/slug".
 */
export function normalizePublicRecipeUrl(url: string): string {
  const schemeMatch = url.match(/^[a-z][a-z0-9+.-]*:\/\//i)
  const scheme = schemeMatch ? schemeMatch[0] : ''
  const rest = url.slice(scheme.length)
  return scheme + rest.replace(/\/{2,}/g, '/')
}

/** Segmento de caminho limpo (sem barras nas pontas e sem espaços), ou ''. */
function cleanSegment(value: string | null | undefined): string {
  return (value || '').trim().replace(/^\/+|\/+$/g, '')
}

/**
 * Monta o link público de uma receita: {backend}/r/{username}/{slug}?v={epoch}.
 * Retorna '' quando username ou slug estão vazios — nunca monta "/r//...".
 * Quem chama deve tratar '' como "link indisponível".
 */
export function publicRecipeUrl(
  username: string,
  slug: string,
  record?: { updated?: string; created?: string } | null,
): string {
  const user = cleanSegment(username)
  const recipeSlug = cleanSegment(slug)
  if (!user || !recipeSlug) return ''
  const base = normalizePublicRecipeUrl(`${BACKEND_BASE_URL}/r/${user}/${recipeSlug}`)
  const stamp = recordVersionStamp(record)
  return stamp ? `${base}?v=${stamp}` : base
}
