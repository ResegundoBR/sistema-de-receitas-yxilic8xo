// Migration 0008:
// Recalcula o search_text da Panzanella (id 1w9usrn3vhla32c) — a migration
// 0007 corrigiu a descrição via app.save(), que não passa pelos hooks de
// request, então o índice de busca ficou com o texto antigo.
// Idempotente: só regrava se o texto antigo ainda estiver indexado.
// IMPORTANTE (JSVM do PocketBase): código inline nos callbacks — funções de
// topo dão ReferenceError no pool de execução.

migrate(
  (app) => {
    let recipe
    try {
      recipe = app.findFirstRecordByData('recipes', 'id', '1w9usrn3vhla32c')
    } catch (_) {
      return // receita não existe nesta cópia do banco
    }

    const title = recipe.getString('title') || ''
    const description = recipe.getString('description') || ''
    const story = recipe.getString('story') || ''
    const fullText = title + ' ' + description + ' ' + story
    const normalized = fullText
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const current = recipe.getString('search_text') || ''
    if (current === normalized) return // já está correto — no-op

    recipe.set('search_text', normalized)
    app.save(recipe)
  },
  (app) => {
    // down: nada a desfazer — o search_text volta a ser regenerado pelos hooks
    // na próxima edição da receita.
  },
)
