import { Link } from 'react-router-dom'
import { Recipe } from '@/types/recipe'
import { recipeService } from '@/services/recipeService'
import { Clock, Lock, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RecipeCardProps {
  recipe: Recipe
  showStatusBadge?: boolean
}

const licenseLabels: Record<string, string> = {
  open: 'Aberta',
  credit: 'Crédito',
  ask: 'Sob Consulta',
  closed: 'Fechada',
}

export function RecipeCard({ recipe, showStatusBadge }: RecipeCardProps) {
  const authorName = recipe.expand?.author?.display_name || 'Cozinheiro Anônimo'
  const authorUsername = recipe.expand?.author?.username || 'autor'
  const totalMinutes = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0)
  const licenseLabel = licenseLabels[recipe.license] || licenseLabels.open

  // Link público da receita: /r/:username/:slug
  const recipeLink = `/r/${authorUsername}/${recipe.slug}`

  return (
    <Link
      to={recipeLink}
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/70 hover:border-tomate/60 shadow-sm hover:shadow-elevation transition-all duration-300"
    >
      {/* Capa */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-areia-soft">
        <img
          src={recipeService.getFileUrl(recipe)}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'https://img.usecurling.com/p/800/600?q=recipe,food'
          }}
        />

        {/* Selo de visibilidade (só quando não é pública) */}
        {showStatusBadge && recipe.visibility !== 'public' && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-espresso/85 text-creme border-none text-[10px] px-2 py-0.5 flex items-center gap-1">
              {recipe.visibility === 'unlisted' ? (
                <LinkIcon className="w-3 h-3" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              {recipe.visibility === 'unlisted' ? 'Só por link' : 'Privada'}
            </Badge>
          </div>
        )}

        {/* Categoria */}
        {recipe.expand?.category && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-creme/95 text-espresso border-none text-xs px-2.5 py-0.5 font-semibold">
              {recipe.expand.category.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Autor */}
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-tomate/15 text-tomate flex items-center justify-center font-bold text-[10px]">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium truncate">{authorName}</span>
          <span>•</span>
          <span className="text-[11px] truncate">@{authorUsername}</span>
        </div>

        {/* Título */}
        <h3 className="font-display text-base sm:text-lg text-espresso group-hover:text-tomate transition-colors line-clamp-2 leading-snug mb-2">
          {recipe.title}
        </h3>

        {/* Descrição */}
        {recipe.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-1">
            {recipe.description}
          </p>
        )}

        {/* Rodapé: tempo, rendimento e licença */}
        <div className="pt-3 mt-auto border-t border-border/50 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 min-w-0">
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5 text-tomate" />
                <span className="tabular-nums">{totalMinutes} min</span>
              </span>
            )}
            {recipe.yield_quantity ? (
              <span className="tabular-nums truncate">
                {recipe.yield_quantity} {recipe.yield_unit || 'porções'}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 text-[11px]">{licenseLabel}</span>
        </div>
      </div>
    </Link>
  )
}
