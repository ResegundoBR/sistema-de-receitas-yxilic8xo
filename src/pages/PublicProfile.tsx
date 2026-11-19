/* Rodela — perfil público do autor: /r/:username (receitas publicadas + públicas) */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { authService } from '@/services/authService'
import { User, Recipe } from '@/types/recipe'
import { RecipeCard } from '@/components/RecipeCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MapPin, ShieldAlert, ChefHat } from 'lucide-react'

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>()

  const [author, setAuthor] = useState<User | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!username) return
      setLoading(true)
      setNotFound(false)
      try {
        const found = await pb
          .collection('users')
          .getFirstListItem<User>(`username = "${username.toLowerCase()}"`)
        setAuthor(found)

        const res = await pb.collection('recipes').getList<Recipe>(1, 60, {
          filter: `author = "${found.id}" && status = "published" && visibility = "public"`,
          sort: '-created',
          expand: 'author,category',
        })
        setRecipes(res.items)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <Skeleton className="w-48 h-6" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-56 h-7" />
            <Skeleton className="w-40 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !author) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl text-espresso mb-2">Perfil não encontrado</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Não existe cozinheiro com esse apelido por aqui.
        </p>
        <Button asChild className="rounded-full bg-espresso hover:bg-espresso/90 text-creme">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    )
  }

  const authorName = author.display_name || author.username
  const initials = authorName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Cabeçalho do autor */}
      <header className="bg-creme border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center text-foreground font-display text-2xl shrink-0">
              {author.avatar ? (
                <img
                  src={authService.getAvatarUrl(author)}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl text-espresso leading-tight break-words">
                {authorName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="font-medium">@{author.username}</span>
                {(author.city || author.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-tomate" />
                    {[author.city, author.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {author.bio && (
            <p className="text-sm sm:text-base text-espresso-soft leading-relaxed mt-4 max-w-2xl">
              {author.bio}
            </p>
          )}
        </div>
      </header>

      {/* Receitas publicadas */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="font-display text-lg sm:text-xl text-espresso mb-5">
          {recipes.length === 1 ? '1 receita publicada' : `${recipes.length} receitas publicadas`}
        </h2>

        {recipes.length === 0 ? (
          <div className="text-center py-14 px-4 bg-card rounded-2xl border border-dashed border-border/80">
            <ChefHat className="w-10 h-10 text-areia mx-auto mb-3" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Nenhuma receita publicada por aqui ainda — volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
