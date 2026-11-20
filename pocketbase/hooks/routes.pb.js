// pocketbase/hooks/routes.pb.js

// 1. GET /r/{username}/{slug} — Public share link with crawler OG tags & human redirection
routerAdd('GET', '/r/{username}/{slug}', (e) => {
  const username = e.request.pathValue('username')
  const slug = e.request.pathValue('slug')
  const userAgent = (e.request.header.get('user-agent') || '').toLowerCase()

  // Detect social crawlers / bots
  const isCrawler =
    /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|bingbot|googlebot/i.test(
      userAgent,
    )

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
  // Thumbs do PocketBase são geradas sob demanda via ?thumb= (não é migração).
  const PUBLIC_BASE_URL = 'https://sistema-de-receitas-6b58a.goskip.app'
  // Imagem padrão (receita sem capa), absoluta no domínio real do app.
  let imageUrl = PUBLIC_BASE_URL + '/og-receita-padrao.jpg'
  if (coverFile) {
    imageUrl =
      PUBLIC_BASE_URL +
      '/api/files/' +
      recipe.collection().id +
      '/' +
      recipe.id +
      '/' +
      coverFile +
      '?thumb=1200x630'
  }

  const currentUrl = e.request.url.string()

  if (isCrawler) {
    // Escapa &, <, >, ", ' para o título/descrição nunca quebrarem o HTML
    // das meta tags (aspas no título, por exemplo).
    const escapeHtml = (s) =>
      String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')

    const safeTitle = escapeHtml(title)
    const safeDescription = escapeHtml(description)

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
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${currentUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${imageUrl}">
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <p>Por ${escapeHtml(authorName)}</p>
</body>
</html>`

    e.response.header().set('Cache-Control', 'public, max-age=300')
    return e.html(200, html)
  }

  // For human visitor, redirect to the frontend SPA route /r/:username/:slug
  return e.redirect(302, '/r/' + username + '/' + slug)
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
