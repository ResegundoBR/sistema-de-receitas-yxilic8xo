import { useDragScroll } from '@/hooks/use-drag-scroll'

interface DragScrollRowProps {
  children: React.ReactNode
  className?: string
}

/**
 * Fileira rolável na horizontal (drag com mouse, scroll nativo no toque).
 * Um véu de gradiente creme→transparente cobre a borda direita, indicando
 * que a lista continua (o último chip aparece "sumindo" no fade).
 * O véu não captura cliques (pointer-events-none) e mantém o gap dos chips.
 */
export function DragScrollRow({ children, className = '' }: DragScrollRowProps) {
  const { ref } = useDragScroll<HTMLDivElement>()

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-hide">
        {children}
      </div>
      {/* Fade creme na borda direita: sinaliza que dá para rolar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#F7F2E8] via-[#F7F2E8]/70 to-transparent"
      />
    </div>
  )
}
