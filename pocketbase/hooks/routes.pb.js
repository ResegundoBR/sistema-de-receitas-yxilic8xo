// pocketbase/hooks/routes.pb.js

// 1. GET /r/{username}/{slug} — Public share link with crawler OG tags & human redirection
//    + rota curinga que normaliza barras duplicadas (//r/… → /r/…): o router
//    do PocketBase não casa um path torto no template, então a variante com
//    {segments...} captura o path inteiro, limpa as barras e 302 para o caminho
//    limpo — onde o hook de OG tags responde.
routerAdd('GET', '/r/{segments...}', (e) => {
  const FRONTEND_BASE_URL = 'https://sistema-de-receitas-6b58a.goskip.app'
  const raw = e.request.pathValue('segments') || ''
  const parts = raw
    .split('/')
    .filter(function (p) {
      return p !== ''
    })
    .slice(0, 2)
  if (parts.length < 2) {
    return e.redirect(302, FRONTEND_BASE_URL)
  }
  return e.redirect(302, FRONTEND_BASE_URL + '/r/' + parts[0] + '/' + parts[1])
})

// Rota limpa: serve SEMPRE 200 com o HTML completo de OG tags — sem mais
// bifurcação por User-Agent nem 302 no servidor. O redirect de humanos passa
// a ser feito por JavaScript dentro da própria página (location.replace),
// então crawler e browser recebem a mesma resposta 200 (o WhatsApp às vezes
// não segue 302 e sai com o cartão vazio).
routerAdd('GET', '/r/{username}/{slug}', (e) => {
  // Domínios reais deste projeto (Skip Cloud) — declarados DENTRO do callback:
  // o JSVM roda callbacks em pool separado, constantes de topo dão
  // ReferenceError (ver deploy desta run).
  const FRONTEND_BASE_URL = 'https://sistema-de-receitas-6b58a.goskip.app'
  const BACKEND_BASE_URL = 'https://sistema-de-receitas-6b58a.shrd01.internal.goskip.dev'
  const username = e.request.pathValue('username')
  const slug = e.request.pathValue('slug')
  const userAgent = (e.request.header.get('user-agent') || '').toLowerCase()

  // Detecção de crawler AMPLIADA — só usada para omitir o script de redirect
  // do HTML (crawler vê a página pura); a decisão final de redirecionar é do
  // próprio script, pelo navigator.userAgent do visitante.
  const isCrawler =
    /whatsapp|facebookexternalhit|facebot|meta-externalagent|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|bingbot|googlebot|instagram|pinterest|embedly|iframely/i.test(
      userAgent,
    )

  // Escapa &, <, >, ", ' para título/descrição/URL nunca quebrarem o HTML
  // das meta tags (aspas no título, &amp; na URL de arquivo, por exemplo).
  const escapeHtml = (s) =>
    String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  let author = null
  let recipe = null

  try {
    author = $app.findFirstRecordByData('_pb_users_auth_', 'username', username)
    recipe = $app.findFirstRecordByFilter(
      'recipes',
      'author = "' + author.id + '" && slug = "' + slug + '"',
    )

    // Check visibility
    const visibility = recipe.getString('visibility')
    const status = recipe.getString('status')

    if (status !== 'published' || visibility === 'private') {
      return e.string(404, 'Receita não encontrada ou privada')
    }
  } catch (_) {
    return e.string(404, 'Receita não encontrada')
  }

  const title = recipe.getString('title') || 'Receita'
  const description =
    recipe.getString('description') ||
    'Receita de gente de verdade: veja o passo a passo completo no Rodela.'
  const coverFile = recipe.getString('cover')

  // WhatsApp e demais redes exigem URL ABSOLUTA no og:image.
  // og:image aponta para a FOTO ORIGINAL da capa (sem ?thumb=): o recorte
  // sob demanda não consta nas thumbs registradas do registro e o WhatsApp
  // rejeita silenciosamente esse pedido irregular (cartão sai sem imagem).
  // og:image fica no BACKEND (a API de arquivos responde nele); a imagem
  // padrão (arquivo estático) fica no FRONTEND.
  let imageUrl = FRONTEND_BASE_URL + '/og-image.png'
  if (coverFile) {
    // URL montada de forma DETERMINÍSTICA com a constante fixa do backend:
    // atrás de proxy/TLS termination e.request.url.scheme pode vir vazio,
    // gerando "://host/..." — quebra o og:image do WhatsApp.
    imageUrl =
      BACKEND_BASE_URL + '/api/files/' + recipe.collection().id + '/' + recipe.id + '/' + coverFile
  }

  // URL canônica para crawlers: rota no backend (é ela que os bots pedem).
  // Carrega o MESMO sufixo ?v={epoch} que o link compartilhado usa
  // (src/lib/shareLinks.ts: Math.floor(Date.parse(updated)/1000)) — sem isso o
  // WhatsApp resolve o link com ?v= para a identidade canônica sem sufixo e
  // reexibe a prévia em cache de versões antigas quebradas.updated → created →
  // sem sufixo. Declarado dentro do callback (regra do JSVM).
  const versionStamp = (function () {
    const fields = ['updated', 'created']
    for (let i = 0; i < fields.length; i++) {
      try {
        const iso = recipe.getDateTime(fields[i]).string()
        // PocketBase serializa DateTime com espaço ("2026-01-02 03:04:05.000Z");
        // alguns Date.parse só aceitam a forma ISO com "T" — tenta as duas.
        let ms = Date.parse(iso)
        if (isNaN(ms)) ms = Date.parse(String(iso).replace(' ', 'T'))
        if (!isNaN(ms)) return String(Math.floor(ms / 1000))
      } catch (_) {}
    }
    return ''
  })()
  const currentUrl =
    BACKEND_BASE_URL + '/r/' + username + '/' + slug + (versionStamp ? '?v=' + versionStamp : '')

  // Redirect de humanos: client-side, dentro da própria página (o servidor não
  // manda mais 302 — o WhatsApp às vezes não segue 302 e sai com o cartão
  // vazio). No domínio do backend não há SPA (só hooks e API), então o script
  // leva o navegador humano ABSOLUTO ao frontend. Crawlers (isCrawler acima)
  // recebem o HTML puro, sem o script — mas o próprio script também decide
  // pelo navigator.userAgent, cobrindo qualquer bot que baixe a página.
  const redirectScript = isCrawler
    ? ''
    : `<script>
  if (typeof window !== 'undefined' && window.location) {
    var ua = navigator.userAgent || ''
    if (!/bot|crawl|spider|whatsapp|facebookexternalhit|embed/i.test(ua)) {
      window.location.replace(${JSON.stringify(
        FRONTEND_BASE_URL +
          '/r/' +
          username +
          '/' +
          slug +
          (versionStamp ? '?v=' + versionStamp : ''),
      )})
    }
  }
</script>`

  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImageUrl = escapeHtml(imageUrl)
  const safeCurrentUrl = escapeHtml(currentUrl)

  // Nome de exibição vem da coleção users (recipes.author_name não existe)
  const authorName = author ? author.getString('display_name') : username

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${safeTitle} | Rodela</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Rodela">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${safeTitle}">
  <meta property="og:url" content="${safeCurrentUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImageUrl}">
  <meta name="twitter:image:alt" content="${safeTitle}">
  ${redirectScript}
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDescription}</p>
<p>Por ${escapeHtml(authorName)}</p>
<noscript><a href="${escapeHtml(FRONTEND_BASE_URL + '/r/' + username + '/' + slug)}">Abrir a receita no Rodela</a></noscript>
</body>
</html>`

  e.response.header().set('Cache-Control', 'public, max-age=300')
  return e.html(200, html)
})

// 2. GET /backend/v1/recipes/facet?tags=a,b,c
// Intersects multiple tags using tag_index (|tag1|tag2|)
routerAdd('GET', '/backend/v1/recipes/facet', (e) => {
  const tagsParam = e.request.url.query().get('tags') || ''
  const searchParam = e.request.url.query().get('q') || ''
  const categoryParam = e.request.url.query().get('category') || ''

  const tagList = tagsParam
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)

  let filterParts = ['status = "published"', 'visibility = "public"']

  if (categoryParam) {
    filterParts.push('category = "' + categoryParam + '"')
  }

  if (searchParam) {
    const normalized = searchParam
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (normalized) {
      filterParts.push('search_text ~ "' + normalized + '"')
    }
  }

  for (let i = 0; i < tagList.length; i++) {
    filterParts.push('tag_index ~ "|' + tagList[i] + '|"')
  }

  const finalFilter = filterParts.join(' && ')

  try {
    const records = $app.findRecordsByFilter('recipes', finalFilter, '-created', 100, 0)
    const results = []
    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      let authorName = ''
      let authorUsername = ''
      try {
        const a = $app.findRecordById('_pb_users_auth_', r.getString('author'))
        authorName = a.getString('display_name')
        authorUsername = a.getString('username')
      } catch (_) {}

      results.push({
        id: r.id,
        title: r.getString('title'),
        slug: r.getString('slug'),
        description: r.getString('description'),
        cover: r.getString('cover'),
        prep_minutes: r.getInt('prep_minutes'),
        cook_minutes: r.getInt('cook_minutes'),
        difficulty: r.getInt('difficulty'),
        yield_quantity: r.getInt('yield_quantity'),
        yield_unit: r.getString('yield_unit'),
        license: r.getString('license'),
        status: r.getString('status'),
        visibility: r.getString('visibility'),
        tag_index: r.getString('tag_index'),
        created: r.getString('created'),
        author: {
          id: r.getString('author'),
          display_name: authorName,
          username: authorUsername,
        },
      })
    }
    return e.json(200, { items: results, total: results.length })
  } catch (err) {
    return e.json(500, { error: err.message })
  }
})
