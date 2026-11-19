import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { User, Upload, ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Profile() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentUser = authService.getCurrentUser()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    setDisplayName(currentUser.display_name || '')
    setBio(currentUser.bio || '')
    setCity(currentUser.city || '')
    setState(currentUser.state || '')
    setAvatarPreview(authService.getAvatarUrl(currentUser))
  }, [currentUser, navigate])

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setSaving(true)
    try {
      await authService.updateProfile(currentUser.id, {
        display_name: displayName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        state: state.trim().slice(0, 2).toUpperCase(),
        avatar: avatarFile || undefined,
      })

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Card className="p-6 sm:p-8 rounded-3xl border-border shadow-md">
        <h1 className="font-serif-recipe text-2xl sm:text-3xl font-extrabold text-foreground mb-1">
          Meu Perfil
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-6">
          Atualize seus dados pessoais. O apelido é fixo: é por ele que as pessoas encontram suas
          receitas.
        </p>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 p-3.5 bg-muted/30 rounded-2xl">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Trocar Foto</span>
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

          {/* Username (Immutable notice) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Nome de Usuário</span>
              <span className="text-[10px] text-muted-foreground font-normal">Imutável</span>
            </label>
            <Input
              disabled
              value={`@${currentUser.username}`}
              className="rounded-xl bg-muted/60 text-muted-foreground font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Seu apelido faz parte do link das suas receitas e não pode ser alterado.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nome de Exibição
            </label>
            <Input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl"
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Cidade
              </label>
              <Input
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
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="rounded-xl"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl resize-none h-24 text-sm"
              maxLength={280}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-5 gap-2"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
