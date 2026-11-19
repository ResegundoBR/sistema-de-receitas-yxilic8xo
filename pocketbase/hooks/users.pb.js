// pocketbase/hooks/users.pb.js

// Username é permanente (entra no link público /r/:username/:slug).
// Usuário comum não pode alterar nem limpar; admin pode corrigir.
onRecordUpdateRequest((e) => {
  const record = e.record
  const origUsername = record.original().getString('username')
  const newUsername = record.getString('username')
  const isAdmin = e.hasSuperuserAuth() || record.getString('role') === 'admin'

  if (!isAdmin && origUsername && newUsername !== origUsername) {
    throw new BadRequestError(
      'O nome de usuário é permanente: ele faz parte do link das suas receitas.',
    )
  }
  e.next()
}, '_pb_users_auth_')
