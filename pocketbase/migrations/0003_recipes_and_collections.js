migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const categories = app.findCollectionByNameOrId('categories')
    const tags = app.findCollectionByNameOrId('tags')
    const ingredients = app.findCollectionByNameOrId('ingredients')

    // 1. recipes
    const recipes = new Collection({
      name: 'recipes',
      type: 'base',
      listRule: 'status = "published" && visibility = "public"',
      viewRule: '(status = "published" && visibility != "private") || author = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: 'author = @request.auth.id',
      deleteRule: null, // Nenhuma receita é deletada, apenas arquivada (status = "archived")
      fields: [
        {
          name: 'author',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'relation',
          collectionId: categories.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true, max: 120 },
        { name: 'slug', type: 'text', required: true, max: 140 },
        { name: 'description', type: 'text', max: 300 },
        { name: 'story', type: 'text', max: 4000 },
        {
          name: 'cover',
          type: 'file',
          maxSelect: 1,
          maxSize: 8388608, // 8MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['400x300', '1200x0'],
        },
        { name: 'yield_quantity', type: 'number' },
        {
          name: 'yield_unit',
          type: 'select',
          values: ['porcoes', 'unidades', 'g', 'ml'],
          maxSelect: 1,
        },
        { name: 'prep_minutes', type: 'number' },
        { name: 'cook_minutes', type: 'number' },
        { name: 'difficulty', type: 'number', min: 1, max: 5, onlyInt: true },
        {
          name: 'license',
          type: 'select',
          required: true,
          values: ['open', 'credit', 'ask', 'closed'],
          maxSelect: 1,
        },
        { name: 'variant_note', type: 'text', max: 500 },
        { name: 'variant_depth', type: 'number', onlyInt: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['draft', 'published', 'archived'],
          maxSelect: 1,
        },
        {
          name: 'visibility',
          type: 'select',
          required: true,
          values: ['public', 'unlisted', 'private'],
          maxSelect: 1,
        },
        { name: 'cooksnap_count', type: 'number', onlyInt: true },
        { name: 'variant_count', type: 'number', onlyInt: true },
        { name: 'save_count', type: 'number', onlyInt: true },
        { name: 'ingredient_count', type: 'number', onlyInt: true },
        { name: 'search_text', type: 'text' },
        { name: 'tag_index', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_recipes_author_slug ON recipes (author, slug)',
        'CREATE INDEX idx_recipes_search_text ON recipes (search_text)',
        'CREATE INDEX idx_recipes_status_visibility ON recipes (status, visibility)',
      ],
    })
    app.save(recipes)

    // Self-relations on recipes (parent_recipe and root_recipe)
    const recipeCol = app.findCollectionByNameOrId('recipes')
    recipeCol.fields.add(
      new RelationField({
        name: 'parent_recipe',
        collectionId: recipeCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    recipeCol.fields.add(
      new RelationField({
        name: 'root_recipe',
        collectionId: recipeCol.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(recipeCol)

    // Add root_recipe index
    recipeCol.addIndex('idx_recipes_root_recipe', false, 'root_recipe', '')
    app.save(recipeCol)

    // 2. recipe_ingredients
    const recipeIngredients = new Collection({
      name: 'recipe_ingredients',
      type: 'base',
      listRule: 'recipe.status = "published" && recipe.visibility != "private"',
      viewRule: 'recipe.status = "published" && recipe.visibility != "private"',
      createRule: '@request.auth.id != ""',
      updateRule: 'recipe.author = @request.auth.id',
      deleteRule: 'recipe.author = @request.auth.id',
      fields: [
        {
          name: 'recipe',
          type: 'relation',
          required: true,
          collectionId: recipeCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'position', type: 'number', onlyInt: true },
        {
          name: 'ingredient',
          type: 'relation',
          collectionId: ingredients.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'raw_text', type: 'text', required: true, max: 250 },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'text', max: 30 },
        { name: 'preparation', type: 'text', max: 150 },
        { name: 'is_optional', type: 'bool' },
        { name: 'group_label', type: 'text', max: 80 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe, position)',
      ],
    })
    app.save(recipeIngredients)

    // 3. recipe_steps
    const recipeSteps = new Collection({
      name: 'recipe_steps',
      type: 'base',
      listRule: 'recipe.status = "published" && recipe.visibility != "private"',
      viewRule: 'recipe.status = "published" && recipe.visibility != "private"',
      createRule: '@request.auth.id != ""',
      updateRule: 'recipe.author = @request.auth.id',
      deleteRule: 'recipe.author = @request.auth.id',
      fields: [
        {
          name: 'recipe',
          type: 'relation',
          required: true,
          collectionId: recipeCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'position', type: 'number', onlyInt: true },
        { name: 'instruction', type: 'text', required: true, max: 2000 },
        { name: 'duration_min', type: 'number' },
        { name: 'temperature_c', type: 'number' },
        { name: 'technique', type: 'text', max: 100 },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 8388608,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['400x300', '800x0'],
        },
        { name: 'group_label', type: 'text', max: 80 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_recipe_steps_recipe ON recipe_steps (recipe, position)'],
    })
    app.save(recipeSteps)

    // 4. recipe_tags
    const recipeTags = new Collection({
      name: 'recipe_tags',
      type: 'base',
      listRule: 'recipe.status = "published" && recipe.visibility != "private"',
      viewRule: 'recipe.status = "published" && recipe.visibility != "private"',
      createRule: '@request.auth.id != ""',
      updateRule: 'recipe.author = @request.auth.id',
      deleteRule: 'recipe.author = @request.auth.id',
      fields: [
        {
          name: 'recipe',
          type: 'relation',
          required: true,
          collectionId: recipeCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tag',
          type: 'relation',
          required: true,
          collectionId: tags.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_recipe_tags_unique ON recipe_tags (recipe, tag)'],
    })
    app.save(recipeTags)

    // 5. collections
    const collections = new Collection({
      name: 'collections',
      type: 'base',
      listRule: 'is_private = false || owner = @request.auth.id',
      viewRule: 'is_private = false || owner = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: 'owner = @request.auth.id',
      deleteRule: 'owner = @request.auth.id',
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 100 },
        { name: 'is_private', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_collections_owner ON collections (owner)'],
    })
    app.save(collections)

    // 6. saved_recipes
    const savedRecipes = new Collection({
      name: 'saved_recipes',
      type: 'base',
      listRule: 'owner = @request.auth.id',
      viewRule: 'owner = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: 'owner = @request.auth.id',
      deleteRule: 'owner = @request.auth.id',
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'recipe',
          type: 'relation',
          required: true,
          collectionId: recipeCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'collection',
          type: 'relation',
          collectionId: collections.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_saved_recipes_owner_recipe ON saved_recipes (owner, recipe)',
      ],
    })
    app.save(savedRecipes)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('saved_recipes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('collections'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('recipe_tags'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('recipe_steps'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('recipe_ingredients'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('recipes'))
    } catch (_) {}
  },
)
