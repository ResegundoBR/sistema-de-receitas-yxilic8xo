migrate(
  (app) => {
    // 1. categories
    const categories = new Collection({
      name: 'categories',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true, max: 80 },
        { name: 'slug', type: 'text', required: true, max: 80 },
        { name: 'depth', type: 'number', min: 1, max: 3, onlyInt: true },
        { name: 'sort_order', type: 'number', onlyInt: true },
        { name: 'icon', type: 'text', max: 50 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)'],
    })
    app.save(categories)

    // Self-relation on categories (parent)
    const catCol = app.findCollectionByNameOrId('categories')
    catCol.fields.add(
      new RelationField({
        name: 'parent',
        collectionId: catCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(catCol)

    // 2. tags
    // dimension select: ingrediente / tecnica / dieta / ocasiao / regiao / equipamento / estacao / custo
    const tags = new Collection({
      name: 'tags',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true, max: 80 },
        { name: 'slug', type: 'text', required: true, max: 80 },
        {
          name: 'dimension',
          type: 'select',
          required: true,
          values: [
            'ingrediente',
            'tecnica',
            'dieta',
            'ocasiao',
            'regiao',
            'equipamento',
            'estacao',
            'custo',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_tags_slug ON tags (slug)',
        'CREATE INDEX idx_tags_dimension ON tags (dimension)',
      ],
    })
    app.save(tags)

    // 3. ingredients
    // category (laticinios, carnes, hortifruti, secos…), default_unit, density_g_ml
    const ingredients = new Collection({
      name: 'ingredients',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'slug', type: 'text', required: true, max: 120 },
        { name: 'category', type: 'text', max: 60 },
        { name: 'default_unit', type: 'text', max: 30 },
        { name: 'density_g_ml', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_ingredients_slug ON ingredients (slug)'],
    })
    app.save(ingredients)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('ingredients'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('tags'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('categories'))
    } catch (_) {}
  },
)
