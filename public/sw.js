// Service Worker do Rodela — PWA com suporte offline e atualização automática.
//
// Estratégia de cache:
//  - Navegações e index.html: NETWORK-FIRST (a versão nova chega no primeiro F5,
//    sem Ctrl+Shift+R e sem limpar dados do site).
//  - Assets com hash no nome (JS/CSS em /assets/): CACHE-FIRST — são imutáveis,
//    cada build gera nomes novos, então cache nunca serve versão velha.
//  - Demais estáticos (ícones, manifest, imagens locais): STALE-WHILE-REVALIDATE.
//  - Chamadas ao backend (PocketBase, /api/) e requisições não-GET: nunca passam
//    pelo cache — vão direto à rede.
//
// Atualização:
//  - skipWaiting() no install + clients.claim() no activate: a versão nova assume
//    o controle na primeira navegação após o deploy.
//  - O app (main.tsx) registra este SW com updateViaCache: 'none' — o próprio
//    sw.js nunca é lido do cache HTTP, então deploys não ficam presos por 24h.
//  - Caches de versões antigas são apagados no activate.

// Versão do cache: subir o número força todos os navegadores a baixar o shell
// e o bundle novos (o activate apaga os caches das versões antigas).
const CACHE_NAME = 'rodela-shell-v3'
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon.svg', '/icon-maskable.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Mesmo se o precache falhar (offline no primeiro acesso), o SW instala:
        // o fetch handler cobre o que faltou.
        console.log('SW precache falhou (instalando mesmo assim):', err)
        return self.skipWaiting()
      }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      )
      await self.clients.claim()
      console.log('SW ativo:', CACHE_NAME)
    })(),
  )
})

// O app avisa quando uma versão nova está esperando: ativa agora.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isAppShell(url) {
  return url.pathname === '/' || url.pathname === '/index.html'
}

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/')
}

async function cacheableResponse(response) {
  // Redirects e opaques não podem ir para cache.put.
  return response && response.ok && response.type !== 'opaque' ? response : null
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    const ok = await cacheableResponse(response)
    if (ok) cache.put(request, ok.clone())
    return response
  } catch (_) {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match('/index.html')) ||
      (await cache.match('/'))
    if (cached) return cached
    if (request.mode === 'navigate') {
      // Offline sem nada em cache: devolve o shell vazio em vez de quebrar.
      return new Response(
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Rodela</title></head><body style="font-family:sans-serif;background:#F7F2E8;color:#12100E;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Você está offline. Reconecte para carregar a Rodela.</p></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      )
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  const ok = await cacheableResponse(response)
  if (ok) cache.put(request, ok.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(async (response) => {
      const ok = await cacheableResponse(response)
      if (ok) cache.put(request, ok.clone())
      return response
    })
    .catch(() => null)
  return (
    cached || (await network) || new Response('Offline', { status: 503, statusText: 'Offline' })
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Só intercepta o próprio app: backend (PocketBase), CDN de imagens, scripts
  // externos etc. vão direto à rede.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  // App shell e navegações: rede primeiro — atualizações chegam no F5 normal.
  if (request.mode === 'navigate' || isAppShell(url)) {
    event.respondWith(networkFirst(request))
    return
  }

  // JS/CSS com hash no nome: imutáveis por build — cache primeiro.
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Outros estáticos: serve do cache e atualiza em paralelo.
  event.respondWith(staleWhileRevalidate(request))
})
