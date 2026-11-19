// pocketbase/hooks/saved_recipes.pb.js

// Reconcilia ingredient_count, variant_count e save_count de uma receita
// por CONTAGEM REAL no banco (nunca incremento).
function reconcileRecipeCounts(recipeId) {
  if (!recipeId) return
  try {
    const rec = $app.findRecordById('recipes', recipeId)
    const ingCount = $app.countRecords('recipe_ingredients', 'recipe = "' + recipeId + '"')
    const varCount = $app.countRecords('recipes', 'parent_recipe = "' + recipeId + '"')
    const saveCount = $app.countRecords('saved_recipes', 'recipe = "' + recipeId + '"')

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
    console.error('reconcileRecipeCounts error', recipeId, err)
  }
}

// Ao salvar uma receita numa coleção: atualiza o contador na hora.
onRecordAfterCreateSuccess((e) => {
  reconcileRecipeCounts(e.record.getString('recipe'))
  e.next()
}, 'saved_recipes')

// Ao remover um salvo: atualiza o contador na hora.
onRecordAfterDeleteSuccess((e) => {
  reconcileRecipeCounts(e.record.getString('recipe'))
  e.next()
}, 'saved_recipes')

// Cron a cada 30 min: reconcilia TODAS as receitas por contagem real.
cronAdd('reconcile_recipe_counts', '*/30 * * * *', () => {
  try {
    const allRecipes = $app.findRecordsByFilter('recipes', 'id != ""', '', 2000, 0)
    for (let i = 0; i < allRecipes.length; i++) {
      reconcileRecipeCounts(allRecipes[i].id)
    }
  } catch (err) {
    console.error('Cron reconcile_recipe_counts error:', err)
  }
})
