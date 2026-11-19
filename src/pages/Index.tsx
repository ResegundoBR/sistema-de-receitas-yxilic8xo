import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { recipeService, taxonomyService } from '@/services/recipeService'
import { Recipe, Category, Tag } from '@/types/recipe'
import { RecipeCard } from '@/components/RecipeCard'
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  ChefHat,
  Tag as TagIcon,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchFromUrl = searchParams.get('q') || ''
  const categoryFromUrl = searchParams.get('categoria') || ''
  const tagsFromUrl = searchParams.get('tags')
    ? searchParams.get('tags')!.split(',').filter(Boolean)
    : []

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Local search query input state
  const [searchInput, setSearchInput] = useState(searchFromUrl)

  // Load taxonomies once
  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [catsData, tagsData] = await Promise.all([
          taxonomyService.getCategories(),
          taxonomyService.getTags(),
        ])
        setCategories(catsData)
        setTags(tagsData)
      } catch (err) {
        console.error('Failed to load categories/tags:', err)
      }
    }
    loadTaxonomies()
  }, [])

  // Fetch recipes whenever search params change
  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true)
      try {
        const res = await recipeService.getPublicRecipes({
          search: searchFromUrl,
          categorySlug: categoryFromUrl,
          tags: tagsFromUrl,
        })
        setRecipes(res.items)
      } catch (err) {
        console.error('Error fetching recipes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [searchFromUrl, categoryFromUrl, searchParams])

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      newParams.set('q', searchInput.trim())
    } else {
      newParams.delete('q')
    }
    setSearchParams(newParams)
  }

  // Toggle Category Filter
  const handleSelectCategory = (catSlug: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (categoryFromUrl === catSlug) {
      newParams.delete('categoria')
    } else {
      newParams.set('categoria', catSlug)
    }
    setSearchParams(newParams)
  }

  // Toggle Tag in tags parameter (Facet filter intersection)
  const handleToggleTag = (tagSlug: string) => {
    const newParams = new URLSearchParams(searchParams)
    let nextTags = [...tagsFromUrl]
    if (nextTags.includes(tagSlug)) {
      nextTags = nextTags.filter((t) => t !== tagSlug)
    } else {
      nextTags.push(tagSlug)
    }

    if (nextTags.length > 0) {
      newParams.set('tags', nextTags.join(','))
    } else {
      newParams.delete('tags')
    }
    setSearchParams(newParams)
  }

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

  const hasActiveFilters = Boolean(searchFromUrl || categoryFromUrl || tagsFromUrl.length > 0)

  // Group tags by dimension
  const dimensionLabels: Record<string, string> = {
    dieta: 'Dieta & Preferência',
    tecnica: 'Técnica & Método',
    ingrediente: 'Ingredientes Chave',
    ocasiao: 'Ocasião & Refeição',
    regiao: 'Origem & Tradição',
    equipamento: 'Equipamento',
    custo: 'Custo & Economia',
    estacao: 'Estação do Ano',
  }

  const tagsByDimension = tags.reduce(
    (acc, tag) => {
      const dim = tag.dimension || 'outros'
      if (!acc[dim]) acc[dim] = []
      acc[dim].push(tag)
      return acc
    },
    {} as Record<string, Tag[]>,
  )

  // Top shallow categories (depth 1)
  const rootCategories = categories.filter((c) => c.depth === 1 || !c.parent)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with appetizing styling */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-100/50 via-amber-50/30 to-background border-b border-border/40 py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200/50 mb-3 px-3 py-1 font-semibold text-xs tracking-wide">
            Acervo Pessoal & Rede de Receitas
          </Badge>
          <h1 className="font-serif-recipe text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            Cozinhe, registre e compartilhe suas melhores receitas
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Acervo culinário com ingredientes estruturados, busca sem acentos e links otimizados
            para compartilhar no WhatsApp.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative max-w-2xl mx-auto flex items-center"
          >
            <div className="relative w-full shadow-lg shadow-orange-500/5 rounded-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Busque por pão, queijo, bolo, chocolate... (sem se preocupar com acentos)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-28 py-6 rounded-2xl border-orange-200 focus-visible:ring-primary text-base bg-card shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('q')
                      setSearchParams(newParams)
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl px-4 py-2 font-semibold bg-primary hover:bg-primary/90"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Main Browse Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Shallow Navigation Chips */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-600" />
              Categorias
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="text-xs gap-1.5 rounded-full border-border/80"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
              <span>Filtro por Tags ({tagsFromUrl.length})</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleSelectCategory('')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                !categoryFromUrl
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              Todas as Receitas
            </button>
            {rootCategories.map((cat) => {
              const isSelected = categoryFromUrl === cat.slug
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-orange-500/20'
                      : 'bg-card border border-border text-foreground hover:border-orange-300'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter Drawer / Panel for Tag Intersections (Tags com Dimensões) */}
        {filterDrawerOpen && (
          <div className="mb-8 p-5 sm:p-6 bg-card rounded-2xl border border-orange-200/80 shadow-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">
                  Filtro Multifacetado por Tags
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {tagsFromUrl.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('tags')
                      setSearchParams(newParams)
                    }}
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Limpar Tags
                  </Button>
                )}
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Selecione tags para filtrar por <strong>interseção</strong>: receitas exibidas
              precisam conter <em>todas</em> as tags escolhidas simultaneamente.
            </p>

            <div className="space-y-4">
              {Object.entries(tagsByDimension).map(([dimension, dimensionTags]) => (
                <div key={dimension} className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {dimensionLabels[dimension] || dimension}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dimensionTags.map((tag) => {
                      const isTagSelected = tagsFromUrl.includes(tag.slug)
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleToggleTag(tag.slug)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                            isTagSelected
                              ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-sm'
                              : 'bg-background hover:bg-orange-50 border-border text-foreground'
                          }`}
                        >
                          <span>{tag.name}</span>
                          {isTagSelected && <X className="w-3 h-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 p-3 bg-orange-50/60 dark:bg-orange-950/20 rounded-xl border border-orange-200/60">
            <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
              Filtros ativos:
            </span>

            {searchFromUrl && (
              <Badge variant="secondary" className="gap-1 bg-white dark:bg-card border text-xs">
                Busca: "{searchFromUrl}"
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.delete('q')
                    setSearchParams(newParams)
                    setSearchInput('')
                  }}
                  className="hover:text-destructive ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {categoryFromUrl && (
              <Badge variant="secondary" className="gap-1 bg-white dark:bg-card border text-xs">
                Categoria:{' '}
                {categories.find((c) => c.slug === categoryFromUrl)?.name || categoryFromUrl}
                <button
                  onClick={() => handleSelectCategory(categoryFromUrl)}
                  className="hover:text-destructive ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {tagsFromUrl.map((ts) => (
              <Badge
                key={ts}
                variant="secondary"
                className="gap-1 bg-white dark:bg-card border text-xs"
              >
                Tag: #{tags.find((t) => t.slug === ts)?.name || ts}
                <button
                  onClick={() => handleToggleTag(ts)}
                  className="hover:text-destructive ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            <Button
              variant="link"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-orange-700 dark:text-orange-400 p-0 h-auto font-medium ml-auto"
            >
              Limpar todos os filtros
            </Button>
          </div>
        )}

        {/* Recipe Grid Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif-recipe font-bold text-xl sm:text-2xl text-foreground">
            {searchFromUrl ? `Resultados para "${searchFromUrl}"` : 'Receitas em Destaque'}
          </h2>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {loading
              ? 'Carregando...'
              : `${recipes.length} ${recipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}`}
          </span>
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-border p-4 space-y-3">
                <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                <Skeleton className="w-2/3 h-5 rounded" />
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-1/2 h-4 rounded" />
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="font-serif-recipe font-bold text-xl text-foreground mb-2">
              Nenhuma receita encontrada
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Não encontramos receitas com os filtros selecionados. Tente buscar por outros termos
              sem acento ou remover filtros de tags.
            </p>
            {hasActiveFilters && (
              <Button onClick={handleClearAllFilters} variant="outline" className="rounded-xl">
                Limpar Filtros e Ver Todas
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
