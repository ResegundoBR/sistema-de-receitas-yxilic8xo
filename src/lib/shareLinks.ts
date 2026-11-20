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

/** Monta o link de uma receita a partir do username, do slug e do registro. */
export function publicRecipeUrl(
  username: string,
  slug: string,
  record?: { updated?: string; created?: string } | null,
): string {
  const base = `${BACKEND_BASE_URL}/r/${username}/${slug}`
  const stamp = recordVersionStamp(record)
  return stamp ? `${base}?v=${stamp}` : base
}

/** Normaliza barras duplicadas (//r/ → /r/) em links antigos tortos. */
export function normalizePublicRecipeUrl(url: string): string {
  return url.replace(/([^:])\/{2,}/g, '$1/')
}
