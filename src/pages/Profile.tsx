import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { User, Upload, ArrowLeft, Pencil, X, Check, KeyRound, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { User as AppUser } from '@/types/recipe'

/**
 * Perfil em dois modos, como a dona do produto pediu:
 *  - "view" (padrão): dados exibidos como texto, nada de input;
 *  - "edit"  : campos viram inputs pré-preenchidos, botões Salvar/Cancelar.
 *
 * O rascunho vive em estado próprio e é semeado UMA vez (ou ao entrar no modo
 * edição / ao salvar), nunca num useEffect ligado ao objeto de sessão — assim
 * nenhuma re-renderização apaga o que a pessoa digita.
 */
export default function Profile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentUser = useMemo(() => authService.getCurrentUser(), [])
  const [sessionUser, setSessionUser] = useState<AppUser | null>(currentUser)

  const [mode, setMode] = useState<'view' | 'edit'>('view')

  // Rascunho de edição (só tem valor enquanto mode === 'edit')
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftCity, setDraftCity] = useState('')
  const [draftState, setDraftState] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Alterar senha (fluxo já existente, mantido como está)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Redireciona uma única vez se não houver sessão
  useEffect(() => {
    if (!sessionUser) navigate('/login')
  }, [sessionUser, navigate])

  const startEdit = () => {
    const u = authService.getCurrentUser()
    setDraftName(u?.display_name ?? '')
    setDraftBio(u?.bio ?? '')
    setDraftCity(u?.city ?? '')
    setDraftState(u?.state ?? '')
    setAvatarFile(null)
    setAvatarPreview(u ? authService.getAvatarUrl(u) : '')
    setDirty(false)
    setMode('edit')
  }

  const cancelEdit = () => {
    setDirty(false)
    setMode('view')
  }

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
      setDirty(true)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = authService.getCurrentUser()
    if (!u) return

    if (!draftName.trim()) {
      toast({
        title: 'Falta o nome',
        description: 'Escreva um nome de exibição para salvar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await authService.updateProfile(u.id, {
        display_name: draftName.trim(),
        bio: draftBio.trim(),
        city: draftCity.trim(),
        state: draftState.trim().slice(0, 2).toUpperCase(),
        avatar: avatarFile || undefined,
      })

      const updated = authService.getCurrentUser()
      setSessionUser(updated)
      setDirty(false)
      setMode('view')
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas com sucesso.',
      })
    } catch (err) {
      // Erro do PocketBase por campo, mensagem do servidor ou erro de rede —
      // sempre em português e visível na tela.
      console.error('Erro ao salvar perfil:', err)
      toast({
        title: 'Não conseguimos salvar suas alterações',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = authService.getCurrentUser()
    if (!u) return

    if (newPassword.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'As senhas não conferem',
        description: 'A confirmação deve ser igual à nova senha.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword === currentPassword) {
      toast({
        title: 'Escolha uma senha diferente',
        description: 'A nova senha não pode ser igual à atual.',
        variant: 'destructive',
      })
      return
    }

    setSavingPassword(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast({
        title: 'Senha alterada!',
        description: 'Use a nova senha no próximo login.',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast({
        title: 'Não conseguimos alterar a senha',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  if (!sessionUser) return null

  const user = sessionUser
  const username = user.username || ''

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Card className="p-6 sm:p-8 rounded-3xl border-border shadow-md">
        <h1 className="font-serif-recipe text-2xl sm:text-3xl font-extrabold text-foreground mb-1">
          Meu Perfil
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          {mode === 'view'
            ? 'Estes são os seus dados. Toque em Editar para mudar o que quiser.'
            : 'Ajuste o que precisar e salve. O apelido é fixo: é por ele que as pessoas encontram suas receitas.'}
        </p>

        {mode === 'view' ? (
          /* ---------------- MODO EXIBIÇÃO ---------------- */
          <div className="space-y-5">
            {/* Foto + identidade */}
            <div className="flex items-center gap-4 p-3.5 bg-muted/30 rounded-2xl">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border">
                {authService.getAvatarUrl(user) ? (
                  <img
                    src={authService.getAvatarUrl(user)}
                    alt={`Foto de ${user.display_name || user.username}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-sm text-muted-foreground font-mono truncate">@{username}</p>
              </div>
            </div>

            {/* Dados como texto, não inputs */}
            <dl className="space-y-4">
              <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Apelido (imutável)
                </dt>
                <dd className="text-sm text-foreground font-mono bg-muted/40 rounded-xl px-3.5 py-2.5">
                  @{username}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome de exibição
                </dt>
                <dd className="text-sm text-foreground bg-muted/40 rounded-xl px-3.5 py-2.5">
                  {user.display_name || '—'}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cidade e estado
                </dt>
                <dd className="text-sm text-foreground bg-muted/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  {user.city || user.state
                    ? [user.city, user.state].filter(Boolean).join(' — ')
                    : '—'}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Bio
                </dt>
                <dd className="text-sm text-foreground bg-muted/40 rounded-xl px-3.5 py-2.5 whitespace-pre-line">
                  {user.bio || '—'}
                </dd>
              </div>
            </dl>

            <div className="pt-2">
              <Button
                type="button"
                onClick={startEdit}
                className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </div>
        ) : (
          /* ---------------- MODO EDIÇÃO ---------------- */
          <form onSubmit={handleSave} className="space-y-5">
            {/* Foto */}
            <div className="flex items-center gap-4 p-3.5 bg-muted/30 rounded-2xl">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Prévia do avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground">
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  <span>{avatarFile ? 'Trocar de novo' : 'Trocar foto'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-muted-foreground mt-1">JPG ou PNG, até 5MB</p>
              </div>
            </div>

            {/* Apelido: texto imutável, nunca input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Apelido (imutável)</span>
              </label>
              <div className="rounded-xl bg-muted/60 px-3.5 py-2.5 font-mono text-sm text-muted-foreground">
                @{username}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Seu apelido faz parte do link das suas receitas e não pode ser alterado.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nome de exibição
              </label>
              <Input
                value={draftName}
                onChange={(e) => {
                  setDraftName(e.target.value)
                  setDirty(true)
                }}
                className="rounded-xl"
                maxLength={80}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Cidade
                </label>
                <Input
                  value={draftCity}
                  onChange={(e) => {
                    setDraftCity(e.target.value)
                    setDirty(true)
                  }}
                  className="rounded-xl"
                  placeholder="Ex.: São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  UF
                </label>
                <Input
                  value={draftState}
                  onChange={(e) => {
                    setDraftState(e.target.value.toUpperCase())
                    setDirty(true)
                  }}
                  className="rounded-xl"
                  maxLength={2}
                  placeholder="SP"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Bio
              </label>
              <Textarea
                value={draftBio}
                onChange={(e) => {
                  setDraftBio(e.target.value)
                  setDirty(true)
                }}
                className="rounded-xl resize-none h-24 text-sm"
                maxLength={280}
                placeholder="Conte em poucas linhas quem cozinha por aqui..."
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                variant="outline"
                className="rounded-xl font-semibold py-5 gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Alterar senha */}
      <Card className="p-6 sm:p-8 rounded-3xl border-border shadow-md mt-6">
        <h2 className="font-serif-recipe text-xl sm:text-2xl font-extrabold text-foreground mb-1">
          Alterar senha
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          Para trocar, confirme a senha atual e escolha a nova (mínimo de 8 caracteres).
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Senha atual
            </label>
            <Input
              required
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nova senha
              </label>
              <Input
                required
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Confirmar nova senha
              </label>
              <Input
                required
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
                minLength={8}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={savingPassword}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 gap-2"
            >
              {savingPassword ? 'Alterando...' : 'Alterar senha'}
              <KeyRound className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a Explorar
        </Button>
      </div>
    </div>
  )
}
