import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { recipeService, taxonomyService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import { Recipe, Category, Tag } from '@/types/recipe'
import { RecipeCard } from '@/components/RecipeCard'
import { DragScrollRow } from '@/components/DragScrollRow'
import { RodelaMark } from '@/components/brand/RodelaMark'
import {
  Search,
  SlidersHorizontal,
  X,
  ChefHat,
  Tag as TagIcon,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchFromUrl = searchParams.get('q') || ''
  const categoryFromUrl = searchParams.get('categoria') || ''
  const tagsFromUrl = searchParams.get('tags')
    ? searchParams.get('tags')!.split(',').filter(Boolean)
    : []

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [featured, setFeatured] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Local search query input state
  const [searchInput, setSearchInput] = useState(searchFromUrl)

  const currentUser = authService.getCurrentUser()

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

  // Featured recipes as PROOF of content (independent from search state)
  useEffect(() => {
    async function loadFeatured() {
      setFeaturedLoading(true)
      try {
        const res = await recipeService.getPublicRecipes({ page: 1, perPage: 6 })
        setFeatured(res.items)
      } catch (err) {
        console.error('Error loading featured recipes:', err)
      } finally {
        setFeaturedLoading(false)
      }
    }
    loadFeatured()
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
    document.getElementById('receitas')?.scrollIntoView({ behavior: 'smooth' })
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
  const isBrowsing = hasActiveFilters

  const tagsByDimension = tags.reduce(
    (acc, tag) => {
      const dim = tag.dimension || 'outros'
      if (!acc[dim]) acc[dim] = []
      acc[dim].push(tag)
      return acc
    },
    {} as Record<string, Tag[]>,
  )

  // Shallow category tree (depth 1 = raiz)
  const rootCategories = categories.filter((c) => c.depth === 1 || !c.parent)

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HERO DE CONVERSÃO ============ */}
      <section className="relative overflow-hidden bg-creme border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-8 sm:pt-4 sm:pb-10 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-espresso leading-[1.05] tracking-tight mb-3">
            Receita de
            <br />
            gente de verdade.
          </h1>
          <p className="text-base sm:text-lg text-espresso-soft max-w-xl mx-auto mb-6 leading-relaxed">
            Cadastre a sua, veja a dos outros, faça do seu jeito.
          </p>

          {/* CTA de cadastro (visível apenas para quem ainda não tem conta) */}
          {!currentUser && (
            <div className="flex items-center justify-center mb-7">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-tomate hover:bg-tomate/90 text-creme font-semibold rounded-full px-8 py-6 text-base gap-2"
              >
                <Link to="/cadastro">
                  Criar minha conta
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Busca */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                aria-label="Buscar receitas"
                placeholder="Busque por pão, bolo, moqueca…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-24 py-6 rounded-2xl border-areia bg-white text-base focus-visible:ring-tomate"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
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
                  className="rounded-xl px-4 py-2 font-semibold bg-espresso hover:bg-espresso/90 text-creme"
                >
                  Buscar
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Acha a receita mesmo digitando errado.
            </p>
          </form>

          {/* Categorias + filtro por tags — logo abaixo da busca */}
          <div className="mt-5 mb-2 text-left">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-tomate" />
                Categorias
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className="text-xs gap-1.5 rounded-full border-border/80"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-tomate" />
                <span>
                  Filtrar {tagsFromUrl.length > 0 ? `(${tagsFromUrl.length})` : 'por tags'}
                </span>
              </Button>
            </div>

            <DragScrollRow className="pb-2">
              <button
                onClick={() => handleSelectCategory('')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  !categoryFromUrl
                    ? 'bg-espresso text-creme'
                    : 'bg-creme border border-border text-espresso hover:border-tomate/50'
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
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-tomate text-creme font-semibold'
                        : 'bg-creme border border-border text-espresso hover:border-tomate/50'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </DragScrollRow>
          </div>

          {/* Painel de facetas (interseção de tags) */}
          {filterDrawerOpen && (
            <div className="mt-4 mb-2 p-5 sm:p-6 bg-creme rounded-2xl border border-areia/70 animate-fade-in text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-tomate" />
                  <h3 className="font-display text-espresso text-base">Filtrar por tags</h3>
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
                      Limpar tags
                    </Button>
                  )}
                  <button
                    onClick={() => setFilterDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Fechar filtros"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Marque duas tags e mostramos só as receitas que têm as duas.
              </p>

              <div className="space-y-4">
                {Object.entries(tagsByDimension).map(([dimension, dimensionTags]) => (
                  <div key={dimension} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      {dimensionLabels[dimension] || dimension}
                    </span>
                    <DragScrollRow className="items-start">
                      {dimensionTags.map((tag) => {
                        const isTagSelected = tagsFromUrl.includes(tag.slug)
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.slug)}
                            className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0 transition-all ${
                              isTagSelected
                                ? 'bg-lima text-espresso border-lima font-semibold'
                                : 'bg-background hover:bg-areia-soft border-border text-espresso'
                            }`}
                          >
                            {tag.name}
                          </button>
                        )
                      })}
                    </DragScrollRow>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ PROVA: RECEITAS REAIS ============ */}
      <section id="receitas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 scroll-mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-espresso">Saindo das cozinhas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Receitas reais, de gente de verdade. Abra, cozinhe e faça do seu jeito.
            </p>
          </div>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-border p-4 space-y-3">
                <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                <Skeleton className="w-2/3 h-5 rounded" />
                <Skeleton className="w-full h-4 rounded" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-card rounded-2xl border border-dashed border-border/80">
            <ChefHat className="w-8 h-8 text-areia mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              As primeiras receitas estão chegando. Que tal a sua ser uma delas?
            </p>
          </div>
        )}
      </section>

      {/* ============ MANIFESTO ============ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-4">
        <div className="bg-espresso rounded-3xl px-6 py-8 sm:px-12 sm:py-10 text-center flex flex-col items-center">
          <RodelaMark className="w-10 h-10 mb-4" arc="var(--creme)" />
          <p className="font-display text-creme text-lg sm:text-2xl leading-relaxed">
            Toda receita começou na cozinha de alguém.
          </p>
          <p className="text-creme/80 text-sm sm:text-base leading-relaxed mt-2.5 max-w-xl mx-auto">
            Aqui ela tem nome, tem dono e tem história. E se você fizer diferente, isso não é erro —
            é uma rodela da anterior.
          </p>
          {!currentUser && (
            <Button
              asChild
              className="mt-5 bg-tomate hover:bg-tomate/90 text-creme font-semibold rounded-full px-7 py-4 gap-2"
            >
              <Link to="/cadastro">
                Colocar minha receita lá dentro
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* ============ EXPLORAR: FACETAS + RESULTADOS ============ */}
      <div id="explorar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        {/* Barra de filtros ativos */}
        {isBrowsing && (
          <div className="mb-6 flex flex-wrap items-center gap-2 p-3 bg-areia-soft rounded-xl border border-areia/50">
            <span className="text-xs font-semibold text-espresso">Filtros ativos:</span>

            {searchFromUrl && (
              <Badge variant="secondary" className="gap-1 bg-creme border text-espresso text-xs">
                Busca: "{searchFromUrl}"
                <button
                  aria-label="Remover busca"
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
              <Badge variant="secondary" className="gap-1 bg-creme border text-espresso text-xs">
                {categories.find((c) => c.slug === categoryFromUrl)?.name || categoryFromUrl}
                <button
                  aria-label="Remover categoria"
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
                className="gap-1 bg-lima border border-lima text-espresso text-xs"
              >
                #{tags.find((t) => t.slug === ts)?.name || ts}
                <button aria-label="Remover tag" onClick={() => handleToggleTag(ts)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            <Button
              variant="link"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-tomate p-0 h-auto font-medium ml-auto"
            >
              Limpar tudo
            </Button>
          </div>
        )}

        {/* Resultados */}
        {isBrowsing && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg sm:text-xl text-espresso">
                {searchFromUrl ? `Resultados para "${searchFromUrl}"` : 'Receitas filtradas'}
              </h2>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium tabular-nums">
                {loading ? '…' : `${recipes.length}`}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-border p-4 space-y-3"
                  >
                    <Skeleton className="w-full aspect-[4/3] rounded-xl" />
                    <Skeleton className="w-2/3 h-5 rounded" />
                    <Skeleton className="w-1/2 h-4 rounded" />
                  </div>
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-14 px-4 bg-card rounded-2xl border border-dashed border-border/80">
                <ChefHat className="w-10 h-10 text-areia mx-auto mb-3" />
                <h3 className="font-display text-lg text-espresso mb-2">
                  Nada por aqui com esses filtros
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                  Tente digitar de outro jeito ou remova algum filtro.
                </p>
                <Button
                  onClick={handleClearAllFilters}
                  variant="outline"
                  className="rounded-full border-espresso/25 text-espresso"
                >
                  Ver todas as receitas
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
