import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import type { User } from '@/types/recipe'
import { RodelaLogo } from '@/components/brand/RodelaMark'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Menu, X, LogOut, User as UserIcon, ChefHat } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => authService.subscribe((u) => setUser(u)), [])

  // Fecha o menu de conta ao clicar fora
  useEffect(() => {
    if (!accountOpen) return
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [accountOpen])

  const handleLogout = () => {
    setAccountOpen(false)
    authService.logout()
    setUser(null)
    toast({
      title: 'Você saiu da sua conta.',
      description: 'Até a próxima rodela!',
    })
    navigate('/')
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
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={navLinkClass}>
          Admin
        </NavLink>
      )}
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
                  <div className="relative hidden sm:block" ref={accountRef}>
                    <button
                      onClick={() => setAccountOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      title="Sua conta"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-espresso text-creme text-xs font-bold font-display hover:bg-tomate transition-colors"
                    >
                      {user.display_name?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {accountOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-white shadow-elevation py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-border/60">
                          <p className="text-sm font-semibold text-espresso truncate">
                            {user.display_name || user.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <Link
                          to="/perfil"
                          onClick={() => setAccountOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-espresso hover:bg-creme transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          Meu perfil
                        </Link>
                        <Link
                          to="/minha-cozinha"
                          onClick={() => setAccountOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-espresso hover:bg-creme transition-colors"
                        >
                          <ChefHat className="w-4 h-4 text-muted-foreground" />
                          Minha cozinha
                        </Link>
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-espresso hover:bg-creme transition-colors border-t border-border/60 mt-1"
                        >
                          <LogOut className="w-4 h-4 text-muted-foreground" />
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
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
                  <div className="mt-1 pt-3 border-t border-border/60 flex flex-col gap-3">
                    <Link
                      to="/perfil"
                      onClick={() => setMobileOpen(false)}
                      className="text-left text-sm font-semibold text-espresso hover:text-tomate flex items-center gap-1.5"
                    >
                      <UserIcon className="w-4 h-4" />
                      Meu perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-left text-sm font-semibold text-muted-foreground hover:text-tomate flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
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

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
