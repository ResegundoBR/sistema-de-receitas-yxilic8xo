// pocketbase/hooks/users.pb.js

// Username é permanente (entra no link público /r/:username/:slug).
// Usuário comum não altera username, e-mail nem role (campos de identidade);
// tudo o mais (nome, bio, cidade, estado, avatar) pode editar livremente.
// Admin/superuser pode corrigir qualquer campo.
onRecordUpdateRequest((e) => {
  const record = e.record
  const orig = record.original()
  const isAdmin = e.hasSuperuserAuth() || record.getString('role') === 'admin'

  if (!isAdmin) {
    const origUsername = orig.getString('username')
    if (origUsername && record.getString('username') !== origUsername) {
      throw new BadRequestError(
        'O nome de usuário é permanente: ele faz parte do link das suas receitas.',
      )
    }

    const origEmail = orig.getString('email')
    if (origEmail && record.getString('email') !== origEmail) {
      throw new BadRequestError('Para mudar o e-mail da conta, fale com a gente.')
    }

    const origRole = orig.getString('role')
    if (origRole && record.getString('role') !== origRole) {
      throw new BadRequestError('Não é possível alterar o tipo de conta.')
    }
  }

  e.next()
}, '_pb_users_auth_')
