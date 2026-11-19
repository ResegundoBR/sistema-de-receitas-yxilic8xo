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
    'Veja o passo a passo completo desta receita deliciosa no Sistema de Receitas.'
  const coverFile = recipe.getString('cover')

  let imageUrl = 'https://img.usecurling.com/p/1200/630?q=recipe,food'
  if (coverFile) {
    imageUrl = '/api/files/' + recipe.collection().id + '/' + recipe.id + '/' + coverFile
  }

  const currentUrl = e.request.url.string()

  if (isCrawler) {
    const authorName = author ? author.getString('display_name') : username
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title} | Sistema de Receitas</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${currentUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p>Por ${authorName}</p>
</body>
</html>`
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
