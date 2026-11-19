import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed,
  Search,
  PlusCircle,
  BookMarked,
  ChefHat,
  User,
  LogOut,
  LogIn,
  WifiOff,
  Menu,
  X,
  Share2,
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

  const navLinks = [
    { label: 'Explorar', path: '/', icon: Search },
    { label: 'Minha Cozinha', path: '/minha-cozinha', icon: ChefHat, authRequired: true },
    { label: 'Coleções', path: '/colecoes', icon: BookMarked, authRequired: true },
    {
      label: 'Nova Receita',
      path: '/receitas/nova',
      icon: PlusCircle,
      authRequired: true,
      highlight: true,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-amber-100 selection:text-amber-900">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs sm:text-sm font-medium py-1.5 px-4 flex items-center justify-center gap-2 text-center sticky top-0 z-50 shadow-sm animate-fade-in">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Você está no <strong>Modo Offline</strong>. Acessando acervo salvo localmente.
          </span>
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-recipe font-bold text-xl sm:text-2xl text-foreground tracking-tight leading-none block">
                Receitas
                <span className="text-primary font-sans text-xs ml-1 font-semibold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-primary px-1.5 py-0.5 rounded-md">
                  Rede
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block font-medium">
                Acervo Pessoal & Rede
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-primary bg-orange-50 dark:bg-orange-950/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Explorar
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/minha-cozinha"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/minha-cozinha')
                      ? 'text-primary bg-orange-50 dark:bg-orange-950/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Minha Cozinha
                </Link>
                <Link
                  to="/colecoes"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/colecoes')
                      ? 'text-primary bg-orange-50 dark:bg-orange-950/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-orange-500/25 rounded-full font-medium px-4 gap-1.5 hidden sm:inline-flex"
            >
              <Link to={currentUser ? '/receitas/nova' : '/login'}>
                <PlusCircle className="w-4 h-4" />
                <span>Nova Receita</span>
              </Link>
            </Button>

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-orange-300 focus:outline-none transition-all">
                    <Avatar className="w-9 h-9 border border-orange-200">
                      <AvatarImage
                        src={authService.getAvatarUrl(currentUser)}
                        alt={currentUser.display_name}
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-800 font-bold text-xs">
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
                      <ChefHat className="w-4 h-4 text-orange-600" />
                      Minhas Receitas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/colecoes" className="cursor-pointer gap-2">
                      <BookMarked className="w-4 h-4 text-orange-600" />
                      Receitas Salvas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer gap-2">
                      <User className="w-4 h-4 text-orange-600" />
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
                <Button
                  asChild
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 font-medium hidden sm:inline-flex rounded-full"
                >
                  <Link to="/cadastro">Cadastrar</Link>
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
          <div className="md:hidden border-b bg-card px-4 pt-2 pb-4 space-y-2 animate-slide-down">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
            >
              <Search className="w-4 h-4 text-orange-600" />
              Explorar Acervo
            </Link>
            {currentUser ? (
              <>
                <Link
                  to="/receitas/nova"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 font-semibold"
                >
                  <PlusCircle className="w-4 h-4" />
                  Cadastrar Receita
                </Link>
                <Link
                  to="/minha-cozinha"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  Minha Cozinha
                </Link>
                <Link
                  to="/colecoes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  <BookMarked className="w-4 h-4 text-orange-600" />
                  Coleções & Salvos
                </Link>
                <Link
                  to="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  <User className="w-4 h-4 text-orange-600" />
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
                    Entrar na Conta
                  </Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground">
                  <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                    Criar Conta Grátis
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
            <span className="font-serif-recipe font-bold text-foreground">Sistema de Receitas</span>
            <span>— Acervo Pessoal & Rede Culinária</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Links públicos otimizados para WhatsApp</span>
            <span>•</span>
            <span>Suporte Offline PWA</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (App Experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Explorar</span>
        </Link>

        <Link
          to="/receitas/nova"
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-amber-600 to-orange-500 text-white rounded-full p-3 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>

        <Link
          to={currentUser ? '/minha-cozinha' : '/login'}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/minha-cozinha')
              ? 'text-primary'
              : 'text-muted-foreground'
          }`}
        >
          <ChefHat className="w-5 h-5 mb-0.5" />
          <span>Cozinha</span>
        </Link>

        <Link
          to={currentUser ? '/colecoes' : '/login'}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            location.pathname.startsWith('/colecoes') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <BookMarked className="w-5 h-5 mb-0.5" />
          <span>Salvos</span>
        </Link>
      </div>
    </div>
  )
}
