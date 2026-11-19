import { Link } from 'react-router-dom'
import { Recipe } from '@/types/recipe'
import { recipeService } from '@/services/recipeService'
import { Clock, ChefHat, Sparkles, Lock, Link as LinkIcon, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RecipeCardProps {
  recipe: Recipe
  showStatusBadge?: boolean
}

export function RecipeCard({ recipe, showStatusBadge }: RecipeCardProps) {
  const authorName = recipe.expand?.author?.display_name || 'Chef Anônimo'
  const authorUsername = recipe.expand?.author?.username || 'autor'
  const totalMinutes = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0)

  // License label mapping
  const licenseLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Aberta', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    credit: { label: 'Crédito', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ask: { label: 'Sob Consulta', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    closed: { label: 'Fechada', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  }

  const licenseInfo = licenseLabels[recipe.license] || licenseLabels.open

  // Recipe target link: direct public link /r/:username/:slug
  const recipeLink = `/r/${authorUsername}/${recipe.slug}`

  return (
    <Link
      to={recipeLink}
      className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/70 hover:border-orange-300/80 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={recipeService.getFileUrl(recipe)}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback image if file not found
            ;(e.target as HTMLImageElement).src =
              'https://img.usecurling.com/p/800/600?q=recipe,food'
          }}
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Category or License badge */}
          {recipe.expand?.category ? (
            <Badge
              variant="secondary"
              className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground font-medium text-xs px-2.5 py-0.5 shadow-sm"
            >
              {recipe.expand.category.name}
            </Badge>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            {showStatusBadge && recipe.visibility !== 'public' && (
              <Badge
                variant="outline"
                className="bg-amber-500/90 text-white border-none text-[10px] px-2 py-0.5 flex items-center gap-1 shadow-sm"
              >
                {recipe.visibility === 'unlisted' ? (
                  <LinkIcon className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                {recipe.visibility === 'unlisted' ? 'Não listada' : 'Privada'}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] font-medium border px-2 py-0.5 shadow-sm ${licenseInfo.color}`}
            >
              {licenseInfo.label}
            </Badge>
          </div>
        </div>

        {/* Bottom Time & Yield bar on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs drop-shadow-sm font-medium">
          {totalMinutes > 0 && (
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{totalMinutes} min</span>
            </div>
          )}

          {recipe.yield_quantity && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
              <span>
                {recipe.yield_quantity} {recipe.yield_unit || 'porções'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium truncate">{authorName}</span>
          <span>•</span>
          <span className="text-[11px] truncate">@{authorUsername}</span>
        </div>

        {/* Title */}
        <h3 className="font-serif-recipe font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-1">
            {recipe.description}
          </p>
        )}

        {/* Footer info: Difficulty & ingredient count */}
        <div className="pt-3 mt-auto border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-[11px]">Dificuldade:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-1.5 h-3 rounded-full ${
                    lvl <= (recipe.difficulty || 2) ? 'bg-amber-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-[11px]">
            {recipe.ingredient_count
              ? `${recipe.ingredient_count} ingredientes`
              : 'Receita completa'}
          </div>
        </div>
      </div>
    </Link>
  )
}
