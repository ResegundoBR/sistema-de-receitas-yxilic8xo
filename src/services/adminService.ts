import pb from '@/lib/pocketbase/client'
import { Category, Tag } from '@/types/recipe'
import { normalizeSearchText, slugify } from '@/lib/normalize'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export const adminService = {
  isAdmin(): boolean {
    return pb.authStore.record?.role === 'admin'
  },

  // ---------- Categorias ----------
  async listCategories(): Promise<Category[]> {
    return await pb.collection('categories').getFullList<Category>({
      sort: 'depth,sort_order,name',
    })
  },

  async createCategory(data: {
    name: string
    parent?: string
    sort_order?: number
  }): Promise<Category> {
    const slug = slugify(data.name)
    const depth = data.parent
      ? (await pb.collection('categories').getOne<Category>(data.parent)).depth + 1
      : 1
    if (depth > 3) {
      throw new Error('Profundidade máxima de 3 níveis atingida.')
    }
    return await pb.collection('categories').create<Category>({
      name: data.name.trim(),
      slug,
      depth,
      parent: data.parent || null,
      sort_order: data.sort_order || 0,
    })
  },

  async updateCategory(
    id: string,
    data: { name?: string; parent?: string; sort_order?: number },
  ): Promise<Category> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) {
      payload.name = data.name.trim()
      payload.slug = slugify(data.name)
    }
    if (data.parent !== undefined) {
      payload.parent = data.parent || null
      payload.depth = data.parent
        ? (await pb.collection('categories').getOne<Category>(data.parent)).depth + 1
        : 1
      if ((payload.depth as number) > 3) {
        throw new Error('Profundidade máxima de 3 níveis atingida.')
      }
    }
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order
    return await pb.collection('categories').update<Category>(id, payload)
  },

  async deleteCategory(id: string): Promise<void> {
    await pb.collection('categories').delete(id)
  },

  // ---------- Tags ----------
  async listTags(): Promise<Tag[]> {
    return await pb.collection('tags').getFullList<Tag>({
      sort: 'dimension,name',
    })
  },

  async createTag(name: string, dimension: Tag['dimension']): Promise<Tag> {
    return await pb.collection('tags').create<Tag>({
      name: name.trim(),
      slug: slugify(name),
      dimension,
    })
  },

  async updateTag(id: string, data: { name?: string; dimension?: Tag['dimension'] }): Promise<Tag> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) {
      payload.name = data.name.trim()
      payload.slug = slugify(data.name)
    }
    if (data.dimension !== undefined) payload.dimension = data.dimension
    return await pb.collection('tags').update<Tag>(id, payload)
  },

  async deleteTag(id: string): Promise<void> {
    await pb.collection('tags').delete(id)
  },

  // ---------- Sugestões de nomes parecidos (normalização do sistema) ----------
  // Compara pelo texto normalizado: minúsculo, sem acento, sem pontuação.
  similarNames<T extends { name: string; slug: string }>(
    name: string,
    existing: T[],
    excludeId?: string,
  ): T[] {
    const target = normalizeSearchText(name)
    if (!target || target.length < 2) return []
    return existing
      .filter((item) => {
        if (excludeId && (item as unknown as { id: string }).id === excludeId) return false
        const candidate = normalizeSearchText(item.name)
        if (!candidate) return false
        if (candidate === target) return true
        // contém o que foi digitado (ou vice-versa) com no mínimo 3 letras
        if (target.length >= 3 && (candidate.includes(target) || target.includes(candidate))) {
          return true
        }
        return false
      })
      .slice(0, 5)
  },

  friendlyError(err: unknown): string {
    const message = getErrorMessage(err)
    if (/slug/i.test(message) && /unique|duplicat|já existe/i.test(message)) {
      return 'Já existe um item com esse slug. Escolha outro nome.'
    }
    if (/Values must be unique/i.test(message)) {
      return 'Já existe um item com esse nome/slug. Escolha outro.'
    }
    if (/slug/i.test(message)) return 'Slug inválido ou já usado por outro item.'
    return message
  },
}
