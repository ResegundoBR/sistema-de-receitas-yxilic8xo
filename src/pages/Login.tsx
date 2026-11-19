import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { RodelaMark } from '@/components/brand/RodelaMark'

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
        description: 'Bom te ver por aqui.',
      })
      navigate('/minha-cozinha')
    } catch (err) {
      toast({
        title: 'Não conseguimos entrar',
        description: 'Confira seu e-mail ou usuário e a senha, e tente de novo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 sm:p-8 rounded-3xl border-border shadow-elevation">
        <div className="text-center mb-8">
          <RodelaMark className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl text-espresso">Entrar na Rodela</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Suas receitas estão guardadas aqui, do jeitinho que você deixou.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-espresso uppercase tracking-wider"
            >
              E-mail ou usuário
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-email"
                required
                type="text"
                autoComplete="username"
                placeholder="seu.email@exemplo.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold text-espresso uppercase tracking-wider"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-password"
                required
                type="password"
                autoComplete="current-password"
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
            className="w-full rounded-xl bg-tomate hover:bg-tomate/90 text-creme font-semibold py-5 mt-2 gap-2"
          >
            {loading ? 'Entrando…' : 'Entrar'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <span>Ainda não tem receitas por aqui? </span>
          <Link to="/cadastro" className="text-tomate font-semibold hover:underline">
            Criar minha conta
          </Link>
        </div>
      </Card>
    </div>
  )
}
