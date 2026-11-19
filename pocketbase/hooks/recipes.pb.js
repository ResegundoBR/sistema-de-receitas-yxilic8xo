// pocketbase/hooks/recipes.pb.js

// 1. Hooks on recipes: create request
onRecordCreateRequest((e) => {
  const record = e.record
  const title = record.getString('title') || ''
  const description = record.getString('description') || ''
  const story = record.getString('story') || ''
  const fullText = title + ' ' + description + ' ' + story

  const normalized = fullText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  record.set('search_text', normalized)

  // Variant & license validation
  const parentId = record.getString('parent_recipe')
  if (parentId) {
    try {
      const parent = $app.findRecordById('recipes', parentId)
      const parentLicense = parent.getString('license')
      if (parentLicense === 'closed') {
        throw new BadRequestError(
          'A receita original possui licença "closed" e não permite criação de variantes.',
        )
      }
      const parentDepth = parent.getInt('variant_depth') || 0
      record.set('variant_depth', parentDepth + 1)
      const parentRoot = parent.getString('root_recipe')
      record.set('root_recipe', parentRoot || parent.id)
    } catch (err) {
      if (err instanceof BadRequestError) throw err
    }
  } else {
    record.set('variant_depth', 0)
  }

  e.next()
}, 'recipes')

// Hooks on recipes: update request
onRecordUpdateRequest((e) => {
  const record = e.record
  const title = record.getString('title') || ''
  const description = record.getString('description') || ''
  const story = record.getString('story') || ''
  const fullText = title + ' ' + description + ' ' + story

  const normalized = fullText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  record.set('search_text', normalized)

  const origSlug = record.original().getString('slug')
  const newSlug = record.getString('slug')
  if (origSlug && newSlug && origSlug !== newSlug) {
    throw new BadRequestError('O slug da receita é permanente e não pode ser alterado.')
  }

  e.next()
}, 'recipes')

// 2. Recipe Tags hooks to maintain tag_index in recipes
onRecordAfterCreateSuccess((e) => {
  const recipeId = e.record.getString('recipe')
  if (recipeId) {
    try {
      const recipe = $app.findRecordById('recipes', recipeId)
      const links = $app.findRecordsByFilter(
        'recipe_tags',
        'recipe = "' + recipeId + '"',
        '',
        100,
        0,
      )
      const slugs = []
      for (let i = 0; i < links.length; i++) {
        const tagId = links[i].getString('tag')
        if (tagId) {
          try {
            const t = $app.findRecordById('tags', tagId)
            const slug = t.getString('slug')
            if (slug && slugs.indexOf(slug) === -1) {
              slugs.push(slug)
            }
          } catch (_) {}
        }
      }
      const tagIndex = slugs.length > 0 ? '|' + slugs.join('|') + '|' : ''
      recipe.set('tag_index', tagIndex)
      $app.save(recipe)
    } catch (err) {
      console.error('Failed to update tag_index on create', recipeId, err)
    }
  }
  e.next()
}, 'recipe_tags')

onRecordAfterDeleteSuccess((e) => {
  const recipeId = e.record.getString('recipe')
  if (recipeId) {
    try {
      const recipe = $app.findRecordById('recipes', recipeId)
      const links = $app.findRecordsByFilter(
        'recipe_tags',
        'recipe = "' + recipeId + '"',
        '',
        100,
        0,
      )
      const slugs = []
      for (let i = 0; i < links.length; i++) {
        const tagId = links[i].getString('tag')
        if (tagId) {
          try {
            const t = $app.findRecordById('tags', tagId)
            const slug = t.getString('slug')
            if (slug && slugs.indexOf(slug) === -1) {
              slugs.push(slug)
            }
          } catch (_) {}
        }
      }
      const tagIndex = slugs.length > 0 ? '|' + slugs.join('|') + '|' : ''
      recipe.set('tag_index', tagIndex)
      $app.save(recipe)
    } catch (err) {
      console.error('Failed to update tag_index on delete', recipeId, err)
    }
  }
  e.next()
}, 'recipe_tags')

// (Reconciliação de contagens — cron e eventos de salvar/remover —
//  vive agora em saved_recipes.pb.js, por contagem real no banco.)
