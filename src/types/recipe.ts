export interface User {
  id: string
  username: string
  email: string
  name?: string
  display_name: string
  bio?: string
  city?: string
  state?: string
  avatar?: string
  role: 'user' | 'creator' | 'admin'
  created: string
  updated: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent?: string
  depth: number
  sort_order?: number
  icon?: string
  expand?: {
    parent?: Category
  }
}

export interface Tag {
  id: string
  name: string
  slug: string
  dimension:
    | 'ingrediente'
    | 'tecnica'
    | 'dieta'
    | 'ocasiao'
    | 'regiao'
    | 'equipamento'
    | 'estacao'
    | 'custo'
}

export interface Ingredient {
  id: string
  name: string
  slug: string
  category?: string
  default_unit?: string
  density_g_ml?: number
}

export interface RecipeIngredient {
  id?: string
  recipe?: string
  position: number
  ingredient?: string
  raw_text: string
  quantity?: number
  unit?: string
  preparation?: string
  is_optional?: boolean
  group_label?: string
  expand?: {
    ingredient?: Ingredient
  }
}

export interface RecipeStep {
  id?: string
  recipe?: string
  position: number
  instruction: string
  duration_min?: number
  temperature_c?: number
  technique?: string
  image?: string
  group_label?: string
}

export interface RecipeTag {
  id?: string
  recipe: string
  tag: string
  expand?: {
    tag?: Tag
  }
}

export type RecipeLicense = 'open' | 'credit' | 'ask' | 'closed'
export type RecipeStatus = 'draft' | 'published' | 'archived'
export type RecipeVisibility = 'public' | 'unlisted' | 'private'

export interface Recipe {
  id: string
  author: string
  category?: string
  title: string
  slug: string
  description?: string
  story?: string
  cover?: string
  yield_quantity?: number
  yield_unit?: 'porcoes' | 'unidades' | 'g' | 'ml'
  prep_minutes?: number
  cook_minutes?: number
  difficulty?: number
  license: RecipeLicense
  parent_recipe?: string
  root_recipe?: string
  variant_note?: string
  variant_depth?: number
  status: RecipeStatus
  visibility: RecipeVisibility
  cooksnap_count?: number
  variant_count?: number
  save_count?: number
  ingredient_count?: number
  search_text?: string
  tag_index?: string
  created: string
  updated: string
  expand?: {
    author?: User
    category?: Category
    'recipe_ingredients(recipe)'?: RecipeIngredient[]
    'recipe_steps(recipe)'?: RecipeStep[]
    'recipe_tags(recipe)'?: RecipeTag[]
  }
}

export interface RecipeCollection {
  id: string
  owner: string
  name: string
  is_private: boolean
  created: string
  updated: string
}

export interface SavedRecipe {
  id: string
  owner: string
  recipe: string
  collection?: string
  created: string
  updated: string
  expand?: {
    recipe?: Recipe
    collection?: RecipeCollection
  }
}
