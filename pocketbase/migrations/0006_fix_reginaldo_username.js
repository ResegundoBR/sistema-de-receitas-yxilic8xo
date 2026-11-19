// Migration 0006:
// Garante o username curto "reginaldo" para o usuário Reginaldo Segundo
// (decisão permanente: o link público dele é /r/reginaldo/{slug}).
// Idempotente: se "reginaldo" já é o username dele (ou já é de outra pessoa),
// não faz nada.

migrate(
  (app) => {
    let reginaldo
    try {
      reginaldo = app.findFirstRecordByData(
        '_pb_users_auth_',
        'email',
        'reginaldo.segundo@planagroup.com.br',
      )
    } catch (_) {
      // usuário não existe nesta cópia do banco — nada a fazer
      return
    }

    if (reginaldo.getString('username') === 'reginaldo') return

    // só assume o username se estiver livre
    try {
      app.findFirstRecordByData('_pb_users_auth_', 'username', 'reginaldo')
      // ocupado por outro usuário: não força a troca
      return
    } catch (_) {}

    reginaldo.set('username', 'reginaldo')
    app.save(reginaldo)
  },
  (app) => {
    // down: volta para o username derivado do display_name, se possível
    try {
      const u = app.findFirstRecordByData(
        '_pb_users_auth_',
        'email',
        'reginaldo.segundo@planagroup.com.br',
      )
      if (u.getString('username') === 'reginaldo') {
        u.set('username', 'reginaldo_segundo')
        app.save(u)
      }
    } catch (_) {}
  },
)
