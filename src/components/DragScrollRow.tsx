import { ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDragScroll } from '@/hooks/use-drag-scroll'

interface DragScrollRowProps {
  children: React.ReactNode
  className?: string
}

/**
 * Fileira rolável na horizontal (drag com mouse, scroll nativo no toque),
 * sempre sem barra de scroll visível. Cada lado ganha um respiro de 12px
 * (padding interno + margem negativa equivalente): os chips deslizam por
 * inteiro até a borda e nenhum fica cortado no meio.
 */
export function DragScrollRow({ children, className = '' }: DragScrollRowProps) {
  const { ref } = useDragScroll<HTMLDivElement>()
  const [hasMoreEnd, setHasMoreEnd] = useState(false)

  const updateEdges = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setHasMoreEnd(el.scrollLeft < max - 4)
  }, [ref])

  useEffect(() => {
    updateEdges()
    const el = ref.current
    if (!el) return
    window.addEventListener('resize', updateEdges)
    // Chips chegam de forma assíncrona (categorias/tags carregam depois):
    // re-medir quando o conteúdo mudar.
    const observer = new MutationObserver(updateEdges)
    observer.observe(el, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('resize', updateEdges)
      observer.disconnect()
    }
  }, [updateEdges, ref])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        onScroll={updateEdges}
        className="flex gap-2 overflow-x-auto scrollbar-none
          px-3 -mx-3 py-1"
      >
        {children}
      </div>
      {/* Seta discreta à direita: só quando ainda há conteúdo escondido */}
      {hasMoreEnd && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2
            flex items-center justify-center w-6 h-6 rounded-full
            bg-creme/90 text-espresso/70 border border-border/60 text-xs"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}
