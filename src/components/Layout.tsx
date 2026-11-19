import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import type { User } from '@/types/recipe'
import { RodelaLogo } from '@/components/brand/RodelaMark'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Search, Plus, Menu, X, LogOut, BookMarked, Compass, ChefHat } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())

  authService.onAuthChange((u) => setUser(u))

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    toast({
      title: 'Você saiu da sua conta.',
      description: 'Até a próxima rodela!',
    })
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    navigate(`/explorar?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setMobileOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? 'text-tomate' : 'text-espresso hover:text-tomate'
    }`

  const links = (
    <>
      <NavLink to="/explorar" className={navLinkClass}>
        Explorar
      </NavLink>
      <NavLink to="/minha-cozinha" className={navLinkClass}>
        Minha cozinha
      </NavLink>
      <NavLink to="/salvos" className={navLinkClass}>
        Salvos
      </NavLink>
      <button
        onClick={() => setSearchOpen((v) => !v)}
        className="text-sm font-semibold text-espresso hover:text-tomate transition-colors"
      >
        Buscar
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-creme">
      <header className="sticky top-0 z-40 bg-creme/95 backdrop-blur-sm border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo: símbolo do arco + ponto em tomate ao lado do wordmark */}
            <Link to="/" className="flex items-center shrink-0" aria-label="Rodela — início">
              <RodelaLogo />
            </Link>

            {/* Navegação desktop */}
            <nav className="hidden md:flex items-center gap-8">{links}</nav>

            {/* Ações */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Button
                    asChild
                    size="sm"
                    className="hidden sm:inline-flex rounded-full bg-tomate hover:bg-tomate/90 text-creme font-semibold gap-1.5"
                  >
                    <Link to="/receitas/nova">
                      <Plus className="w-4 h-4" />
                      Nova receita
                    </Link>
                  </Button>
                  <button
                    onClick={handleLogout}
                    title="Sair"
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full bg-espresso text-creme text-xs font-bold font-display hover:bg-tomate transition-colors"
                  >
                    {user.display_name?.charAt(0).toUpperCase() || 'U'}
                  </button>
                </>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="hidden sm:inline-flex rounded-full bg-espresso hover:bg-espresso/90 text-creme font-semibold"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
              )}

              {/* Botão mobile */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-espresso/5"
                aria-label="Abrir menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Busca desdobrável (desktop e mobile) */}
          {searchOpen && (
            <form
              onSubmit={handleSearch}
              className="pb-4 pt-1 flex items-center gap-2 border-t border-border/60"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busque por pão, bolo, moqueca..."
                className="flex-1 bg-transparent outline-none text-sm text-espresso placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-espresso hover:bg-espresso/90 text-creme text-xs font-semibold"
              >
                Buscar
              </Button>
            </form>
          )}

          {/* Menu mobile */}
          {mobileOpen && (
            <nav className="md:hidden pb-4 pt-2 flex flex-col gap-3 border-t border-border/60">
              {links}
              {user ? (
                <>
                  <Button
                    asChild
                    size="sm"
                    className="mt-1 rounded-full bg-tomate hover:bg-tomate/90 text-creme font-semibold gap-1.5"
                  >
                    <Link to="/receitas/nova">
                      <Plus className="w-4 h-4" />
                      Nova receita
                    </Link>
                  </Button>
                  <button
                    onClick={handleLogout}
                    className="text-left text-sm font-semibold text-muted-foreground hover:text-tomate"
                  >
                    <LogOut className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Sair da conta
                  </button>
                </>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="mt-1 rounded-full bg-espresso hover:bg-espresso/90 text-creme font-semibold"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
              )}
            </nav>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <RodelaLogo markClassName="h-6 w-6" textClassName="text-base" />
          <p className="text-xs text-muted-foreground">
            Receita de gente de verdade. Cadastre a sua, veja a dos outros, faça do seu jeito.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/explorar" className="hover:text-tomate transition-colors">
              Explorar
            </Link>
            <Link to="/receitas/nova" className="hover:text-tomate transition-colors">
              Nova receita
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
