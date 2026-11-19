import { useRef, useCallback, useEffect } from 'react'

/**
 * Hook de carrossel arrastável: transforma um contêiner com overflow-x em um
 * carrossel de arrastar (drag/swipe) com inércia (momentum) e sem barra de
 * scroll visível. No toque (dedo) usa a rolagem nativa (que já tem inércia no
 * SO); com o mouse, arrasta e aplica momentum ao soltar. Chips/botões dentro
 * continuam clicáveis — o clique só é ignorado se houve arraste de verdade.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  // Estado de arraste guardado em ref para não re-renderizar durante o gesto
  const state = useRef({
    isDown: false,
    dragged: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    rafId: 0,
    velocityTimeout: 0,
  })

  const stopMomentum = useCallback(() => {
    if (state.current.rafId) {
      cancelAnimationFrame(state.current.rafId)
      state.current.rafId = 0
    }
  }, [])

  const startMomentum = useCallback(
    (initialVelocity: number) => {
      const el = ref.current
      if (!el) return
      stopMomentum()

      let velocity = initialVelocity // px por frame (~16ms)
      const friction = 0.94
      const minVelocity = 0.35

      const step = () => {
        const node = ref.current
        if (!node) return
        // Aplica a inércia até parar por atrito ou bater no fim
        if (Math.abs(velocity) < minVelocity) {
          state.current.rafId = 0
          return
        }
        const max = node.scrollWidth - node.clientWidth
        const next = node.scrollLeft + velocity
        if (next <= 0 || next >= max) {
          node.scrollLeft = Math.max(0, Math.min(max, next))
          state.current.rafId = 0
          return
        }
        node.scrollLeft = next
        velocity *= friction
        state.current.rafId = requestAnimationFrame(step)
      }
      state.current.rafId = requestAnimationFrame(step)
    },
    [stopMomentum],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      // Só o botão esquerdo arrasta; o toque (dedo) usa o scroll nativo do SO
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      stopMomentum()
      state.current.isDown = true
      state.current.dragged = false
      state.current.startX = e.clientX
      state.current.lastX = e.clientX
      state.current.lastT = performance.now()
      state.current.scrollLeft = el.scrollLeft
      state.current.velocity = 0
      el.classList.add('cursor-grabbing', 'select-none')
    }

    const onPointerMove = (e: PointerEvent) => {
      const s = state.current
      if (!s.isDown) return
      const dx = e.clientX - s.lastX
      const now = performance.now()
      const dt = Math.max(now - s.lastT, 1)
      // Velocidade suavizada (px/ms -> px/frame)
      const instant = (dx / dt) * 16
      s.velocity = s.velocity * 0.8 + instant * 0.2

      if (Math.abs(e.clientX - s.startX) > 5) {
        s.dragged = true
        el.classList.add('cursor-grabbing', 'select-none')
      }
      el.scrollLeft -= dx
      s.lastX = e.clientX
      s.lastT = now
    }

    const endDrag = () => {
      const s = state.current
      if (!s.isDown) return
      s.isDown = false
      el.classList.remove('cursor-grabbing', 'select-none')
      // Inércia ao soltar
      if (Math.abs(s.velocity) > 1) startMomentum(s.velocity)
      // Solta o clique só depois de o evento de click do chip ser avaliado
      if (s.velocityTimeout) clearTimeout(s.velocityTimeout)
      s.velocityTimeout = setTimeout(() => {
        s.dragged = false
      }, 60) as unknown as number
    }

    const onClickCapture = (e: MouseEvent) => {
      // Um arraste de verdade não é um clique: não troca de categoria
      if (state.current.dragged) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('click', onClickCapture, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('click', onClickCapture, true)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      stopMomentum()
      if (state.current.velocityTimeout) clearTimeout(state.current.velocityTimeout)
    }
  }, [startMomentum, stopMomentum])

  return { ref }
}
