// pocketbase/hooks/saved_recipes.pb.js
//
// Reconcilia ingredient_count, variant_count e save_count de uma receita
// por CONTAGEM REAL no banco (nunca incremento).
// IMPORTANTE: o JSVM do PocketBase executa cada callback em um pool separado —
// funções/variáveis de topo NÃO são visíveis dentro dos callbacks. Toda a
// lógica é, portanto, DUPLICADA inline em cada callback abaixo.
// IMPORTANTE 2: nesta versão do JSVM, $app.countRecords() não aceita string de
// filtro ("could not convert ... to dbx.Expression"). Usar
// $app.findRecordsByFilter(collection, filter, sort, limit, offset).length.

// Ao salvar uma receita numa coleção: atualiza o contador na hora.
onRecordAfterCreateSuccess((e) => {
  const recipeId = e.record.getString('recipe')
  if (recipeId) {
    try {
      const rec = $app.findRecordById('recipes', recipeId)
      const ingCount = $app.findRecordsByFilter(
        'recipe_ingredients',
        'recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length
      const varCount = $app.findRecordsByFilter(
        'recipes',
        'parent_recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length
      const saveCount = $app.findRecordsByFilter(
        'saved_recipes',
        'recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length

      if (
        rec.getInt('ingredient_count') !== ingCount ||
        rec.getInt('variant_count') !== varCount ||
        rec.getInt('save_count') !== saveCount
      ) {
        rec.set('ingredient_count', ingCount)
        rec.set('variant_count', varCount)
        rec.set('save_count', saveCount)
        $app.save(rec)
      }
    } catch (err) {
      console.error('saved_recipes afterCreate reconcile error', recipeId, err)
    }
  }
  e.next()
}, 'saved_recipes')

// Ao remover um salvo: atualiza o contador na hora.
onRecordAfterDeleteSuccess((e) => {
  const recipeId = e.record.getString('recipe')
  if (recipeId) {
    try {
      const rec = $app.findRecordById('recipes', recipeId)
      const ingCount = $app.findRecordsByFilter(
        'recipe_ingredients',
        'recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length
      const varCount = $app.findRecordsByFilter(
        'recipes',
        'parent_recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length
      const saveCount = $app.findRecordsByFilter(
        'saved_recipes',
        'recipe = "' + recipeId + '"',
        '',
        0,
        0,
      ).length

      if (
        rec.getInt('ingredient_count') !== ingCount ||
        rec.getInt('variant_count') !== varCount ||
        rec.getInt('save_count') !== saveCount
      ) {
        rec.set('ingredient_count', ingCount)
        rec.set('variant_count', varCount)
        rec.set('save_count', saveCount)
        $app.save(rec)
      }
    } catch (err) {
      console.error('saved_recipes afterDelete reconcile error', recipeId, err)
    }
  }
  e.next()
}, 'saved_recipes')

// Cron a cada 30 min: reconcilia TODAS as receitas por contagem real.
cronAdd('reconcile_recipe_counts', '*/30 * * * *', () => {
  try {
    const allRecipes = $app.findRecordsByFilter('recipes', 'id != ""', '', 2000, 0)
    for (let i = 0; i < allRecipes.length; i++) {
      const recipeId = allRecipes[i].id
      try {
        const rec = $app.findRecordById('recipes', recipeId)
        const ingCount = $app.findRecordsByFilter(
          'recipe_ingredients',
          'recipe = "' + recipeId + '"',
          '',
          0,
          0,
        ).length
        const varCount = $app.findRecordsByFilter(
          'recipes',
          'parent_recipe = "' + recipeId + '"',
          '',
          0,
          0,
        ).length
        const saveCount = $app.findRecordsByFilter(
          'saved_recipes',
          'recipe = "' + recipeId + '"',
          '',
          0,
          0,
        ).length

        if (
          rec.getInt('ingredient_count') !== ingCount ||
          rec.getInt('variant_count') !== varCount ||
          rec.getInt('save_count') !== saveCount
        ) {
          rec.set('ingredient_count', ingCount)
          rec.set('variant_count', varCount)
          rec.set('save_count', saveCount)
          $app.save(rec)
        }
      } catch (err) {
        console.error('reconcile_recipe_counts error', recipeId, err)
      }
    }
  } catch (err) {
    console.error('Cron reconcile_recipe_counts error:', err)
  }
})
