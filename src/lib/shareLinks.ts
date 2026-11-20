// URLs de compartilhamento público do Rodela.
//
// O frontend (*.goskip.app) serve APENAS arquivos estáticos — não executa
// hooks. O hook GET /r/{username}/{slug} (routes.pb.js, com as meta tags OG
// que montam o cartão do WhatsApp) responde apenas no domínio do BACKEND.
// Por isso todo link compartilhável aponta para o backend; o próprio hook
// redireciona humanos (302) para o frontend.
//
// VITE_POCKETBASE_URL é gerido pela Skip Cloud e aponta para o backend.

const BACKEND_BASE_URL = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/+$/, '')

/** Base absoluta do frontend (destino do redirect para humanos no hook). */
export const FRONTEND_BASE_URL = 'https://sistema-de-receitas-6b58a.goskip.app'

/** Link compartilhável de uma receita pública, apontando para o backend. */
export function publicRecipeUrl(username: string, slug: string): string {
  return `${BACKEND_BASE_URL}/r/${username}/${slug}`
}

/** Normaliza barras duplicadas (//r/ → /r/) em links antigos tortos. */
export function normalizePublicRecipeUrl(url: string): string {
  return url.replace(/([^:])\/{2,}/g, '$1/')
}
