/* 404 — Página não encontrada (em português, com a marca Rodela) */
import { Link } from 'react-router-dom'
import { RodelaMark } from '@/components/brand/RodelaMark'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-creme px-4">
      <div className="text-center">
        <RodelaMark className="w-14 h-14 mx-auto mb-6" />
        <h1 className="font-display text-5xl sm:text-6xl text-espresso mb-4">404</h1>
        <p className="text-xl text-espresso/80 mb-8">Página não encontrada.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-tomate hover:bg-tomate/90 text-creme font-semibold px-6 py-3 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
