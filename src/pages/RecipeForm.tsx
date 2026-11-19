import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { recipeService, taxonomyService } from '@/services/recipeService'
import { authService } from '@/services/authService'
import {
  Category,
  Tag,
  Ingredient,
  RecipeLicense,
  RecipeStatus,
  RecipeVisibility,
} from '@/types/recipe'
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  ChefHat,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface IngredientRow {
  raw_text: string
  quantity?: number
  unit?: string
  preparation?: string
  is_optional?: boolean
}

interface StepRow {
  instruction: string
  duration_min?: number
  temperature_c?: number
  technique?: string
}

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const currentUser = authService.getCurrentUser()

  // Basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [story, setStory] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [yieldQuantity, setYieldQuantity] = useState<number | ''>(4)
  const [yieldUnit, setYieldUnit] = useState<'porcoes' | 'unidades' | 'g' | 'ml'>('porcoes')
  const [prepMinutes, setPrepMinutes] = useState<number | ''>(20)
  const [cookMinutes, setCookMinutes] = useState<number | ''>(30)
  const [difficulty, setDifficulty] = useState<number>(2)
  const [license, setLicense] = useState<RecipeLicense>('open')
  const [status, setStatus] = useState<RecipeStatus>('published')
  const [visibility, setVisibility] = useState<RecipeVisibility>('public')

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')

  // Structured Ingredients
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { raw_text: '', quantity: undefined, unit: 'g', preparation: '', is_optional: false },
  ])

  // Steps
  const [steps, setSteps] = useState<StepRow[]>([
    { instruction: '', duration_min: undefined, temperature_c: undefined, technique: '' },
  ])

  // Tags
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Taxonomy options
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)

  // Check auth
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      toast({
        title: 'Acesso Restrito',
        description: 'Faça login para cadastrar suas receitas.',
      })
      navigate('/login')
    }
  }, [navigate, toast])

  // Load categories and tags
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, tgs] = await Promise.all([
          taxonomyService.getCategories(),
          taxonomyService.getTags(),
        ])
        setCategories(cats)
        setAvailableTags(tgs)
      } catch (err) {
        console.error('Failed to load taxonomies:', err)
      }
    }
    loadData()
  }, [])

  // Handle image upload
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 8MB.',
          variant: 'destructive',
        })
        return
      }
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Ingredients Helpers
  const addIngredientRow = () => {
    setIngredients([...ingredients, { raw_text: '', unit: 'g', is_optional: false }])
  }

  const updateIngredientRow = (index: number, field: keyof IngredientRow, value: any) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const removeIngredientRow = (index: number) => {
    if (ingredients.length <= 1) return
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  // Steps Helpers
  const addStepRow = () => {
    setSteps([...steps, { instruction: '', duration_min: undefined }])
  }

  const updateStepRow = (index: number, field: keyof StepRow, value: any) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const removeStepRow = (index: number) => {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, i) => i !== index))
  }

  // Tag selection toggle
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Dê um nome para a sua receita.',
        variant: 'destructive',
      })
      return
    }

    // Validate ingredients
    const validIngredients = ingredients.filter((i) => i.raw_text.trim().length > 0)
    if (validIngredients.length === 0) {
      toast({
        title: 'Adicione pelo menos um ingrediente',
        description: 'Descreva os ingredientes necessários.',
        variant: 'destructive',
      })
      return
    }

    // Validate steps
    const validSteps = steps.filter((s) => s.instruction.trim().length > 0)
    if (validSteps.length === 0) {
      toast({
        title: 'Adicione pelo menos uma etapa',
        description: 'Descreva o modo de preparo.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const created = await recipeService.createRecipe({
        title: title.trim(),
        description: description.trim() || undefined,
        story: story.trim() || undefined,
        category: categoryId || undefined,
        cover: coverFile || undefined,
        yield_quantity: typeof yieldQuantity === 'number' ? yieldQuantity : undefined,
        yield_unit: yieldUnit,
        prep_minutes: typeof prepMinutes === 'number' ? prepMinutes : undefined,
        cook_minutes: typeof cookMinutes === 'number' ? cookMinutes : undefined,
        difficulty,
        license,
        status,
        visibility,
        ingredients: validIngredients,
        steps: validSteps,
        tagIds: selectedTagIds,
      })

      toast({
        title: 'No ar. Copie o link e mande pra alguém.',
        description: 'Sua receita foi salva no acervo.',
      })

      const authorUsername = currentUser?.username || 'autor'
      navigate(`/r/${authorUsername}/${created.slug}`)
    } catch (err: any) {
      console.error('Error creating recipe:', err)
      toast({
        title: 'Erro ao criar receita',
        description: err.message || 'Verifique os campos e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/minha-cozinha"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Minha Cozinha
        </Link>
        <h1 className="font-serif-recipe text-3xl sm:text-4xl font-extrabold text-foreground mt-2">
          {isEditing ? 'Editar Receita' : 'Cadastrar Nova Receita'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha os detalhes da sua receita. Ingredientes estruturados e licença autoral garantem
          integridade técnica do acervo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card 1: Informações Gerais */}
        <Card className="p-6 rounded-2xl border-border space-y-6">
          <h2 className="font-serif-recipe font-bold text-xl text-foreground flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            1. Informações Básicas
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Título da Receita <span className="text-destructive">*</span>
            </label>
            <Input
              required
              placeholder="Ex: Pão de Fermentação Natural de Azeitonas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl text-base"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Breve Descrição
            </label>
            <Textarea
              placeholder="Um resumo apetitoso do prato, textura e sabor (até 300 caracteres)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none h-20"
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              História ou Dica do Autor
            </label>
            <Textarea
              placeholder="Conte de onde veio essa receita, segredos de família ou memórias afetivas..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="rounded-xl resize-none h-28"
              maxLength={4000}
            />
          </div>

          {/* Cover Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Foto de capa (JPG ou PNG, até 8MB)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary bg-muted/40 text-foreground text-sm font-medium transition-colors">
                <Upload className="w-4 h-4 text-primary" />
                <span>Escolher Imagem</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
              {coverPreview && (
                <div className="relative w-24 h-16 rounded-xl overflow-hidden border shadow-sm">
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Category & Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.depth > 1 ? `— ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Preparo (min)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="20"
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value ? Number(e.target.value) : '')}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Cozimento (min)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="30"
                value={cookMinutes}
                onChange={(e) => setCookMinutes(e.target.value ? Number(e.target.value) : '')}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Rendimento
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="rounded-xl w-24"
                />
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value as any)}
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm"
                >
                  <option value="porcoes">porções</option>
                  <option value="unidades">unidades</option>
                  <option value="g">gramas (g)</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nível de Dificuldade
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
              >
                <option value={1}>1 - Muito Fácil (Iniciante)</option>
                <option value={2}>2 - Fácil</option>
                <option value={3}>3 - Médio</option>
                <option value={4}>4 - Difícil</option>
                <option value={5}>5 - Chef / Profissional</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Licença Autoral
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value as RecipeLicense)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
              >
                <option value="open">Aberta (Variantes Livres)</option>
                <option value="credit">Com Créditos (Citar Autor)</option>
                <option value="ask">Sob Consulta (Exige Autorização)</option>
                <option value="closed">Fechada (Sem Variantes)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Card 2: Ingredientes Estruturados */}
        <Card className="p-6 rounded-2xl border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-recipe font-bold text-xl text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              2. Ingredientes Estruturados
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredientRow}
              className="rounded-full gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Linha
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            O campo texto guarda a escrita do autor (ex: "500g de polvilho doce escaldado"). Você
            também pode especificar a quantidade e unidade para facilitar cálculos futuros.
          </p>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="p-3 bg-muted/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                  <Input
                    required
                    placeholder="Ex: 500g de polvilho doce"
                    value={ing.raw_text}
                    onChange={(e) => updateIngredientRow(idx, 'raw_text', e.target.value)}
                    className="flex-1 rounded-xl bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(idx)}
                    disabled={ingredients.length <= 1}
                    className="text-muted-foreground hover:text-destructive p-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-7 text-xs">
                  <Input
                    type="number"
                    placeholder="Qtd (opcional)"
                    value={ing.quantity || ''}
                    onChange={(e) =>
                      updateIngredientRow(
                        idx,
                        'quantity',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-28 h-8 rounded-lg bg-background text-xs"
                  />
                  <Input
                    placeholder="Unidade (g, ml, xícara)"
                    value={ing.unit || ''}
                    onChange={(e) => updateIngredientRow(idx, 'unit', e.target.value)}
                    className="w-36 h-8 rounded-lg bg-background text-xs"
                  />
                  <Input
                    placeholder="Preparo (ralado, picado, morno...)"
                    value={ing.preparation || ''}
                    onChange={(e) => updateIngredientRow(idx, 'preparation', e.target.value)}
                    className="flex-1 h-8 rounded-lg bg-background text-xs min-w-[140px]"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={!!ing.is_optional}
                      onChange={(e) => updateIngredientRow(idx, 'is_optional', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-muted-foreground">Opcional</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 3: Modo de Preparo */}
        <Card className="p-6 rounded-2xl border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-recipe font-bold text-xl text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              3. Modo de Preparo (Etapas)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStepRow}
              className="rounded-full gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Etapa
            </Button>
          </div>

          <div className="space-y-4">
            {steps.map((st, idx) => (
              <div key={idx} className="p-3 bg-muted/40 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                    {idx + 1}
                  </div>
                  <Textarea
                    required
                    placeholder={`Descreva a etapa ${idx + 1}...`}
                    value={st.instruction}
                    onChange={(e) => updateStepRow(idx, 'instruction', e.target.value)}
                    className="flex-1 rounded-xl bg-background resize-none h-20 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeStepRow(idx)}
                    disabled={steps.length <= 1}
                    className="text-muted-foreground hover:text-destructive p-2 rounded-lg mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-8 text-xs">
                  <Input
                    type="number"
                    placeholder="Duração (min)"
                    value={st.duration_min || ''}
                    onChange={(e) =>
                      updateStepRow(
                        idx,
                        'duration_min',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-28 h-8 rounded-lg bg-background text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Temp (°C)"
                    value={st.temperature_c || ''}
                    onChange={(e) =>
                      updateStepRow(
                        idx,
                        'temperature_c',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="w-28 h-8 rounded-lg bg-background text-xs"
                  />
                  <Input
                    placeholder="Técnica (ex: Banho-maria, Autólise, Brasear)"
                    value={st.technique || ''}
                    onChange={(e) => updateStepRow(idx, 'technique', e.target.value)}
                    className="flex-1 h-8 rounded-lg bg-background text-xs min-w-[150px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 4: Tags e Visibilidade */}
        <Card className="p-6 rounded-2xl border-border space-y-4">
          <h2 className="font-serif-recipe font-bold text-xl text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            4. Tags & Publicação
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Tags com Dimensão
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-[#C9F24D] text-[#12100E] border-[#C9F24D] font-semibold'
                        : 'bg-background hover:bg-muted border-border text-foreground'
                    }`}
                  >
                    #{tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Status da Receita
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RecipeStatus)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
              >
                <option value="published">Publicada</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Visibilidade
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as RecipeVisibility)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
              >
                <option value="public">Pública (Listagem e busca abertas)</option>
                <option value="unlisted">Não listada (Acessível só pelo link direto)</option>
                <option value="private">Privada (Visível apenas para mim)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/minha-cozinha')}
            className="rounded-xl px-6"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            {submitting ? 'Salvando Receita...' : 'Salvar Receita'}
          </Button>
        </div>
      </form>
    </div>
  )
}
