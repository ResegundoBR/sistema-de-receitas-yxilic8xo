import { ReactNode } from 'react'
import { useDragScroll } from '@/hooks/use-drag-scroll'

/**
 * Linha horizontal arrastável (drag com inércia, sem scrollbar).
 * Cada instância do componente tem o seu próprio hook — isolado no contêiner
 * que ele controla. Usada nas categorias e nas linhas de tags da home.
 */
export function DragScrollRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const drag = useDragScroll<HTMLDivElement>()

  return (
    <div
      ref={drag.ref}
      className={`flex items-center gap-2 overflow-x-auto scrollbar-none cursor-grab pb-1 -mx-1 px-1 ${className}`}
    >
      {children}
    </div>
  )
}
