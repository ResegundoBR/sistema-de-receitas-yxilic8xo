import { Component, type ReactNode } from 'react'

interface SafeBoundaryProps {
  children: ReactNode
  /** Conteúdo exibido se o bloco falhar. Padrão: nada (o resto da tela segue normal). */
  fallback?: ReactNode
}

interface SafeBoundaryState {
  hasError: boolean
}

/**
 * Limite de erro local: se um bloco da tela lançar exceção ao renderizar,
 * só esse bloco some (ou mostra o fallback) — a página inteira não cai
 * para a tela de erro.
 */
export class SafeBoundary extends Component<SafeBoundaryProps, SafeBoundaryState> {
  state: SafeBoundaryState = { hasError: false }

  static getDerivedStateFromError(): SafeBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Bloco da tela falhou ao renderizar:', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
