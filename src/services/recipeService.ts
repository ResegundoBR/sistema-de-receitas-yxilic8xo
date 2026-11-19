import pb from '@/lib/pocketbase/client'
import {
  Recipe,
  Category,
  Tag,
  Ingredient,
  RecipeIngredient,
  RecipeStep,
  RecipeCollection,
  SavedRecipe,
} from '@/types/recipe'
import { normalizeSearchText, slugify } from '@/lib/normalize'

const OFFLINE_RECIPES_KEY = 'receitas_offline_cache'

export const recipeService = {
  // Get all public recipes with optional category and search filters
  async getPublicRecipes(options?: {
    search?: string
    categorySlug?: string
    tags?: string[] // slug array
    page?: number
    perPage?: number
  }): Promise<{ items: Recipe[]; totalItems: number }> {
    try {
      const filters: string[] = ['status = "published"', 'visibility = "public"']

      if (options?.categorySlug) {
        // Find category id by slug
        try {
          const cat = await pb
            .collection('categories')
            .getFirstListItem<Category>(`slug = "${options.categorySlug}"`)
          if (cat) {
            // Also include subcategories if any
            const subcats = await pb.collection('categories').getFullList<Category>({
              filter: `parent = "${cat.id}"`,
            })
            if (subcats.length > 0) {
              const ids = [cat.id, ...subcats.map((s) => s.id)].map((id) => `"${id}"`).join(',')
              filters.push(`category ?= [${ids}]`)
            } else {
              filters.push(`category = "${cat.id}"`)
            }
          }
        } catch {
          /* intentionally ignored */
        }
      }

      if (options?.search) {
        const normalized = normalizeSearchText(options.search)
        if (normalized) {
          filters.push(`search_text ~ "${normalized}"`)
        }
      }

      if (options?.tags && options.tags.length > 0) {
        // Tag intersection: each tag must exist inside tag_index ("|tag1|tag2|")
        for (const tagSlug of options.tags) {
          if (tagSlug.trim()) {
            filters.push(`tag_index ~ "|${tagSlug.trim()}|"`)
          }
        }
      }

      const res = await pb
        .collection('recipes')
        .getList<Recipe>(options?.page || 1, options?.perPage || 30, {
          filter: filters.join(' && '),
          sort: '-created',
          expand: 'author,category',
        })

      // Save top recipes to localStorage for offline access
      try {
        localStorage.setItem(OFFLINE_RECIPES_KEY, JSON.stringify(res.items.slice(0, 20)))
      } catch {
        /* intentionally ignored */
      }

      return {
        items: res.items,
        totalItems: res.totalItems,
      }
    } catch (err) {
      console.warn('Network request failed, attempting offline cache', err)
      // Offline fallback: load from local cache
      try {
        const raw = localStorage.getItem(OFFLINE_RECIPES_KEY)
        if (raw) {
          const cached: Recipe[] = JSON.parse(raw)
          let filtered = cached
          if (options?.search) {
            const normalized = normalizeSearchText(options.search)
            filtered = filtered.filter((r) => (r.search_text || '').includes(normalized))
          }
          if (options?.tags && options.tags.length > 0) {
            filtered = filtered.filter((r) => {
              const idx = r.tag_index || ''
              return options.tags!.every((t) => idx.includes(`|${t}|`))
            })
          }
          return { items: filtered, totalItems: filtered.length }
        }
      } catch {
        /* intentionally ignored */
      }
      throw err
    }
  },

  // Get recipe by author username and slug (public page /r/:username/:slug)
  async getByUsernameAndSlug(
    username: string,
    slug: string,
  ): Promise<{
    recipe: Recipe
    ingredients: RecipeIngredient[]
    steps: RecipeStep[]
    tags: Tag[]
  }> {
    // 1. Find user by username
    const author = await pb.collection('users').getFirstListItem(`username = "${username}"`)
    if (!author) {
      throw new Error('Autor não encontrado')
    }

    // 2. Find recipe
    const recipe = await pb
      .collection('recipes')
      .getFirstListItem<Recipe>(`author = "${author.id}" && slug = "${slug}"`, {
        expand: 'author,category',
      })

    // If recipe is private and current user is not author -> forbidden
    const currentUserId = pb.authStore.record?.id
    if (recipe.visibility === 'private' && recipe.author !== currentUserId) {
      throw new Error('Receita privada')
    }

    // 3. Load ingredients
    const ingredients = await pb.collection('recipe_ingredients').getFullList<RecipeIngredient>({
      filter: `recipe = "${recipe.id}"`,
      sort: 'position',
      expand: 'ingredient',
    })

    // 4. Load steps
    const steps = await pb.collection('recipe_steps').getFullList<RecipeStep>({
      filter: `recipe = "${recipe.id}"`,
      sort: 'position',
    })

    // 5. Load tags
    const recipeTags = await pb
      .collection('recipe_tags')
      .getFullList<{ tag: string; expand?: { tag?: Tag } }>({
        filter: `recipe = "${recipe.id}"`,
        expand: 'tag',
      })
    const tags = recipeTags.map((rt) => rt.expand?.tag).filter(Boolean) as Tag[]

    // Cache this single recipe in offline cache for offline view
    try {
      localStorage.setItem(
        `recipe_view_${username}_${slug}`,
        JSON.stringify({ recipe, ingredients, steps, tags }),
      )
    } catch {
      /* intentionally ignored */
    }

    return { recipe, ingredients, steps, tags }
  },

  // Get recipes for "Minha Cozinha" (all recipes by logged-in user: draft, published, archived)
  async getMyRecipes(): Promise<Recipe[]> {
    const currentUserId = pb.authStore.record?.id
    if (!currentUserId) return []

    return await pb.collection('recipes').getFullList<Recipe>({
      filter: `author = "${currentUserId}"`,
      sort: '-created',
      expand: 'category',
    })
  },

  // Archive recipe (status = "archived"). Never delete!
  async archiveRecipe(recipeId: string): Promise<Recipe> {
    return await pb.collection('recipes').update<Recipe>(recipeId, {
      status: 'archived',
    })
  },

  // Unarchive / restore
  async unarchiveRecipe(recipeId: string): Promise<Recipe> {
    return await pb.collection('recipes').update<Recipe>(recipeId, {
      status: 'published',
    })
  },

  // Create recipe with structured ingredients, steps and tags
  async createRecipe(data: {
    title: string
    description?: string
    story?: string
    category?: string
    cover?: File
    yield_quantity?: number
    yield_unit?: 'porcoes' | 'unidades' | 'g' | 'ml'
    prep_minutes?: number
    cook_minutes?: number
    difficulty?: number
    license: 'open' | 'credit' | 'ask' | 'closed'
    status: RecipeStatus
    visibility: 'public' | 'unlisted' | 'private'
    ingredients: Array<{
      raw_text: string
      ingredientId?: string
      quantity?: number
      unit?: string
      preparation?: string
      is_optional?: boolean
    }>
    steps: Array<{
      instruction: string
      duration_min?: number
      temperature_c?: number
      technique?: string
    }>
    tagIds: string[]
  }): Promise<Recipe> {
    const currentUserId = pb.authStore.record?.id
    if (!currentUserId) throw new Error('Usuário precisa estar autenticado')

    // Generate unique slug for this author
    let baseSlug = slugify(data.title) || 'receita'
    let slug = baseSlug
    let attempt = 1
    while (true) {
      try {
        const existing = await pb
          .collection('recipes')
          .getFirstListItem(`author = "${currentUserId}" && slug = "${slug}"`)
        if (existing) {
          attempt++
          slug = `${baseSlug}-${attempt}`
        } else {
          break
        }
      } catch (_) {
        // Not found, slug is free
        break
      }
    }

    const formData = new FormData()
    formData.append('author', currentUserId)
    formData.append('title', data.title)
    formData.append('slug', slug)
    if (data.description) formData.append('description', data.description)
    if (data.story) formData.append('story', data.story)
    if (data.category) formData.append('category', data.category)
    if (data.cover) formData.append('cover', data.cover)
    if (data.yield_quantity) formData.append('yield_quantity', String(data.yield_quantity))
    if (data.yield_unit) formData.append('yield_unit', data.yield_unit)
    if (data.prep_minutes) formData.append('prep_minutes', String(data.prep_minutes))
    if (data.cook_minutes) formData.append('cook_minutes', String(data.cook_minutes))
    if (data.difficulty) formData.append('difficulty', String(data.difficulty))
    formData.append('license', data.license)
    formData.append('status', data.status)
    formData.append('visibility', data.visibility)
    formData.append('ingredient_count', String(data.ingredients.length))

    // Save recipe
    const createdRecipe = await pb.collection('recipes').create<Recipe>(formData)

    // Save ingredients
    for (let i = 0; i < data.ingredients.length; i++) {
      const ing = data.ingredients[i]
      await pb.collection('recipe_ingredients').create({
        recipe: createdRecipe.id,
        position: i + 1,
        ingredient: ing.ingredientId || null,
        raw_text: ing.raw_text,
        quantity: ing.quantity || null,
        unit: ing.unit || '',
        preparation: ing.preparation || '',
        is_optional: !!ing.is_optional,
      })
    }

    // Save steps
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      await pb.collection('recipe_steps').create({
        recipe: createdRecipe.id,
        position: i + 1,
        instruction: step.instruction,
        duration_min: step.duration_min || null,
        temperature_c: step.temperature_c || null,
        technique: step.technique || '',
      })
    }

    // Save tags (this automatically triggers the hook to update tag_index!)
    for (const tagId of data.tagIds) {
      await pb.collection('recipe_tags').create({
        recipe: createdRecipe.id,
        tag: tagId,
      })
    }

    return createdRecipe
  },

  // Update existing recipe (slug remains immutable)
  async updateRecipe(
    recipeId: string,
    data: {
      title: string
      description?: string
      story?: string
      category?: string
      cover?: File
      yield_quantity?: number
      yield_unit?: 'porcoes' | 'unidades' | 'g' | 'ml'
      prep_minutes?: number
      cook_minutes?: number
      difficulty?: number
      license: 'open' | 'credit' | 'ask' | 'closed'
      status: RecipeStatus
      visibility: 'public' | 'unlisted' | 'private'
      ingredients: Array<{
        id?: string
        raw_text: string
        ingredientId?: string
        quantity?: number
        unit?: string
        preparation?: string
        is_optional?: boolean
      }>
      steps: Array<{
        id?: string
        instruction: string
        duration_min?: number
        temperature_c?: number
        technique?: string
      }>
      tagIds: string[]
    },
  ): Promise<Recipe> {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.story !== undefined) formData.append('story', data.story)
    if (data.category !== undefined) formData.append('category', data.category)
    if (data.cover) formData.append('cover', data.cover)
    if (data.yield_quantity !== undefined)
      formData.append('yield_quantity', String(data.yield_quantity))
    if (data.yield_unit !== undefined) formData.append('yield_unit', data.yield_unit)
    if (data.prep_minutes !== undefined) formData.append('prep_minutes', String(data.prep_minutes))
    if (data.cook_minutes !== undefined) formData.append('cook_minutes', String(data.cook_minutes))
    if (data.difficulty !== undefined) formData.append('difficulty', String(data.difficulty))
    formData.append('license', data.license)
    formData.append('status', data.status)
    formData.append('visibility', data.visibility)
    formData.append('ingredient_count', String(data.ingredients.length))

    const updated = await pb.collection('recipes').update<Recipe>(recipeId, formData)

    // Delete existing ingredients & steps & tags, then re-insert
    const oldIngs = await pb
      .collection('recipe_ingredients')
      .getFullList({ filter: `recipe = "${recipeId}"` })
    for (const oi of oldIngs) await pb.collection('recipe_ingredients').delete(oi.id)

    for (let i = 0; i < data.ingredients.length; i++) {
      const ing = data.ingredients[i]
      await pb.collection('recipe_ingredients').create({
        recipe: recipeId,
        position: i + 1,
        ingredient: ing.ingredientId || null,
        raw_text: ing.raw_text,
        quantity: ing.quantity || null,
        unit: ing.unit || '',
        preparation: ing.preparation || '',
        is_optional: !!ing.is_optional,
      })
    }

    const oldSteps = await pb
      .collection('recipe_steps')
      .getFullList({ filter: `recipe = "${recipeId}"` })
    for (const os of oldSteps) await pb.collection('recipe_steps').delete(os.id)

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      await pb.collection('recipe_steps').create({
        recipe: recipeId,
        position: i + 1,
        instruction: step.instruction,
        duration_min: step.duration_min || null,
        temperature_c: step.temperature_c || null,
        technique: step.technique || '',
      })
    }

    const oldTags = await pb
      .collection('recipe_tags')
      .getFullList({ filter: `recipe = "${recipeId}"` })
    for (const ot of oldTags) await pb.collection('recipe_tags').delete(ot.id)

    for (const tagId of data.tagIds) {
      await pb.collection('recipe_tags').create({
        recipe: recipeId,
        tag: tagId,
      })
    }

    return updated
  },

  // Helper to format file URL
  getFileUrl(recipe: Recipe, filename?: string): string {
    const file = filename || recipe.cover
    if (!file) return 'https://img.usecurling.com/p/800/600?q=recipe,delicious'
    return pb.files.getURL(recipe, file, { thumb: '400x300' })
  },

  getLargeFileUrl(recipe: Recipe, filename?: string): string {
    const file = filename || recipe.cover
    if (!file) return 'https://img.usecurling.com/p/1200/800?q=food,culinary'
    return pb.files.getURL(recipe, file, { thumb: '1200x0' })
  },
}

