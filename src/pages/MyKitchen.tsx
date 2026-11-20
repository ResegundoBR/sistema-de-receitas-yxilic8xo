import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { recipeService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import { Recipe } from '@/types/recipe'
import { RodelaMark } from '@/components/brand/RodelaMark'
import {
  ChefHat,
  PlusCircle,
  Archive,
  ArchiveRestore,
  Eye,
  Lock,
  Link as LinkIcon,
  Clock,
  Share2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { publicRecipeUrl } from '@/lib/shareLinks'

export default function MyKitchen() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentUser = authService.getCurrentUser()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'archived'>('all')

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }

    async function loadRecipes() {
      setLoading(true)
      try {
        const data = await recipeService.getMyRecipes()
        setRecipes(data)
      } catch (err) {
        console.error('Failed to load my recipes:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRecipes()
  }, [navigate])

  // Handle Archive recipe (archive instead of delete!)
  const handleArchive = async (recipe: Recipe) => {
    try {
      if (recipe.status === 'archived') {
        const updated = await recipeService.unarchiveRecipe(recipe.id)
        setRecipes(recipes.map((r) => (r.id === recipe.id ? updated : r)))
        toast({
          title: 'Receita desarquivada',
          description: 'A receita voltou a ficar disponível.',
        })
      } else {
        const updated = await recipeService.archiveRecipe(recipe.id)
        setRecipes(recipes.map((r) => (r.id === recipe.id ? updated : r)))
        toast({
          title: 'Receita arquivada',
          description:
            'O slug é permanente e preservado. A receita não aparece mais nas listagens públicas.',
        })
      }
    } catch (err) {
      toast({
        title: 'Erro ao arquivar',
        description: 'Não foi possível alterar o status.',
        variant: 'destructive',
      })
    }
  }

  const filteredRecipes = recipes.filter((r) => {
    if (activeTab === 'published') return r.status === 'published'
    if (activeTab === 'draft') return r.status === 'draft'
    if (activeTab === 'archived') return r.status === 'archived'
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/80">
        <div>
          <h1 className="font-serif-recipe text-3xl sm:text-4xl font-extrabold text-foreground flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-primary" />
            Minha Cozinha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu acervo culinário pessoal. Receitas nunca são deletadas, apenas arquivadas
            para manter integridade permanente de links.
          </p>
        </div>

        <Button
          asChild
          className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold gap-2 self-start sm:self-center"
        >
          <Link to="/receitas/nova">
            <PlusCircle className="w-4 h-4" />
            Cortar a minha rodela
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-foreground text-background'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas ({recipes.length})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'published'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Publicadas ({recipes.filter((r) => r.status === 'published').length})
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'draft'
              ? 'bg-foreground text-background'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Rascunhos ({recipes.filter((r) => r.status === 'draft').length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'archived'
              ? 'bg-stone-600 text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Arquivadas ({recipes.filter((r) => r.status === 'archived').length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-28 rounded-2xl" />
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border/80">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-serif-recipe font-bold text-lg text-foreground mb-1">
            Nada aqui. Comece pela receita que você faz de olhos fechados.
          </h3>
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/receitas/nova">Criar Receita Agora</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => {
            const authorUsername = currentUser?.username || 'autor'
            const publicUrl = publicRecipeUrl(authorUsername, recipe.slug, recipe)

            return (
              <Card
                key={recipe.id}
                className="overflow-hidden rounded-2xl border-border flex flex-col justify-between group hover:shadow-md transition-all"
              >
                {/* Image and status badge */}
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
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold border backdrop-blur-md shadow-sm ${
                        recipe.status === 'published'
                          ? 'bg-[#C9F24D] text-[#12100E] border-none'
                          : recipe.status === 'draft'
                            ? 'bg-foreground text-background border-none'
                            : 'bg-foreground text-background border-none'
                      }`}
                    >
                      {recipe.status === 'published'
                        ? 'Publicada'
                        : recipe.status === 'draft'
                          ? 'Rascunho'
                          : 'Arquivada'}
                    </Badge>

                    {recipe.visibility !== 'public' && (
                      <Badge
                        variant="outline"
                        className="bg-black/60 text-white text-[10px] border-none backdrop-blur-md"
                      >
                        {recipe.visibility === 'unlisted' ? 'Não listada' : 'Privada'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif-recipe font-bold text-lg text-foreground line-clamp-1 mb-1">
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {recipe.description || 'Sem descrição.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs gap-1"
                    >
                      <Link to={publicUrl}>
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        Ver Página
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(recipe)}
                      className={`text-xs gap-1 rounded-lg ${
                        recipe.status === 'archived'
                          ? 'text-primary hover:text-primary/80'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={
                        recipe.status === 'archived'
                          ? 'Restaurar receita'
                          : 'Arquivar receita (nunca excluída)'
                      }
                    >
                      {recipe.status === 'archived' ? (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          Restaurar
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          Arquivar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
