import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { recipeService, collectionService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { Recipe, RecipeIngredient, RecipeStep, Tag, RecipeCollection } from '@/types/recipe'
import {
  Clock,
  Users,
  ChefHat,
  Share2,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Scale,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { RodelaMark } from '@/components/brand/RodelaMark'
import { getLicenseLabel, getLicenseDescription } from '@/lib/license'
import { publicRecipeUrl } from '@/lib/shareLinks'

export default function RecipeDetail() {
  const { username, slug } = useParams<{ username: string; slug: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [steps, setSteps] = useState<RecipeStep[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  // Saved state
  const [isSaved, setIsSaved] = useState(false)
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [myCollections, setMyCollections] = useState<RecipeCollection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [savingRecipe, setSavingRecipe] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [creatingCollection, setCreatingCollection] = useState(false)
  // Contador de salvamentos (espelha recipes.save_count; reconciliado por hook)
  const [saveCount, setSaveCount] = useState(0)

  // Título da aba + meta tags do cliente (og/twitter/canonical) para
  // complementar as tags que o servidor já entrega aos crawlers.
  // Hook chamado incondicionalmente (regra de hooks) — os guardes de
  // loading/404 ficam abaixo dele.
  useDocumentMeta({
    title: recipe ? `${recipe.title} | Rodela` : 'Rodela',
    description:
      recipe?.description ||
      'Receita de gente de verdade: veja o passo a passo completo no Rodela.',
    image: recipe ? recipeService.getLargeFileUrl(recipe) || undefined : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    type: recipe ? 'article' : undefined,
  })

  // Load recipe
  useEffect(() => {
    async function fetchRecipe() {
      if (!username || !slug) return
      setLoading(true)
      setErrorStatus(null)
      try {
        const data = await recipeService.getByUsernameAndSlug(username, slug)
        setRecipe(data.recipe)
        setSaveCount(data.recipe.save_count || 0)
        setIngredients(data.ingredients)
        setSteps(data.steps)
        setTags(data.tags)

        // Check if saved
        if (authService.isAuthenticated()) {
          const savedRec = await collectionService.isRecipeSaved(data.recipe.id)
          if (savedRec) {
            setIsSaved(true)
            setSavedRecordId(savedRec.id)
          }
        }
      } catch (err: any) {
        console.error('Error fetching recipe detail:', err)
        // If private or not found
        setErrorStatus(404)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipe()
  }, [username, slug])

  // Open Save Modal
  const handleOpenSaveModal = async () => {
    if (!authService.isAuthenticated()) {
      toast({
        title: 'Faça login para salvar receitas',
        description: 'Crie uma conta gratuita para guardar suas receitas favoritas.',
      })
      navigate('/login')
      return
    }

    if (isSaved && savedRecordId) {
      // Remove save
      try {
        await collectionService.removeSavedRecipe(savedRecordId)
        setIsSaved(false)
        setSavedRecordId(null)
        setSaveCount((c) => Math.max(0, c - 1))
        toast({
          title: 'Removida dos salvos',
          description: 'A receita foi retirada da sua coleção.',
        })
      } catch (err) {
        toast({
          title: 'Erro ao remover',
          description: 'Não foi possível remover.',
          variant: 'destructive',
        })
      }
      return
    }

    // Load collections to choose
    try {
      const cols = await collectionService.getMyCollections()
      setMyCollections(cols)
      setSaveModalOpen(true)
    } catch (_) {
      setSaveModalOpen(true)
    }
  }

  // Cria uma coleção nova direto no diálogo de salvar
  const handleCreateCollectionInline = async () => {
    if (!newCollectionName.trim()) return
    setCreatingCollection(true)
    try {
      const created = await collectionService.createCollection(newCollectionName.trim(), true)
      setMyCollections((prev) => [created, ...prev])
      setSelectedCollectionId(created.id)
      setNewCollectionName('')
      toast({
        title: 'Coleção criada',
        description: `"${created.name}" já pode receber receitas.`,
      })
    } catch (_) {
      toast({
        title: 'Erro ao criar coleção',
        description: 'Tente de novo com outro nome.',
        variant: 'destructive',
      })
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleConfirmSave = async () => {
    if (!recipe) return
    setSavingRecipe(true)
    try {
      const rec = await collectionService.saveRecipe(recipe.id, selectedCollectionId || undefined)
      setIsSaved(true)
      setSavedRecordId(rec.id)
      setSaveCount((c) => c + 1)
      setSaveModalOpen(false)
      toast({
        title: 'Receita salva com sucesso!',
        description: 'Ela já está disponível na sua lista de coleções.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Você já salvou esta receita ou ocorreu um erro de conexão.',
        variant: 'destructive',
      })
    } finally {
      setSavingRecipe(false)
    }
  }

  // Share link (ideal for WhatsApp) — aponta para o backend, onde o hook
  // routes.pb.js entrega as meta tags OG que montam o cartão.
  const handleShare = async () => {
    const url = username && slug ? publicRecipeUrl(username, slug, recipe) : window.location.href
    const shareText = `Confira esta receita: ${recipe?.title} por @${username}!`

    // Um único caminho de cópia: ou navigator.share OU clipboard.writeText —
    // nunca ambos (o fallback anterior podia copiar o link duplicado).
    try {
      if (navigator.share && !navigator.clipboard) {
        await navigator.share({
          title: recipe?.title,
          text: recipe?.description || shareText,
          url: url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast({
          title: 'Link copiado!',
          description: 'Cole no WhatsApp para compartilhar a receita.',
        })
      }
    } catch {
      /* usuário cancelou ou cópia falhou */
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-full aspect-[16/9] rounded-2xl" />
        <Skeleton className="w-3/4 h-10" />
        <Skeleton className="w-full h-24" />
      </div>
    )
  }

  if (errorStatus === 404 || !recipe) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-serif-recipe text-2xl font-bold text-foreground mb-2">
          Receita Indisponível (404)
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Esta receita não existe, foi arquivada ou está marcada como privada pelo autor.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/">Voltar ao Acervo Público</Link>
        </Button>
      </div>
    )
  }

  const author = recipe.expand?.author
  const authorName = author?.display_name || username || 'Autor'
  const totalMinutes = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0)
  const isAuthor = authService.getCurrentUser()?.id === recipe.author

  const licenseLabel = getLicenseLabel(recipe.license)
  const licenseDesc = getLicenseDescription(recipe.license)

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top back navigation */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Explorar
        </Link>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-muted shadow-md mt-4 border border-border/80">
          {recipe.cover ? (
            <img
              src={recipeService.getLargeFileUrl(recipe)}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Placeholder neutro da marca: creme/areia com o símbolo Rodela em areia torrada */
            <div
              aria-hidden="true"
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F7F2E8] to-[#D9B382]/35"
            >
              <RodelaMark className="w-20 h-20 opacity-70" arc="#D9B382" dot="#D9B382" />
            </div>
          )}

          {/* Visibility badge if not public */}
          {recipe.visibility !== 'public' && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-foreground text-background border-none gap-1 px-3 py-1 text-xs">
                <Lock className="w-3.5 h-3.5" />
                {recipe.visibility === 'unlisted'
                  ? 'Link Não Listado'
                  : 'Privada (Visível só para você)'}
              </Badge>
            </div>
          )}
        </div>

        {/* Recipe Meta Header */}
        <div className="pt-6 sm:pt-8 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Category */}
            {recipe.expand?.category && (
              <Badge
                variant="secondary"
                className="bg-muted text-foreground text-xs px-3 py-1 font-semibold"
              >
                {recipe.expand.category.name}
              </Badge>
            )}

            {/* Actions: Edit (author only), Save & Share */}
            <div className="flex items-center gap-2 ml-auto">
              {isAuthor && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/receitas/editar/${recipe.id}`)}
                  className="rounded-full gap-1.5 text-xs font-semibold bg-[#FF4D2E] hover:bg-[#FF4D2E]/90 text-white"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
              )}
              <Button
                variant={isSaved ? 'default' : 'outline'}
                size="sm"
                onClick={handleOpenSaveModal}
                className={`rounded-full gap-1.5 text-xs font-semibold ${
                  isSaved ? 'bg-primary hover:bg-primary/90 text-white' : ''
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? 'Salva' : 'Salvar'}
                {saveCount > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isSaved ? 'bg-white/20 text-white' : 'bg-[#C9F24D] text-[#12100E]'
                    }`}
                  >
                    {saveCount}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-full gap-1.5 text-xs font-semibold border-border hover:bg-muted text-foreground"
              >
                <Share2 className="w-4 h-4 text-primary" />
                Compartilhar
              </Button>
            </div>
          </div>

          <h1 className="font-serif-recipe text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 font-normal">
              {recipe.description}
            </p>
          )}

          {/* Author Card */}
          <div className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border/80 shadow-sm mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center text-foreground font-bold text-base shrink-0">
              {author?.avatar ? (
                <img
                  src={authService.getAvatarUrl(author)}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                authorName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm sm:text-base truncate">
                {authorName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                @{username} {author?.city && `• ${author.city}, ${author.state || ''}`}
              </div>
            </div>
          </div>

          {/* Key Facts / Attributes Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-border/70 my-6">
            {recipe.prep_minutes ? (
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Preparo
                </span>
                <span className="font-semibold text-sm sm:text-base text-foreground flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  {recipe.prep_minutes} min
                </span>
              </div>
            ) : null}

            {recipe.cook_minutes ? (
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Cozimento / Forno
                </span>
                <span className="font-semibold text-sm sm:text-base text-foreground flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-primary" />
                  {recipe.cook_minutes} min
                </span>
              </div>
            ) : null}

            {recipe.yield_quantity ? (
              <div className="p-3 bg-muted/40 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Rendimento
                </span>
                <span className="font-semibold text-sm sm:text-base text-foreground flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-primary" />
                  {recipe.yield_quantity} {recipe.yield_unit || 'porções'}
                </span>
              </div>
            ) : null}

            <div className="p-3 bg-muted/40 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                Dificuldade
              </span>
              <span className="font-semibold text-xs sm:text-sm text-foreground flex items-center justify-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <span
                    key={lvl}
                    className={`w-2 h-2 rounded-full ${
                      lvl <= (recipe.difficulty || 2) ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </span>
            </div>
          </div>

          {/* Licença: badge areia destacado, separado do bloco de tempo/rendimento */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-[#D9B382]/25 text-espresso border border-[#D9B382]/50">
              <FileText className="w-3 h-3 text-espresso/70" />
              Licença {licenseLabel}
            </span>
          </div>
        </div>
        {/* Story Section if author wrote one */}
        {recipe.story && (
          <section className="mb-10 p-6 bg-muted/40 rounded-2xl border border-border/60">
            <h2 className="font-serif-recipe font-bold text-lg sm:text-xl text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              História da Receita
            </h2>
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line italic font-serif">
              "{recipe.story}"
            </div>
          </section>
        )}

        {/* Recipe Content: Ingredients & Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Ingredients Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
                <h2 className="font-serif-recipe font-bold text-xl text-foreground flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Ingredientes
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#C9F24D] text-[#12100E] rounded-full">
                  {ingredients.length} itens
                </span>
              </div>

              {ingredients.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum ingrediente cadastrado.</p>
              ) : (
                <ul className="space-y-3">
                  {ingredients.map((ing) => (
                    <li
                      key={ing.id || ing.position}
                      className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                      <div>
                        <span className="font-medium">{ing.raw_text}</span>
                        {ing.preparation && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({ing.preparation})
                          </span>
                        )}
                        {ing.is_optional && (
                          <Badge
                            variant="outline"
                            className="ml-1.5 text-[9px] py-0 px-1 border-muted-foreground/30 text-muted-foreground"
                          >
                            opcional
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Steps Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm">
              <h2 className="font-serif-recipe font-bold text-xl text-foreground pb-3 border-b border-border/80 mb-6 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                Modo de Preparo
              </h2>

              {steps.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>
              ) : (
                <div className="space-y-6">
                  {steps.map((st, idx) => (
                    <div key={st.id || st.position} className="flex gap-4">
                      {/* Step Number Circle */}
                      <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 space-y-2">
                        <p className="text-sm sm:text-base text-foreground leading-relaxed font-normal">
                          {st.instruction}
                        </p>

                        {(st.duration_min || st.temperature_c || st.technique) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                            {st.duration_min && (
                              <span className="bg-muted px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-primary" />
                                {st.duration_min} min
                              </span>
                            )}
                            {st.temperature_c && (
                              <span className="bg-muted px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                <Flame className="w-3 h-3 text-primary" />
                                {st.temperature_c}°C
                              </span>
                            )}
                            {st.technique && (
                              <span className="bg-muted px-2 py-0.5 rounded-md font-medium">
                                Técnica: {st.technique}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags section */}
            {tags.length > 0 && (
              <div className="p-5 bg-card rounded-2xl border border-border/80">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Tags & Características
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Badge
                      key={t.id}
                      variant="secondary"
                      className="text-xs px-2.5 py-1 bg-muted/60 text-foreground font-medium"
                    >
                      #{t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* License notice */}
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/60 text-xs text-muted-foreground flex items-start gap-3">
              <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block mb-0.5">
                  Licença da Receita: {licenseLabel}
                </span>
                <span>{licenseDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Save to Collection Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif-recipe text-xl">Salvar Receita</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Escolha uma coleção particular para salvar esta receita e encontrá-la facilmente
              depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Escolha uma coleção
              </label>
              {myCollections.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Você ainda não tem coleções — crie a primeira aqui embaixo.
                </p>
              ) : (
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-tomate"
                >
                  <option value="">Sem coleção (fica nos "Salvos")</option>
                  {myCollections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} {col.is_private ? '· só você vê' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Criar coleção na hora, sem sair do diálogo */}
            <div className="pt-2 border-t border-border/60">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
                Ou crie uma nova
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ex: Almoço de domingo"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="rounded-xl flex-1"
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateCollectionInline}
                  disabled={creatingCollection || !newCollectionName.trim()}
                  className="rounded-xl shrink-0 gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-tomate" />
                  {creatingCollection ? 'Criando…' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSaveModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={savingRecipe}
              className="rounded-xl bg-primary"
            >
              {savingRecipe ? 'Salvando...' : 'Confirmar e Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