export const taxonomyService = {
  async getCategories(): Promise<Category[]> {
    return await pb.collection('categories').getFullList<Category>({
      sort: 'depth,sort_order,name',
    })
  },

  async getTags(): Promise<Tag[]> {
    return await pb.collection('tags').getFullList<Tag>({
      sort: 'dimension,name',
    })
  },

  async getIngredients(): Promise<Ingredient[]> {
    return await pb.collection('ingredients').getFullList<Ingredient>({
      sort: 'name',
    })
  },

  async createIngredient(
    name: string,
    category?: string,
    default_unit?: string,
    density_g_ml?: number,
  ): Promise<Ingredient> {
    const slug = slugify(name)
    return await pb.collection('ingredients').create<Ingredient>({
      name,
      slug,
      category: category || 'outros',
      default_unit: default_unit || 'g',
      density_g_ml: density_g_ml || 1.0,
    })
  },
}

export const collectionService = {
  async getMyCollections(): Promise<RecipeCollection[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    return await pb.collection('collections').getFullList<RecipeCollection>({
      filter: `owner = "${userId}"`,
      sort: '-created',
    })
  },

  async createCollection(name: string, is_private = true): Promise<RecipeCollection> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Não autenticado')
    return await pb.collection('collections').create<RecipeCollection>({
      owner: userId,
      name,
      is_private,
    })
  },

  async getMySavedRecipes(): Promise<SavedRecipe[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []
    return await pb.collection('saved_recipes').getFullList<SavedRecipe>({
      filter: `owner = "${userId}"`,
      sort: '-created',
      expand: 'recipe,recipe.author,collection',
    })
  },

  async saveRecipe(recipeId: string, collectionId?: string): Promise<SavedRecipe> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Não autenticado')
    return await pb.collection('saved_recipes').create<SavedRecipe>({
      owner: userId,
      recipe: recipeId,
      collection: collectionId || null,
    })
  },

  async removeSavedRecipe(savedId: string): Promise<boolean> {
    return await pb.collection('saved_recipes').delete(savedId)
  },

  async isRecipeSaved(recipeId: string): Promise<SavedRecipe | null> {
    const userId = pb.authStore.record?.id
    if (!userId) return null
    try {
      return await pb
        .collection('saved_recipes')
        .getFirstListItem<SavedRecipe>(`owner = "${userId}" && recipe = "${recipeId}"`)
    } catch (_) {
      return null
    }
  },
}
