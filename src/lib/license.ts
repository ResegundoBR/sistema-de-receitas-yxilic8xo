/* Rodela — labels e cores da licença autoral, centralizados */
import type { RecipeLicense } from '@/types/recipe'

/**
 * Mapa único de licenças: valor do banco → rótulo curto em português.
 * Usado pelo badge dos cards, pela página da receita e pelo formulário.
 */
export const LICENSE_LABELS: Record<RecipeLicense, string> = {
  open: 'Aberta',
  credit: 'Com crédito',
  ask: 'Sob consulta',
  closed: 'Fechada',
}

export function getLicenseLabel(license: string): string {
  return LICENSE_LABELS[license as RecipeLicense] || LICENSE_LABELS.open
}

/** Descrição completa mostrada na página da receita. */
export const LICENSE_DESCRIPTIONS: Record<RecipeLicense, string> = {
  open: 'Qualquer pessoa pode se inspirar e criar novas variantes livres desta receita.',
  credit: 'Permite criação de variantes desde que o autor original seja citado.',
  ask: 'Criação de variantes requer consulta ao autor original.',
  closed: 'Receita autoral protegida: não permite variantes derivadas.',
}

export function getLicenseDescription(license: string): string {
  return LICENSE_DESCRIPTIONS[license as RecipeLicense] || LICENSE_DESCRIPTIONS.open
}
