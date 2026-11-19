import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { collectionService, recipeService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import { RecipeCollection, SavedRecipe } from '@/types/recipe'
import { BookMarked, Plus, Lock, Globe, Trash2, ExternalLink, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { RodelaMark } from '@/components/brand/RodelaMark'

export default function Collections() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [collections, setCollections] = useState<RecipeCollection[]>([])
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)

  // New Collection Dialog
  const [newColOpen, setNewColOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColPrivate, setNewColPrivate] = useState(true)
  const [creatingCol, setCreatingCol] = useState(false)

  // Filter by selected collection
  const [selectedColId, setSelectedColId] = useState<string>('all')

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }

    async function loadData() {
      setLoading(true)
      try {
        const [cols, saved] = await Promise.all([
          collectionService.getMyCollections(),
          collectionService.getMySavedRecipes(),
        ])
        setCollections(cols)
        setSavedRecipes(saved)
      } catch (err) {
        console.error('Failed to load collections/saved:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColName.trim()) return
    setCreatingCol(true)
    try {
      const created = await collectionService.createCollection(newColName.trim(), newColPrivate)
      setCollections([created, ...collections])
      setNewColName('')
      setNewColOpen(false)
      toast({
        title: 'Coleção criada!',
        description: `Coleção "${created.name}" criada com sucesso.`,
      })
    } catch (err) {
      toast({
        title: 'Erro ao criar coleção',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCreatingCol(false)
    }
  }

  const handleRemoveSaved = async (savedId: string) => {
    try {
      await collectionService.removeSavedRecipe(savedId)
      setSavedRecipes(savedRecipes.filter((s) => s.id !== savedId))
      toast({
        title: 'Receita removida',
        description: 'A receita foi retirada dos seus salvos.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover dos salvos.',
        variant: 'destructive',
      })
    }
  }

  const filteredSaved = savedRecipes.filter((s) => {
    if (selectedColId === 'all') return true
    return s.collection === selectedColId
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/80">
        <div>
          <h1 className="font-serif-recipe text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-primary" />
            Minhas Coleções & Receitas Salvas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize suas receitas salvas em pastas particulares que apenas você tem acesso.
          </p>
        </div>

        <Button
          onClick={() => setNewColOpen(true)}
          className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Nova Coleção
        </Button>
      </div>

      {/* Collection tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
        <button
          onClick={() => setSelectedColId('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            selectedColId === 'all'
              ? 'bg-foreground text-background'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas as Salvas ({savedRecipes.length})
        </button>

        {collections.map((col) => {
          const isSelected = selectedColId === col.id
          const count = savedRecipes.filter((s) => s.collection === col.id).length
          return (
            <button
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {col.is_private ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>
                {col.name} ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Saved Recipes List */}
      {filteredSaved.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80">
          <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-serif-recipe font-bold text-lg text-foreground mb-1">
            Nenhuma receita salva nesta coleção
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Navegue pelo acervo e clique em "Salvar" em qualquer receita para guardá-la aqui.
          </p>
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/">Explorar Receitas</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSaved.map((item) => {
            const recipe = item.expand?.recipe
            if (!recipe) return null
            const author = recipe.expand?.author
            const authorUsername = author?.username || 'autor'
            const publicLink = `/r/${authorUsername}/${recipe.slug}`

            return (
              <Card
                key={item.id}
                className="overflow-hidden rounded-2xl border-border flex flex-col justify-between group"
              >
                <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                  {recipe.cover ? (
                    <img
                      src={recipeService.getFileUrl(recipe)}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    /* Placeholder neutro da marca: creme/areia com o símbolo Rodela em areia torrada */
                    <div
                      aria-hidden="true"
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F7F2E8] to-[#D9B382]/35"
                    >
                      <RodelaMark className="w-14 h-14 opacity-70" arc="#D9B382" dot="#D9B382" />
                    </div>
                  )}
                  {item.expand?.collection && (
                    <Badge className="absolute top-2 left-2 bg-black/60 text-white text-[10px] border-none backdrop-blur-md">
                      {item.expand.collection.name}
                    </Badge>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif-recipe font-bold text-lg text-foreground line-clamp-1 mb-1">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {recipe.description || 'Sem descrição.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs gap-1"
                    >
                      <Link to={publicLink}>
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        Ver Receita
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
              </Card>
            )
          })}
        </div>
      )}

      {/* New Collection Modal */}
      <Dialog open={newColOpen} onOpenChange={setNewColOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleCreateCollection}>
            <DialogHeader>
              <DialogTitle className="font-serif-recipe text-xl">Criar Nova Coleção</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Crie pastas temáticas para organizar suas receitas salvas (ex: Almoço de Domingo,
                Receitas de Pão).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Nome da Coleção
                </label>
                <Input
                  required
                  placeholder="Ex: Pães & Fermentações Favoritas"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="rounded-xl"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={newColPrivate}
                  onChange={(e) => setNewColPrivate(e.target.checked)}
                  className="rounded"
                />
                <label
                  htmlFor="is_private"
                  className="text-xs text-foreground cursor-pointer font-medium"
                >
                  Coleção Privada (Apenas você pode ver)
                </label>
              </div>
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
              <Button type="submit" disabled={creatingCol} className="rounded-xl bg-primary">
                {creatingCol ? 'Criando...' : 'Criar Coleção'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
