migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const categories = app.findCollectionByNameOrId('categories')
    const tags = app.findCollectionByNameOrId('tags')
    const ingredients = app.findCollectionByNameOrId('ingredients')
    const recipes = app.findCollectionByNameOrId('recipes')
    const recipeIngredients = app.findCollectionByNameOrId('recipe_ingredients')
    const recipeSteps = app.findCollectionByNameOrId('recipe_steps')
    const recipeTags = app.findCollectionByNameOrId('recipe_tags')
    const collections = app.findCollectionByNameOrId('collections')
    const savedRecipes = app.findCollectionByNameOrId('saved_recipes')

    // 1. Seed demo user (chef_ana)
    let userRecord
    try {
      userRecord = app.findFirstRecordByData('_pb_users_auth_', 'username', 'chef_ana')
    } catch (_) {
      userRecord = new Record(users)
      userRecord.setEmail('ana@receitas.local')
      userRecord.setPassword('Skip@Pass123')
      userRecord.setVerified(true)
      userRecord.set('username', 'chef_ana')
      userRecord.set('display_name', 'Ana Luísa Cozinha')
      userRecord.set(
        'bio',
        'Apaixonada por pães artesanais, confeitaria afetiva e comida brasileira de raiz.',
      )
      userRecord.set('city', 'Belo Horizonte')
      userRecord.set('state', 'MG')
      userRecord.set('role', 'creator')
      app.save(userRecord)
    }

    // Also seed default user reginaldo if not existing
    let reginaldoUser
    try {
      reginaldoUser = app.findFirstRecordByData(
        '_pb_users_auth_',
        'email',
        'reginaldo.segundo@planagroup.com.br',
      )
    } catch (_) {
      reginaldoUser = new Record(users)
      reginaldoUser.setEmail('reginaldo.segundo@planagroup.com.br')
      reginaldoUser.setPassword('Skip@Pass')
      reginaldoUser.setVerified(true)
      reginaldoUser.set('username', 'reginaldo')
      reginaldoUser.set('display_name', 'Reginaldo Segundo')
      reginaldoUser.set('bio', 'Explorando receitas práticas e doces caseiros.')
      reginaldoUser.set('city', 'São Paulo')
      reginaldoUser.set('state', 'SP')
      reginaldoUser.set('role', 'user')
      app.save(reginaldoUser)
    }

    // 2. Seed shallow categories (depth 1, depth 2)
    const catData = [
      { name: 'Pães & Massas', slug: 'paes-e-massas', depth: 1, sort_order: 1, icon: 'croissant' },
      {
        name: 'Pratos Principais',
        slug: 'pratos-principais',
        depth: 1,
        sort_order: 2,
        icon: 'utensils',
      },
      {
        name: 'Sobremesas & Doces',
        slug: 'sobremesas-e-doces',
        depth: 1,
        sort_order: 3,
        icon: 'cake',
      },
      {
        name: 'Lanches & Salgados',
        slug: 'lanches-e-salgados',
        depth: 1,
        sort_order: 4,
        icon: 'sandwich',
      },
      { name: 'Bebidas & Cafés', slug: 'bebidas-e-cafes', depth: 1, sort_order: 5, icon: 'coffee' },
    ]

    const catMap = {}
    for (const c of catData) {
      let rec
      try {
        rec = app.findFirstRecordByData('categories', 'slug', c.slug)
      } catch (_) {
        rec = new Record(categories)
        rec.set('name', c.name)
        rec.set('slug', c.slug)
        rec.set('depth', c.depth)
        rec.set('sort_order', c.sort_order)
        rec.set('icon', c.icon)
        app.save(rec)
      }
      catMap[c.slug] = rec.id
    }

    // Subcategories (depth 2)
    const subCats = [
      {
        name: 'Pães Artesanais',
        slug: 'paes-artesanais',
        depth: 2,
        sort_order: 1,
        parent: catMap['paes-e-massas'],
      },
      {
        name: 'Bolos Caseiros',
        slug: 'bolos-caseiros',
        depth: 2,
        sort_order: 1,
        parent: catMap['sobremesas-e-doces'],
      },
      {
        name: 'Carnes & Aves',
        slug: 'carnes-e-aves',
        depth: 2,
        sort_order: 1,
        parent: catMap['pratos-principais'],
      },
    ]

    for (const sc of subCats) {
      try {
        const rec = app.findFirstRecordByData('categories', 'slug', sc.slug)
        catMap[sc.slug] = rec.id
      } catch (_) {
        const rec = new Record(categories)
        rec.set('name', sc.name)
        rec.set('slug', sc.slug)
        rec.set('depth', sc.depth)
        rec.set('sort_order', sc.sort_order)
        rec.set('parent', sc.parent)
        app.save(rec)
        catMap[sc.slug] = rec.id
      }
    }

    // 3. Seed tags with dimension
    // dimension: ingrediente, tecnica, dieta, ocasiao, regiao, equipamento, estacao, custo
    const tagList = [
      { name: 'Fermentação Natural', slug: 'fermentacao-natural', dimension: 'tecnica' },
      { name: 'Rápido & Fácil', slug: 'rapido-e-facil', dimension: 'ocasiao' },
      { name: 'Vegetariano', slug: 'vegetariano', dimension: 'dieta' },
      { name: 'Sem Glúten', slug: 'sem-gluten', dimension: 'dieta' },
      { name: 'Mineira', slug: 'mineira', dimension: 'regiao' },
      { name: 'Italiana', slug: 'italiana', dimension: 'regiao' },
      { name: 'Forno a Lenha', slug: 'forno-a-lenha', dimension: 'equipamento' },
      { name: 'Airfryer', slug: 'airfryer', dimension: 'equipamento' },
      { name: 'Econômico', slug: 'economico', dimension: 'custo' },
      { name: 'Chocolate', slug: 'chocolate', dimension: 'ingrediente' },
      { name: 'Café da Manhã', slug: 'cafe-da-manha', dimension: 'ocasiao' },
    ]

    const tagMap = {}
    for (const t of tagList) {
      let rec
      try {
        rec = app.findFirstRecordByData('tags', 'slug', t.slug)
      } catch (_) {
        rec = new Record(tags)
        rec.set('name', t.name)
        rec.set('slug', t.slug)
        rec.set('dimension', t.dimension)
        app.save(rec)
      }
      tagMap[t.slug] = rec.id
    }

    // 4. Seed ingredients
    const ingList = [
      {
        name: 'Farinha de Trigo',
        slug: 'farinha-de-trigo',
        category: 'secos',
        default_unit: 'g',
        density_g_ml: 0.6,
      },
      {
        name: 'Água Filtrada',
        slug: 'agua-filtrada',
        category: 'liquidos',
        default_unit: 'ml',
        density_g_ml: 1.0,
      },
      {
        name: 'Sal Refinado',
        slug: 'sal-refinado',
        category: 'temperos',
        default_unit: 'g',
        density_g_ml: 1.2,
      },
      {
        name: 'Fermento Biológico Seco',
        slug: 'fermento-biologico-seco',
        category: 'secos',
        default_unit: 'g',
        density_g_ml: 0.7,
      },
      {
        name: 'Polvilho Doce',
        slug: 'polvilho-doce',
        category: 'secos',
        default_unit: 'g',
        density_g_ml: 0.65,
      },
      {
        name: 'Queijo Canastra Meia Cura',
        slug: 'queijo-canastra-meia-cura',
        category: 'laticinios',
        default_unit: 'g',
        density_g_ml: 0.9,
      },
      {
        name: 'Ovo de Galinha',
        slug: 'ovo-de-galinha',
        category: 'frescos',
        default_unit: 'unidades',
        density_g_ml: 1.0,
      },
      {
        name: 'Leite Integral',
        slug: 'leite-integral',
        category: 'laticinios',
        default_unit: 'ml',
        density_g_ml: 1.03,
      },
      {
        name: 'Óleo Vegetal',
        slug: 'oleo-vegetal',
        category: 'oleos',
        default_unit: 'ml',
        density_g_ml: 0.92,
      },
      {
        name: 'Cacau em Pó 100%',
        slug: 'cacau-em-po-100',
        category: 'secos',
        default_unit: 'g',
        density_g_ml: 0.5,
      },
      {
        name: 'Açúcar Cristal',
        slug: 'acucar-cristal',
        category: 'secos',
        default_unit: 'g',
        density_g_ml: 0.85,
      },
      {
        name: 'Manteiga Sem Sal',
        slug: 'manteiga-sem-sal',
        category: 'laticinios',
        default_unit: 'g',
        density_g_ml: 0.95,
      },
    ]

    const ingMap = {}
    for (const i of ingList) {
      let rec
      try {
        rec = app.findFirstRecordByData('ingredients', 'slug', i.slug)
      } catch (_) {
        rec = new Record(ingredients)
        rec.set('name', i.name)
        rec.set('slug', i.slug)
        rec.set('category', i.category)
        rec.set('default_unit', i.default_unit)
        rec.set('density_g_ml', i.density_g_ml)
        app.save(rec)
      }
      ingMap[i.slug] = rec.id
    }

    // 5. Helper function to normalize text (minúsculo, sem acento, sem pontuação)
    function normalizeText(text) {
      if (!text) return ''
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // 6. Seed demo published recipes
    // Recipe 1: Pão de Queijo Tradicional Mineiro
    let r1
    try {
      r1 = app.findFirstRecordByFilter(
        'recipes',
        'author = "' + userRecord.id + '" && slug = "pao-de-queijo-tradicional-mineiro"',
      )
    } catch (_) {
      r1 = new Record(recipes)
      r1.set('author', userRecord.id)
      r1.set('category', catMap['lanches-e-salgados'])
      r1.set('title', 'Pão de Queijo Tradicional Mineiro')
      r1.set('slug', 'pao-de-queijo-tradicional-mineiro')
      r1.set(
        'description',
        'A legítima receita de família mineira com queijo Canastra meia cura, crocante por fora e macio por dentro.',
      )
      r1.set(
        'story',
        'Aprendi com a minha avó no interior de Minas. O segredo é escaldar bem o polvilho e usar queijo curado de verdade, ralado no ralo grosso.',
      )
      r1.set('yield_quantity', 25)
      r1.set('yield_unit', 'unidades')
      r1.set('prep_minutes', 20)
      r1.set('cook_minutes', 30)
      r1.set('difficulty', 2)
      r1.set('license', 'open')
      r1.set('variant_depth', 0)
      r1.set('status', 'published')
      r1.set('visibility', 'public')
      r1.set('ingredient_count', 6)
      r1.set('variant_count', 0)
      r1.set('save_count', 0)
      r1.set('cooksnap_count', 0)
      r1.set(
        'search_text',
        normalizeText(
          'Pão de Queijo Tradicional Mineiro A legítima receita de família mineira com queijo Canastra Aprendi com a minha avó no interior de Minas',
        ),
      )
      r1.set('tag_index', '|mineira|cafe-da-manha|rapido-e-facil|')
      app.save(r1)

      // Recipe 1 ingredients
      const r1Ings = [
        { raw: '500g de polvilho doce', ing: ingMap['polvilho-doce'], qty: 500, unit: 'g', pos: 1 },
        {
          raw: '1 xícara (240ml) de leite integral',
          ing: ingMap['leite-integral'],
          qty: 240,
          unit: 'ml',
          pos: 2,
        },
        {
          raw: '1/2 xícara (120ml) de óleo vegetal',
          ing: ingMap['oleo-vegetal'],
          qty: 120,
          unit: 'ml',
          pos: 3,
        },
        {
          raw: '1 colher de chá de sal refinado',
          ing: ingMap['sal-refinado'],
          qty: 5,
          unit: 'g',
          pos: 4,
        },
        { raw: '2 ovos caipiras', ing: ingMap['ovo-de-galinha'], qty: 2, unit: 'unidades', pos: 5 },
        {
          raw: '300g de queijo Canastra meia cura ralado',
          ing: ingMap['queijo-canastra-meia-cura'],
          qty: 300,
          unit: 'g',
          pos: 6,
        },
      ]
      for (const ri of r1Ings) {
        const rec = new Record(recipeIngredients)
        rec.set('recipe', r1.id)
        rec.set('position', ri.pos)
        rec.set('ingredient', ri.ing)
        rec.set('raw_text', ri.raw)
        rec.set('quantity', ri.qty)
        rec.set('unit', ri.unit)
        app.save(rec)
      }

      // Recipe 1 steps
      const r1Steps = [
        { pos: 1, inst: 'Em uma panela, ferva o leite com o óleo e o sal.', dur: 5, temp: 100 },
        {
          pos: 2,
          inst: 'Coloque o polvilho em uma tigela grande e despeje a mistura fervente para escaldar. Misture bem com uma colher de pau e deixe amornar.',
          dur: 10,
        },
        {
          pos: 3,
          inst: 'Acrescente os ovos um a um, amassando com as mãos até incorporar.',
          dur: 5,
        },
        {
          pos: 4,
          inst: 'Junte o queijo Canastra ralado e sove até formar uma massa homogênea e levemente grudenta.',
          dur: 5,
        },
        {
          pos: 5,
          inst: 'Modele bolinhas com as mãos untadas em óleo e asse em forno pré-aquecido a 190°C por cerca de 25 a 30 minutos até dourarem.',
          dur: 30,
          temp: 190,
        },
      ]
      for (const st of r1Steps) {
        const rec = new Record(recipeSteps)
        rec.set('recipe', r1.id)
        rec.set('position', st.pos)
        rec.set('instruction', st.inst)
        rec.set('duration_min', st.dur)
        if (st.temp) rec.set('temperature_c', st.temp)
        app.save(rec)
      }

      // Recipe 1 tags
      const r1Tags = [tagMap['mineira'], tagMap['cafe-da-manha'], tagMap['rapido-e-facil']]
      for (const tid of r1Tags) {
        const rec = new Record(recipeTags)
        rec.set('recipe', r1.id)
        rec.set('tag', tid)
        app.save(rec)
      }
    }

    // Recipe 2: Pão Artesanal Rústico de Fermentação Longa
    let r2
    try {
      r2 = app.findFirstRecordByFilter(
        'recipes',
        'author = "' + userRecord.id + '" && slug = "pao-artesanal-rustico-fermentacao-longa"',
      )
    } catch (_) {
      r2 = new Record(recipes)
      r2.set('author', userRecord.id)
      r2.set('category', catMap['paes-artesanais'])
      r2.set('title', 'Pão Artesanal Rústico de Fermentação Longa')
      r2.set('slug', 'pao-artesanal-rustico-fermentacao-longa')
      r2.set(
        'description',
        'Pão caseiro com casca dourada crocante e miolo super aerado com hidratação a 75%.',
      )
      r2.set(
        'story',
        'Receita inspirada nas padarias campestres da Europa adaptada para farinhas brasileiras de alta qualidade.',
      )
      r2.set('yield_quantity', 1)
      r2.set('yield_unit', 'unidades')
      r2.set('prep_minutes', 40)
      r2.set('cook_minutes', 45)
      r2.set('difficulty', 3)
      r2.set('license', 'credit')
      r2.set('variant_depth', 0)
      r2.set('status', 'published')
      r2.set('visibility', 'public')
      r2.set('ingredient_count', 4)
      r2.set('variant_count', 0)
      r2.set('save_count', 0)
      r2.set('cooksnap_count', 0)
      r2.set(
        'search_text',
        normalizeText(
          'Pão Artesanal Rústico de Fermentação Longa Pão caseiro com casca dourada crocante miolo aerado hidratação farinha',
        ),
      )
      r2.set('tag_index', '|fermentacao-natural|vegetariano|economico|')
      app.save(r2)

      // Recipe 2 ingredients
      const r2Ings = [
        {
          raw: '500g de farinha de trigo de boa qualidade',
          ing: ingMap['farinha-de-trigo'],
          qty: 500,
          unit: 'g',
          pos: 1,
        },
        {
          raw: '375ml de água filtrada morna (75% hidratação)',
          ing: ingMap['agua-filtrada'],
          qty: 375,
          unit: 'ml',
          pos: 2,
        },
        {
          raw: '3g de fermento biológico seco',
          ing: ingMap['fermento-biologico-seco'],
          qty: 3,
          unit: 'g',
          pos: 3,
        },
        {
          raw: '10g de sal fino refinado',
          ing: ingMap['sal-refinado'],
          qty: 10,
          unit: 'g',
          pos: 4,
        },
      ]
      for (const ri of r2Ings) {
        const rec = new Record(recipeIngredients)
        rec.set('recipe', r2.id)
        rec.set('position', ri.pos)
        rec.set('ingredient', ri.ing)
        rec.set('raw_text', ri.raw)
        rec.set('quantity', ri.qty)
        rec.set('unit', ri.unit)
        app.save(rec)
      }

      // Recipe 2 steps
      const r2Steps = [
        {
          pos: 1,
          inst: 'Misture a água e a farinha em tigela até não sobrar farinha seca (autólise por 30 minutos).',
          dur: 30,
        },
        {
          pos: 2,
          inst: 'Incorpore o fermento e o sal, fazendo dobras circulares a cada 30 minutos por 2 horas.',
          dur: 120,
        },
        {
          pos: 3,
          inst: 'Modele a massa em formato redondo (boule) com tensão superficial e coloque em cesto enfarinhado.',
          dur: 10,
        },
        {
          pos: 4,
          inst: 'Asse em panela de ferro tampada a 240°C por 25 minutos; tire a tampa e deixe dourar por mais 20 minutos.',
          dur: 45,
          temp: 240,
        },
      ]
      for (const st of r2Steps) {
        const rec = new Record(recipeSteps)
        rec.set('recipe', r2.id)
        rec.set('position', st.pos)
        rec.set('instruction', st.inst)
        rec.set('duration_min', st.dur)
        if (st.temp) rec.set('temperature_c', st.temp)
        app.save(rec)
      }

      // Recipe 2 tags
      const r2Tags = [tagMap['fermentacao-natural'], tagMap['vegetariano'], tagMap['economico']]
      for (const tid of r2Tags) {
        const rec = new Record(recipeTags)
        rec.set('recipe', r2.id)
        rec.set('tag', tid)
        app.save(rec)
      }
    }

    // Recipe 3: Bolo Fofo de Cacau Intenso
    let r3
    try {
      r3 = app.findFirstRecordByFilter(
        'recipes',
        'author = "' + userRecord.id + '" && slug = "bolo-fofo-de-cacau-intenso"',
      )
    } catch (_) {
      r3 = new Record(recipes)
      r3.set('author', userRecord.id)
      r3.set('category', catMap['bolos-caseiros'])
      r3.set('title', 'Bolo Fofo de Cacau Intenso')
      r3.set('slug', 'bolo-fofo-de-cacau-intenso')
      r3.set(
        'description',
        'Bolo caseiro aromático com cacau 100%, massa úmida e fofinha perfeita para o lanche da tarde.',
      )
      r3.set('story', 'Um clássico do café da tarde que perfuma a casa toda enquanto assa.')
      r3.set('yield_quantity', 12)
      r3.set('yield_unit', 'porcoes')
      r3.set('prep_minutes', 15)
      r3.set('cook_minutes', 40)
      r3.set('difficulty', 1)
      r3.set('license', 'open')
      r3.set('variant_depth', 0)
      r3.set('status', 'published')
      r3.set('visibility', 'public')
      r3.set('ingredient_count', 5)
      r3.set('variant_count', 0)
      r3.set('save_count', 0)
      r3.set('cooksnap_count', 0)
      r3.set(
        'search_text',
        normalizeText(
          'Bolo Fofo de Cacau Intenso Bolo caseiro aromático cacau 100 chocolate massa úmida café da tarde lanche',
        ),
      )
      r3.set('tag_index', '|chocolate|rapido-e-facil|vegetariano|')
      app.save(r3)

      const r3Ings = [
        {
          raw: '2 xícaras de farinha de trigo',
          ing: ingMap['farinha-de-trigo'],
          qty: 240,
          unit: 'g',
          pos: 1,
        },
        {
          raw: '1 xícara de cacau em pó 100%',
          ing: ingMap['cacau-em-po-100'],
          qty: 90,
          unit: 'g',
          pos: 2,
        },
        {
          raw: '1 e 1/2 xícara de açúcar cristal',
          ing: ingMap['acucar-cristal'],
          qty: 270,
          unit: 'g',
          pos: 3,
        },
        { raw: '3 ovos inteiros', ing: ingMap['ovo-de-galinha'], qty: 3, unit: 'unidades', pos: 4 },
        {
          raw: '100g de manteiga derretida',
          ing: ingMap['manteiga-sem-sal'],
          qty: 100,
          unit: 'g',
          pos: 5,
        },
      ]
      for (const ri of r3Ings) {
        const rec = new Record(recipeIngredients)
        rec.set('recipe', r3.id)
        rec.set('position', ri.pos)
        rec.set('ingredient', ri.ing)
        rec.set('raw_text', ri.raw)
        rec.set('quantity', ri.qty)
        rec.set('unit', ri.unit)
        app.save(rec)
      }

      const r3Steps = [
        { pos: 1, inst: 'Bata os ovos com o açúcar até formar um creme claro e volumoso.', dur: 5 },
        { pos: 2, inst: 'Adicione a manteiga derretida e continue batendo.', dur: 2 },
        {
          pos: 3,
          inst: 'Peneire a farinha e o cacau, misturando delicadamente com uma espátula.',
          dur: 3,
        },
        {
          pos: 4,
          inst: 'Despeje em forma untada e asse a 180°C por 35 a 40 minutos.',
          dur: 40,
          temp: 180,
        },
      ]
      for (const st of r3Steps) {
        const rec = new Record(recipeSteps)
        rec.set('recipe', r3.id)
        rec.set('position', st.pos)
        rec.set('instruction', st.inst)
        rec.set('duration_min', st.dur)
        if (st.temp) rec.set('temperature_c', st.temp)
        app.save(rec)
      }

      const r3Tags = [tagMap['chocolate'], tagMap['rapido-e-facil'], tagMap['vegetariano']]
      for (const tid of r3Tags) {
        const rec = new Record(recipeTags)
        rec.set('recipe', r3.id)
        rec.set('tag', tid)
        app.save(rec)
      }
    }

    // Recipe 4: Unlisted recipe (demonstrating unlisted visibility: reachable by direct link, not in list/search)
    let r4
    try {
      r4 = app.findFirstRecordByFilter(
        'recipes',
        'author = "' + userRecord.id + '" && slug = "segredo-da-focaccia-da-nonna"',
      )
    } catch (_) {
      r4 = new Record(recipes)
      r4.set('author', userRecord.id)
      r4.set('category', catMap['paes-e-massas'])
      r4.set('title', 'Segredo da Focaccia da Nonna')
      r4.set('slug', 'segredo-da-focaccia-da-nonna')
      r4.set(
        'description',
        'Receita secreta compartilhada apenas por link privado direto com a família.',
      )
      r4.set('story', 'Mantida em segredo por gerações em Lucca.')
      r4.set('yield_quantity', 8)
      r4.set('yield_unit', 'porcoes')
      r4.set('prep_minutes', 30)
      r4.set('cook_minutes', 25)
      r4.set('difficulty', 2)
      r4.set('license', 'closed')
      r4.set('status', 'published')
      r4.set('visibility', 'unlisted') // unlisted!
      r4.set('ingredient_count', 3)
      r4.set('search_text', normalizeText('Segredo da Focaccia da Nonna'))
      r4.set('tag_index', '|italiana|')
      app.save(r4)

      const r4Ing = new Record(recipeIngredients)
      r4Ing.set('recipe', r4.id)
      r4Ing.set('position', 1)
      r4Ing.set('ingredient', ingMap['farinha-de-trigo'])
      r4Ing.set('raw_text', '400g de farinha italiana 00')
      r4Ing.set('quantity', 400)
      r4Ing.set('unit', 'g')
      app.save(r4Ing)

      const r4Step = new Record(recipeSteps)
      r4Step.set('recipe', r4.id)
      r4Step.set('position', 1)
      r4Step.set(
        'instruction',
        'Fazer covinhas profundas com os dedos banhados em azeite de oliva extra virgem e salmoura.',
      )
      r4Step.set('duration_min', 25)
      app.save(r4Step)
    }

    // Recipe 5: Private recipe (for testing private access control: returns 404/denied to non-author)
    let r5
    try {
      r5 = app.findFirstRecordByFilter(
        'recipes',
        'author = "' + userRecord.id + '" && slug = "teste-privado-em-desenvolvimento"',
      )
    } catch (_) {
      r5 = new Record(recipes)
      r5.set('author', userRecord.id)
      r5.set('title', 'Teste Privado em Desenvolvimento')
      r5.set('slug', 'teste-privado-em-desenvolvimento')
      r5.set('description', 'Receita particular nunca antes revelada.')
      r5.set('yield_quantity', 4)
      r5.set('yield_unit', 'porcoes')
      r5.set('prep_minutes', 10)
      r5.set('cook_minutes', 20)
      r5.set('difficulty', 1)
      r5.set('license', 'closed')
      r5.set('status', 'published')
      r5.set('visibility', 'private') // private!
      r5.set('ingredient_count', 1)
      r5.set('search_text', normalizeText('Teste Privado em Desenvolvimento'))
      app.save(r5)

      const r5Ing = new Record(recipeIngredients)
      r5Ing.set('recipe', r5.id)
      r5Ing.set('position', 1)
      r5Ing.set('ingredient', ingMap['sal-refinado'])
      r5Ing.set('raw_text', '1 pitada de sal secreto')
      r5Ing.set('quantity', 2)
      r5Ing.set('unit', 'g')
      app.save(r5Ing)
    }

    // 7. Seed sample collection for ana
    try {
      let col = app.findFirstRecordByFilter(
        'collections',
        'owner = "' + userRecord.id + '" && name = "Favoritos da Casa"',
      )
    } catch (_) {
      const col = new Record(collections)
      col.set('owner', userRecord.id)
      col.set('name', 'Favoritos da Casa')
      col.set('is_private', true) // private collection!
      app.save(col)

      const saved = new Record(savedRecipes)
      saved.set('owner', userRecord.id)
      saved.set('recipe', r1.id)
      saved.set('collection', col.id)
      app.save(saved)
    }
  },
  (app) => {
    // down
  },
)
