// Migration 0007:
// Correção de texto da receita Panzanella (id 1w9usrn3vhla32c):
//  - descrição: "a ideia e ser uma prato" -> "A ideia é ser um prato"
//  - etapa 1: "utilize tbem" -> "utilize também" (português correto)
// Idempotente: cada correção só é aplicada se o texto original ainda existir.
// IMPORTANTE (JSVM do PocketBase): todo o código fica inline dentro dos
// callbacks — funções de topo dão ReferenceError no pool de execução.

migrate(
  (app) => {
    // --- descrição da receita ---
    try {
      const recipe = app.findFirstRecordByData('recipes', 'id', '1w9usrn3vhla32c')
      const desc = recipe.getString('description') || ''
      if (desc.indexOf('a ideia e ser uma prato') !== -1) {
        recipe.set('description', desc.replace('a ideia e ser uma prato', 'A ideia é ser um prato'))
        // app.save() não passa pelos hooks de request: recalcula o search_text
        // aqui mesmo (title + description + story, normalizado, igual ao hook).
        const fullText =
          recipe.getString('title') +
          ' ' +
          recipe.getString('description') +
          ' ' +
          recipe.getString('story')
        const normalized = fullText
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        recipe.set('search_text', normalized)
        app.save(recipe)
      }
    } catch (_) {
      // receita não existe nesta cópia do banco — nada a fazer
    }

    // --- etapas (instrução) ---
    let steps
    try {
      steps = app.findRecordsByFilter(
        'recipe_steps',
        "recipe = '1w9usrn3vhla32c' && instruction ~ 'utilize tbem'",
        '',
        0,
        0,
      )
    } catch (_) {
      steps = null
    }
    if (steps) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const text = step.getString('instruction') || ''
        if (text.indexOf('utilize tbem') === -1) continue
        step.set('instruction', text.replace('utilize tbem', 'utilize também'))
        app.save(step)
      }
    }
  },
  (app) => {
    // down: volta os textos originais (para reprodutibilidade)
    try {
      const recipe = app.findFirstRecordByData('recipes', 'id', '1w9usrn3vhla32c')
      const desc = recipe.getString('description') || ''
      if (desc.indexOf('A ideia é ser um prato') !== -1) {
        recipe.set('description', desc.replace('A ideia é ser um prato', 'a ideia e ser uma prato'))
        app.save(recipe)
      }
    } catch (_) {}

    let steps
    try {
      steps = app.findRecordsByFilter(
        'recipe_steps',
        "recipe = '1w9usrn3vhla32c' && instruction ~ 'utilize também'",
        '',
        0,
        0,
      )
    } catch (_) {
      steps = null
    }
    if (steps) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const text = step.getString('instruction') || ''
        if (text.indexOf('utilize também') === -1) continue
        step.set('instruction', text.replace('utilize também', 'utilize tbem'))
        app.save(step)
      }
    }
  },
)
