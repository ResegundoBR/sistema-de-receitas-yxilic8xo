import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collectionService, recipeService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import { RecipeCollection, SavedRecipe } from '@/types/recipe'
import {
  Bookmark,
  Lock,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  LogIn,
  ChevronLeft,
  ChefHat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { RodelaMark } from '@/components/brand/RodelaMark'
import { publicRecipeUrl } from '@/lib/shareLinks'

export default function Salvos() {
  const { toast } = useToast()
  const isAuthenticated = authService.isAuthenticated()

  const [collections, setCollections] = useState<RecipeCollection[]>([])
  const [saved, setSaved] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(isAuthenticated)

  // Coleção aberta (null = listagem de coleções)
  const [openCollection, setOpenCollection] = useState<RecipeCollection | null>(null)

  // Nova coleção
  const [newColOpen, setNewColOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColPrivate, setNewColPrivate] = useState(true)
  const [creatingCol, setCreatingCol] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cols, savedItems] = await Promise.all([
        collectionService.getMyCollections(),
        collectionService.getMySavedRecipes(),
      ])
      setCollections(cols)
      setSaved(savedItems)
    } catch (err) {
      console.error('Erro ao carregar salvos:', err)
      toast({
        title: 'Não carregou',
        description: 'Tivemos um problema ao buscar o que você salvou. Tente de novo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated, loadData])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    setCreatingCol(true)
    try {
      const created = await collectionService.createCollection(newColName.trim(), newColPrivate)
      setCollections((prev) => [created, ...prev])
      setNewColName('')
      setNewColOpen(false)
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
      setCreatingCol(false)
    }
  }

  const handleRemoveSaved = async (savedId: string) => {
    try {
      await collectionService.removeSavedRecipe(savedId)
      setSaved((prev) => prev.filter((s) => s.id !== savedId))
      toast({
        title: 'Receita removida',
        description: 'Ela saiu dos seus salvos.',
      })
    } catch (_) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível tirar a receita dos salvos.',
        variant: 'destructive',
      })
    }
  }

  // ---------- Visitante não logado: convite direto para entrar ----------
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-creme border border-border flex items-center justify-center mx-auto mb-6">
          <Bookmark className="w-7 h-7 text-tomate" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-espresso">
          Entre para ver o que você salvou
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
          Guarde receitas em coleções suas — privadas ou não — e ache tudo aqui depois, na hora de
          cozinhar.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            asChild
            className="rounded-full bg-tomate hover:bg-tomate/90 text-creme font-semibold px-6 py-5 gap-2"
          >
            <Link to="/login">
              <LogIn className="w-4 h-4" />
              Entrar
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 py-5 font-semibold">
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </div>
      </div>
    )
  }

  const savedInOpen = openCollection
    ? openCollection.id === '__all__'
      ? saved
      : saved.filter((s) => s.collection === openCollection.id)
    : saved

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-espresso">Salvos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {openCollection
              ? `Receitas guardadas em "${openCollection.name}".`
              : 'Suas coleções de receitas guardadas.'}
          </p>
        </div>
        {collections.length > 0 && (
          <Button
            onClick={() => setNewColOpen(true)}
            className="rounded-full bg-tomate hover:bg-tomate/90 text-creme font-semibold gap-2 self-start"
          >
            <Plus className="w-4 h-4" />
            Nova coleção
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : openCollection ? (
        <>
          {/* Dentro de uma coleção: receitas salvas */}
          <button
            onClick={() => setOpenCollection(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-espresso mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Todas as coleções
          </button>

          {savedInOpen.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80">
              <ChefHat className="w-10 h-10 text-areia mx-auto mb-3" />
              <h3 className="font-display text-lg text-espresso mb-1">
                Nada salvo nesta coleção ainda
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Abra uma receita e toque em "Salvar" para guardá-la aqui.
              </p>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-tomate hover:bg-tomate/90 text-creme"
              >
                <Link to="/">Explorar receitas</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedInOpen.map((item) => {
                const recipe = item.expand?.recipe
                if (!recipe) return null
                const authorUsername = recipe.expand?.author?.username || 'autor'
                return (
                  <div
                    key={item.id}
                    className="group bg-card rounded-2xl border border-border/70 overflow-hidden flex flex-col"
                  >
                    <Link
                      to={publicRecipeUrl(authorUsername, recipe.slug, recipe)}
                      className="block"
                    >
                      <div className="aspect-[16/9] bg-muted overflow-hidden">
                        {recipe.cover ? (
                          <img
                            src={recipeService.getFileUrl(recipe)}
                            alt={recipe.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          /* Placeholder neutro da marca: creme/areia com o símbolo Rodela em areia torrada */
                          <div
                            aria-hidden="true"
                            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F7F2E8] to-[#D9B382]/35"
                          >
                            <RodelaMark
                              className="w-14 h-14 opacity-70"
                              arc="#D9B382"
                              dot="#D9B382"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base text-espresso line-clamp-1 mb-1">
                          {recipe.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {recipe.description || 'Sem descrição.'}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs gap-1"
                        >
                          <Link to={publicRecipeUrl(authorUsername, recipe.slug, recipe)}>
                            <ExternalLink className="w-3.5 h-3.5 text-tomate" />
                            Abrir receita
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSaved(item.id)}
                          className="text-xs text-destructive hover:bg-destructive/10 rounded-lg gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Listagem de coleções */}
          {collections.length === 0 ? (
            <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80">
              <Bookmark className="w-10 h-10 text-areia mx-auto mb-3" />
              <h3 className="font-display text-lg text-espresso mb-1">
                Você ainda não tem coleções
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Crie a primeira e comece a guardar o que você quer cozinhar.
              </p>
              <Button
                onClick={() => setNewColOpen(true)}
                className="rounded-full bg-tomate hover:bg-tomate/90 text-creme gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova coleção
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CollectionCard
                name="Tudo que eu salvei"
                count={saved.length}
                isPrivate={true}
                onClick={() => {
                  setOpenCollection({
                    id: '__all__',
                    owner: '',
                    name: 'Tudo que eu salvei',
                    is_private: true,
                    created: '',
                    updated: '',
                  })
                }}
              />
              {collections.map((col) => (
                <CollectionCard
                  key={col.id}
                  name={col.name}
                  count={saved.filter((s) => s.collection === col.id).length}
                  isPrivate={col.is_private}
                  onClick={() => setOpenCollection(col)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Diálogo de nova coleção */}
      <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleCreateCollection}>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-espresso">Nova coleção</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Dê um nome que faça sentido pra você (ex: Almoço de domingo, Pães de fermentação
                natural).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="nova-colecao-nome"
                  className="text-xs font-semibold text-espresso uppercase tracking-wider"
                >
                  Nome
                </label>
                <Input
                  id="nova-colecao-nome"
                  required
                  placeholder="Ex: Sobremesas da vovó"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="rounded-xl"
                  maxLength={100}
                />
              </div>

              <label
                htmlFor="nova-colecao-privada"
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="nova-colecao-privada"
                  checked={newColPrivate}
                  onChange={(e) => setNewColPrivate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-espresso font-medium">
                  Só eu vejo esta coleção (privada)
                </span>
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewColOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creatingCol}
                className="rounded-xl bg-tomate hover:bg-tomate/90 text-creme"
              >
                {creatingCol ? 'Criando…' : 'Criar coleção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CollectionCard({
  name,
  count,
  isPrivate,
  onClick,
}: {
  name: string
  count: number
  isPrivate: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left bg-card rounded-2xl border border-border/70 p-5 flex flex-col gap-3',
        'hover:border-tomate/60 hover:shadow-elevation transition-all',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-creme border border-border flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-tomate" />
        </div>
        {isPrivate ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3" /> Só você vê
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Globe className="w-3 h-3" /> Pública
          </span>
        )}
      </div>
      <div>
        <h3 className="font-display text-base text-espresso leading-tight">{name}</h3>
        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
          {count === 1 ? '1 receita' : `${count} receitas`}
        </p>
      </div>
    </button>
  )
}
