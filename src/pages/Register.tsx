import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { ChefHat, Lock, Mail, User, MapPin, Upload, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O avatar deve ter no máximo 5MB.',
          variant: 'destructive',
        })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate username regex: ^[a-z0-9_]{3,30}$
    const cleanUsername = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      toast({
        title: 'Nome de usuário inválido',
        description:
          'Deve conter de 3 a 30 caracteres alfanuméricos em minúsculas ou underline (a-z, 0-9, _). Este nome será imutável e fará parte dos seus links públicos.',
        variant: 'destructive',
      })
      return
    }

    if (password !== passwordConfirm) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação de senha deve ser idêntica.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve conter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      await authService.register({
        username: cleanUsername,
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim().slice(0, 2).toUpperCase() || undefined,
        avatar: avatarFile || undefined,
      })

      toast({
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo(a), ${displayName}!`,
      })
      navigate('/minha-cozinha')
    } catch (err: any) {
      console.error('Registration error:', err)
      toast({
        title: 'Erro ao cadastrar',
        description: err.message || 'Verifique se o e-mail ou nome de usuário já estão em uso.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border-border shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="font-serif-recipe text-2xl sm:text-3xl font-extrabold text-foreground">
            Criar Minha Cozinha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cadastre-se para compartilhar receitas com link permanente no WhatsApp.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-2xl">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-700 font-bold shrink-0 border">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Subir Foto de Perfil</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG ou WebP até 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nome de Exibição <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="Ex: Chef Laura Silva"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl"
                maxLength={80}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nome de Usuário (URL) <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="ex: lauracozinha"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="rounded-xl"
                maxLength={30}
              />
              <span className="text-[10px] text-muted-foreground block">
                Entra na URL pública: /r/{username || 'username'}/... (imutável)
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              E-mail <span className="text-destructive">*</span>
            </label>
            <Input
              required
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
            <span className="text-[10px] text-muted-foreground block">
              Nunca exposto publicamente (emailVisibility = false).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Senha (mín 8 carac.) <span className="text-destructive">*</span>
              </label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Confirmar Senha <span className="text-destructive">*</span>
              </label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="rounded-xl"
                minLength={8}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Cidade (opcional)
              </label>
              <Input
                placeholder="Belo Horizonte"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                UF
              </label>
              <Input
                placeholder="MG"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="rounded-xl"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Bio / Apresentação (opcional)
            </label>
            <Textarea
              placeholder="Conte um pouco sobre suas especialidades e paixão culinária..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl resize-none h-20"
              maxLength={280}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 mt-2 gap-2"
          >
            {loading ? 'Criando Conta...' : 'Cadastrar e Começar'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <span>Já possui uma conta? </span>
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  )
}
