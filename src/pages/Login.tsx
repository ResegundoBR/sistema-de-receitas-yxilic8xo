import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { ChefHat, Lock, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailOrUsername.trim() || !password) return

    setLoading(true)
    try {
      await authService.login(emailOrUsername.trim(), password)
      toast({
        title: 'Bem-vindo(a) de volta!',
        description: 'Login realizado com sucesso.',
      })
      navigate('/minha-cozinha')
    } catch (err: any) {
      toast({
        title: 'Falha no login',
        description: 'Verifique seu e-mail/usuário e senha.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 sm:p-8 rounded-3xl border-border shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="font-serif-recipe text-2xl sm:text-3xl font-extrabold text-foreground">
            Acessar Minha Cozinha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Entre com seus dados para gerenciar receitas e acervos.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              E-mail ou Usuário
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                required
                type="text"
                placeholder="seu.email@exemplo.com ou username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 mt-2 gap-2"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <span>Não tem uma conta ainda? </span>
          <Link to="/cadastro" className="text-primary font-semibold hover:underline">
            Cadastre-se grátis
          </Link>
        </div>
      </Card>
    </div>
  )
}
