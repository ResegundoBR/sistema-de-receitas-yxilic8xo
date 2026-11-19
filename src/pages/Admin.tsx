import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { Category, Tag } from '@/types/recipe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Tags, FolderTree, AlertTriangle, ShieldAlert } from 'lucide-react'

const DIMENSIONS: Array<Tag['dimension']> = [
  'ingrediente',
  'tecnica',
  'dieta',
  'ocasiao',
  'regiao',
  'equipamento',
  'estacao',
  'custo',
]

const DIMENSION_LABELS: Record<Tag['dimension'], string> = {
  ingrediente: 'Ingrediente',
  tecnica: 'Técnica',
  dieta: 'Dieta',
  ocasiao: 'Ocasião',
  regiao: 'Região',
  equipamento: 'Equipamento',
  estacao: 'Estação',
  custo: 'Custo',
}

type Tab = 'categorias' | 'tags'

export default function Admin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const currentUser = authService.getCurrentUser()

  const [tab, setTab] = useState<Tab>('categorias')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // Form state (create & edit)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [dimension, setDimension] = useState<Tag['dimension']>('ingrediente')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: Tab; id: string; name: string } | null>(
    null,
  )

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login')
      return
    }
    if (!isAdmin) return
    Promise.all([adminService.listCategories(), adminService.listTags()])
      .then(([cats, tgs]) => {
        setCategories(cats)
        setTags(tgs)
      })
      .catch(() =>
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar categorias e tags.',
          variant: 'destructive',
        }),
      )
      .finally(() => setLoading(false))
  }, [isAdmin, navigate, toast])

  const existingList = tab === 'categorias' ? categories : tags

  // Sugestões em tempo real enquanto digita (normalização: minúsculo, sem acento, sem pontuação)
  const similar = useMemo(
    () => adminService.similarNames(name, existingList, editingId || undefined),
    [name, existingList, editingId],
  )
  const exactDuplicate = useMemo(
    () =>
      existingList.some(
        (item) =>
          (!editingId || (item as unknown as { id: string }).id !== editingId) &&
          item.name.trim().toLowerCase() === name.trim().toLowerCase(),
      ),
    [existingList, name, editingId],
  )
  const blocked = exactDuplicate || name.trim().length === 0

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setParentId('')
    setSortOrder('0')
    setDimension('ingrediente')
  }

  const startEdit = (item: Category | Tag) => {
    setEditingId(item.id)
    setName(item.name)
    if ('parent' in item) {
      setParentId(item.parent || '')
      setSortOrder(String(item.sort_order || 0))
    } else {
      setDimension((item as Tag).dimension)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (blocked || saving) return
    if (exactDuplicate) {
      toast({
        title: 'Nome já existe',
        description: `Já existe ${tab === 'categorias' ? 'uma categoria' : 'uma tag'} com esse nome. Escolha outro.`,
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      if (tab === 'categorias') {
        const payload = {
          name: name.trim(),
          parent: parentId || undefined,
          sort_order: Number(sortOrder) || 0,
        }
        if (editingId) {
          await adminService.updateCategory(editingId, payload)
          toast({ title: 'Categoria atualizada!' })
        } else {
          await adminService.createCategory(payload)
          toast({ title: 'Categoria criada!' })
        }
        setCategories(await adminService.listCategories())
      } else {
        if (editingId) {
          await adminService.updateTag(editingId, { name: name.trim(), dimension })
          toast({ title: 'Tag atualizada!' })
        } else {
          await adminService.createTag(name.trim(), dimension)
          toast({ title: 'Tag criada!' })
        }
        setTags(await adminService.listTags())
      }
      resetForm()
    } catch (err) {
      toast({
        title: editingId ? 'Erro ao atualizar' : 'Erro ao criar',
        description: adminService.friendlyError(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'categorias') await adminService.deleteCategory(deleteTarget.id)
      else await adminService.deleteTag(deleteTarget.id)
      if (tab === 'categorias') setCategories(await adminService.listCategories())
      else setTags(await adminService.listTags())
      if (editingId === deleteTarget.id) resetForm()
      toast({ title: 'Removido com sucesso.' })
    } catch (err) {
      toast({
        title: 'Erro ao remover',
        description: adminService.friendlyError(err),
        variant: 'destructive',
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  if (!authService.isAuthenticated()) return null

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-espresso mb-2">Área do admin</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Este painel é restrito. Você não tem permissão de administrador.
        </p>
        <Button asChild className="rounded-xl">
          <a href="/">Voltar ao início</a>
        </Button>
      </div>
    )
  }

  // Árvore rasa de categorias (máx. 3 níveis)
  const categoryChildren = (parentId: string) =>
    categories.filter((c) => (c.parent || '') === parentId)
  const roots = categoryChildren('')

  const renderCategoryRow = (cat: Category, level: number) => (
    <div key={cat.id}>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-muted/50 group"
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {level > 0 && <span className="text-muted-foreground text-xs">↳</span>}
        <span className="text-sm font-medium text-foreground flex-1 truncate">{cat.name}</span>
        <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
          nível {cat.depth}
        </Badge>
        <button
          onClick={() => startEdit(cat)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-tomate"
          aria-label={`Editar ${cat.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDeleteTarget({ type: 'categorias', id: cat.id, name: cat.name })}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label={`Remover ${cat.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {level < 2 && categoryChildren(cat.id).map((child) => renderCategoryRow(child, level + 1))}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-espresso mb-1">Painel do admin</h1>
        <p className="text-sm text-muted-foreground">
          Categorias e tags do acervo. A criação é restrita ao admin para evitar a sopa de tags.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'categorias' ? 'default' : 'outline'}
          onClick={() => {
            setTab('categorias')
            resetForm()
          }}
          className="rounded-full gap-1.5 text-sm font-semibold flex-1 sm:flex-none"
        >
          <FolderTree className="w-4 h-4" />
          Categorias ({categories.length})
        </Button>
        <Button
          variant={tab === 'tags' ? 'default' : 'outline'}
          onClick={() => {
            setTab('tags')
            resetForm()
          }}
          className="rounded-full gap-1.5 text-sm font-semibold flex-1 sm:flex-none"
        >
          <Tags className="w-4 h-4" />
          Tags ({tags.length})
        </Button>
      </div>

      {/* Form criar/editar */}
      <Card className="p-5 rounded-2xl border-border shadow-sm mb-8">
        <h2 className="font-display text-lg text-espresso mb-4">
          {editingId
            ? tab === 'categorias'
              ? 'Editar categoria'
              : 'Editar tag'
            : tab === 'categorias'
              ? 'Nova categoria'
              : 'Nova tag'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nome
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tab === 'categorias' ? 'Ex: Massas' : 'Ex: Sem glúten'}
              className="rounded-xl"
              maxLength={60}
            />
            {/* Sugestões em tempo real */}
            {similar.length > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-[#C9F24D]/20 border border-[#C9F24D]/50">
                <p className="text-xs font-semibold text-espresso flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Já existe algo parecido:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {similar.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-creme text-espresso border border-border"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exactDuplicate && (
              <p className="text-xs font-semibold text-destructive">
                Já existe {tab === 'categorias' ? 'uma categoria' : 'uma tag'} com esse nome —
                escolha outro.
              </p>
            )}
          </div>

          {tab === 'categorias' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Categoria pai
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-tomate"
                >
                  <option value="">— raiz (nível 1) —</option>
                  {categories
                    .filter((c) => !editingId || c.id !== editingId)
                    .filter((c) => c.depth < 3)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {'↳'.repeat(c.depth - 1)} {c.name} (nível {c.depth})
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Ordem
                </label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Dimensão
              </label>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value as Tag['dimension'])}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-tomate"
              >
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {DIMENSION_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={blocked || saving}
              className="rounded-xl bg-tomate hover:bg-tomate/90 text-creme font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Criar'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Listagem */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : tab === 'categorias' ? (
        <Card className="p-4 rounded-2xl border-border shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Árvore de categorias (máx. 3 níveis)
          </h2>
          {roots.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-4">
              Nenhuma categoria ainda — crie a primeira acima.
            </p>
          ) : (
            roots.map((c) => renderCategoryRow(c, 0))
          )}
        </Card>
      ) : (
        <Card className="p-4 rounded-2xl border-border shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Todas as tags
          </h2>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-4">
              Nenhuma tag ainda — crie a primeira acima.
            </p>
          ) : (
            <div className="space-y-1">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-muted/50"
                >
                  <Badge className="bg-[#C9F24D] text-[#12100E] border-none text-xs font-semibold">
                    {DIMENSION_LABELS[t.dimension] || t.dimension}
                  </Badge>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">
                    {t.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    #{t.slug}
                  </span>
                  <button
                    onClick={() => startEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-tomate"
                    aria-label={`Editar ${t.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'tags', id: t.id, name: t.name })}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label={`Remover ${t.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Confirmação de remoção */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Remover {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription className="text-sm">
              {tab === 'categorias'
                ? 'Receitas desta categoria ficarão sem categoria. '
                : 'Receitas com esta tag perderão a marcação. '}
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
