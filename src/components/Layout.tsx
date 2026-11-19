import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  PlusCircle,
  BookMarked,
  ChefHat,
  User,
  LogOut,
  WifiOff,
  Menu,
  X,
} from 'lucide-react'
import { authService } from '@/services/authService'
import { User as UserType } from '@/types/recipe'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { RodelaLogo, RodelaMark } from '@/components/brand/RodelaMark'

export default function Layout() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(authService.getCurrentUser())
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const unsub = authService.subscribe((user) => {
      setCurrentUser(user)
    })

    const handleOnline = () => {
      setIsOffline(false)
      toast({
        title: 'Conexão restabelecida',
        description: 'Você está online novamente. O acervo foi atualizado.',
      })
    }
    const handleOffline = () => {
      setIsOffline(true)
      toast({
        title: 'Modo Offline',
        description: 'Você está desconectado. As receitas salvas em cache continuam acessíveis.',
        variant: 'destructive',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    toast({
      title: 'Você saiu da sua conta',
      description: 'Até logo!',
    })
    navigate('/')
  }

  const activeLinkClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'text-espresso bg-tomate/15'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`

  const mobileLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
      active ? 'bg-tomate/15 text-espresso font-semibold' : 'text-foreground hover:bg-muted'
    }`

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-tomate/20 selection:text-espresso">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-espresso text-creme text-xs sm:text-sm font-medium py-1.5 px-4 flex items-center justify-center gap-2 text-center sticky top-0 z-50 animate-fade-in">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Você está no <strong>Modo Offline</strong>. Acessando acervo salvo localmente.
          </span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-creme/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Rodela — início">
            <RodelaLogo markClassName="w-8 h-8 group-hover:scale-105 transition-transform duration-200" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link to="/" className={activeLinkClass(location.pathname === '/')}>
              Explorar
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/minha-cozinha"
                  className={activeLinkClass(location.pathname.startsWith('/minha-cozinha'))}
                >
                  Minha Cozinha
                </Link>
                <Link
                  to="/colecoes"
                  className={activeLinkClass(location.pathname.startsWith('/colecoes'))}
                >
                  Coleções
                </Link>
              </>
            )}
          </nav>

          {/* Actions & User menu */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              size="sm"
              className="bg-tomate hover:bg-tomate/90 text-creme rounded-full font-semibold px-4 gap-1.5 hidden sm:inline-flex"
            >
              <Link to={currentUser ? '/receitas/nova' : '/cadastro'}>
                <PlusCircle className="w-4 h-4" />
                <span>{currentUser ? 'Nova Receita' : 'Criar Conta'}</span>
              </Link>
            </Button>

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-tomate/40 focus:outline-none transition-all"
                    aria-label="Abrir menu da conta"
                  >
                    <Avatar className="w-9 h-9 border border-areia">
                      <AvatarImage
                        src={authService.getAvatarUrl(currentUser)}
                        alt={currentUser.display_name}
                      />
                      <AvatarFallback className="bg-areia/40 text-espresso font-bold text-xs">
                        {currentUser.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {currentUser.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{currentUser.username}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/minha-cozinha" className="cursor-pointer gap-2">
                      <ChefHat className="w-4 h-4 text-tomate" />
                      Minhas Receitas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/colecoes" className="cursor-pointer gap-2">
                      <BookMarked className="w-4 h-4 text-tomate" />
                      Receitas Salvas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer gap-2">
                      <User className="w-4 h-4 text-tomate" />
                      Editar Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="font-medium text-foreground">
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-creme px-4 pt-2 pb-4 space-y-2 animate-slide-down">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass(false)}
            >
              <Search className="w-4 h-4 text-tomate" />
              Explorar Receitas
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/receitas/nova"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass(false) + ' bg-tomate text-creme font-semibold'}
                >
                  <PlusCircle className="w-4 h-4" />
                  Nova Receita
                </Link>
                <Link
                  to="/minha-cozinha"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass(location.pathname.startsWith('/minha-cozinha'))}
                >
                  <ChefHat className="w-4 h-4 text-tomate" />
                  Minha Cozinha
                </Link>
                <Link
                  to="/colecoes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass(location.pathname.startsWith('/colecoes'))}
                >
                  <BookMarked className="w-4 h-4 text-tomate" />
                  Coleções & Salvos
                </Link>
                <Link
                  to="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass(false)}
                >
                  <User className="w-4 h-4 text-tomate" />
                  Meu Perfil
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Link>
                </Button>
                <Button asChild className="w-full bg-tomate hover:bg-tomate/90 text-creme">
                  <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                    Criar Minha Conta
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/60 py-8 text-center text-xs text-muted-foreground hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RodelaMark className="w-4 h-4" />
            <span className="font-display text-foreground">Rodela</span>
            <span>— Receita de gente de verdade.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Receitas que abrem direto no WhatsApp</span>
            <span>•</span>
            <span>Funciona até sem internet</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (App Experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-creme/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/' ? 'text-tomate' : 'text-muted-foreground'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Explorar</span>
        </Link>

        <Link
          to={currentUser ? '/receitas/nova' : '/cadastro'}
          aria-label="Nova receita"
          className="flex flex-col items-center justify-center -mt-5 bg-tomate text-creme rounded-full p-3 hover:scale-105 active:scale-95 transition-all"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>

        <Link
          to={currentUser ? '/minha-cozinha' : '/login'}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/minha-cozinha') ? 'text-tomate' : 'text-muted-foreground'
          }`}
        >
          <ChefHat className="w-5 h-5 mb-0.5" />
          <span>Cozinha</span>
        </Link>

        <Link
          to={currentUser ? '/colecoes' : '/login'}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/colecoes') ? 'text-tomate' : 'text-muted-foreground'
          }`}
        >
          <BookMarked className="w-5 h-5 mb-0.5" />
          <span>Salvos</span>
        </Link>
      </div>
    </div>
  )
}
