import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Lock, Mail, User, MapPin, Upload, ArrowRight, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { RodelaMark } from '@/components/brand/RodelaMark'

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
          title: 'Foto muito grande',
          description: 'Escolha uma foto de até 5MB.',
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

    const cleanUsername = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      toast({
        title: 'Escolha outro apelido',
        description:
          'Use de 3 a 30 letras minúsculas, números ou _ (traço baixo). Sem espaços ou acentos. Ele não pode ser trocado depois — é o nome que aparece para quem pede suas receitas.',
        variant: 'destructive',
      })
      return
    }

    if (password !== passwordConfirm) {
      toast({
        title: 'As senhas são diferentes',
        description: 'Escreva a mesma senha nos dois campos.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'Use pelo menos 8 caracteres para manter sua cozinha protegida.',
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
        title: 'Conta criada!',
        description: `Bem-vindo(a) à Rodela, ${displayName.trim()}!`,
      })
      navigate('/minha-cozinha')
    } catch (err: any) {
      const fieldMsg = err?.response?.data?.message || err?.message || ''
      let description =
        'Não conseguimos criar sua conta. Confira os dados e tente de novo — talvez o e-mail ou o apelido já estejam em uso.'
      if (/username/i.test(fieldMsg)) {
        description = 'Esse apelido já foi escolhido por outra pessoa. Tente um diferente.'
      } else if (/email/i.test(fieldMsg)) {
        description = 'Esse e-mail já tem conta aqui. É só entrar com ele.'
      }
      toast({
        title: 'Quase lá',
        description,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const labelClass = 'text-xs font-semibold text-espresso uppercase tracking-wider'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border-border shadow-elevation">
        <div className="text-center mb-8">
          <RodelaMark className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-display text-2xl sm:text-3xl text-espresso">Criar minha conta</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Guarde e compartilhe suas receitas com quem você quiser. Grátis.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4 p-3 bg-areia-soft rounded-2xl">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-creme flex items-center justify-center text-espresso font-bold shrink-0 border border-border">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Sua foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-areia" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-creme hover:bg-muted text-xs font-semibold text-espresso">
                <Upload className="w-3.5 h-3.5 text-tomate" />
                <span>Colocar sua foto</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Camera className="w-3 h-3" /> JPG ou PNG, até 5MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className={labelClass}>
                Seu nome <span className="text-tomate">*</span>
              </label>
              <Input
                id="reg-name"
                required
                placeholder="Como aparece nas suas receitas"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl"
                maxLength={80}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-username" className={labelClass}>
                Seu apelido <span className="text-tomate">*</span>
              </label>
              <Input
                id="reg-username"
                required
                placeholder="ex: lauracozinha"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="rounded-xl"
                maxLength={30}
              />
              <span className="text-[11px] text-muted-foreground block">
                É assim que as pessoas encontram suas receitas. Escolha com carinho: não dá para
                trocar depois.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-email" className={labelClass}>
              E-mail <span className="text-tomate">*</span>
            </label>
            <Input
              id="reg-email"
              required
              type="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
            <span className="text-[11px] text-muted-foreground block">
              Fica guardado com você. Nunca mostramos para outras pessoas.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-pass" className={labelClass}>
                Senha <span className="text-tomate">*</span>
              </label>
              <Input
                id="reg-pass"
                required
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-pass2" className={labelClass}>
                Repetir a senha <span className="text-tomate">*</span>
              </label>
              <Input
                id="reg-pass2"
                required
                type="password"
                autoComplete="new-password"
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
              <label htmlFor="reg-city" className={labelClass}>
                Cidade <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-areia" />
                <Input
                  id="reg-city"
                  placeholder="Belo Horizonte"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reg-uf" className={labelClass}>
                UF
              </label>
              <Input
                id="reg-uf"
                placeholder="MG"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="rounded-xl"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-bio" className={labelClass}>
              Sobre você <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              placeholder="O que você mais gosta de cozinhar?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl resize-none h-20"
              maxLength={280}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tomate hover:bg-tomate/90 text-creme font-semibold py-5 mt-2 gap-2"
          >
            {loading ? 'Criando…' : 'Criar minha conta'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <span>Já guarda receitas aqui? </span>
          <Link to="/login" className="text-tomate font-semibold hover:underline">
            Entrar
          </Link>
        </div>
      </Card>
    </div>
  )
}
