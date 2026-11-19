// Migration 0005:
// (a) campo username no auth collection (único, 3–30, ^[a-z0-9_]{3,30}$)
// (b) backfill de username para todos os usuários existentes (derivado do display_name/name/email, com sufixo numérico em caso de colisão)
// (c) categorias/tags ficam restritas ao admin (criação/edição/exclusão só role = "admin")

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // ---- (a) campo username (sem índice único ainda) ----
    if (!users.fields.getByName('username')) {
      users.fields.add(
        new TextField({
          name: 'username',
          required: true,
          min: 3,
          max: 30,
          pattern: '^[a-z0-9_]{3,30}$',
          presentable: true,
        }),
      )
      app.save(users)
    }

    // ---- (b) backfill ----
    const taken = {}
    const allUsers = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', '-created', 500, 0)
    for (let i = 0; i < allUsers.length; i++) {
      taken[allUsers[i].getString('username')] = true
    }

    function normalizeUsername(text) {
      if (!text) return ''
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_')
        .slice(0, 30)
        .replace(/^_+|_+$/g, '')
    }

    function uniqueUsername(base) {
      if (base.length < 3) base = (base + '_user').slice(0, 30)
      while (base.length > 30) base = base.slice(0, 30)
      if (!taken[base]) {
        taken[base] = true
        return base
      }
      let n = 2
      while (true) {
        const suffix = '_' + n
        const candidate = base.slice(0, 30 - suffix.length) + suffix
        if (!taken[candidate]) {
          taken[candidate] = true
          return candidate
        }
        n++
      }
    }

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i]
      const current = u.getString('username')
      if (current && current.length >= 3) continue

      let base =
        normalizeUsername(u.getString('display_name')) ||
        normalizeUsername(u.getString('name')) ||
        normalizeUsername(u.email().split('@')[0]) ||
        'cozinheiro'
      u.set('username', uniqueUsername(base))
      app.save(u)
    }

    // ---- (a2) só AGORA o índice único, com usernames já preenchidos ----
    users.addIndex('idx_users_username', true, 'username', '')
    app.save(users)

    // ---- (c) categorias e tags: escrita só para admin ----
    const adminRule = '@request.auth.role = "admin"'

    const taxonomies = ['categories', 'tags']
    for (let t = 0; t < taxonomies.length; t++) {
      const col = app.findCollectionByNameOrId(taxonomies[t])
      col.createRule = adminRule
      col.updateRule = adminRule
      col.deleteRule = adminRule
      app.save(col)
    }

    // ingredients também é taxonomia de suporte: manter leitura pública, escrita admin
    const ing = app.findCollectionByNameOrId('ingredients')
    ing.createRule = adminRule
    ing.updateRule = adminRule
    ing.deleteRule = adminRule
    app.save(ing)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      users.fields.removeByName('username')
      app.save(users)
    } catch (_) {}
  },
)
