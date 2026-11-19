migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Add fields to users: username (already exists in auth collection by default in PocketBase, check fields)
    // Let's add display_name, bio, city, state, role
    if (!users.fields.getByName('display_name')) {
      users.fields.add(
        new TextField({
          name: 'display_name',
          required: true,
          max: 80,
        }),
      )
    }

    if (!users.fields.getByName('bio')) {
      users.fields.add(
        new TextField({
          name: 'bio',
          max: 280,
        }),
      )
    }

    if (!users.fields.getByName('city')) {
      users.fields.add(
        new TextField({
          name: 'city',
          max: 100,
        }),
      )
    }

    if (!users.fields.getByName('state')) {
      users.fields.add(
        new TextField({
          name: 'state',
          max: 2,
        }),
      )
    }

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['user', 'creator', 'admin'],
          maxSelect: 1,
        }),
      )
    }

    // Adjust avatar field if exists or customize
    const avatarField = users.fields.getByName('avatar')
    if (avatarField) {
      avatarField.maxSize = 5242880 // 5MB
      avatarField.mimeTypes = ['image/jpeg', 'image/png', 'image/webp']
      avatarField.thumbs = ['200x200', '800x0']
    }

    // Adjust username field pattern if available
    const usernameField = users.fields.getByName('username')
    if (usernameField) {
      usernameField.min = 3
      usernameField.max = 30
      usernameField.pattern = '^[a-z0-9_]{3,30}$'
    }

    // Access rules as required:
    // users: listRule: "" / viewRule: "" / createRule: "" (allow sign up) / updateRule: "id = @request.auth.id" / deleteRule: "id = @request.auth.id"
    users.listRule = ''
    users.viewRule = ''
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'

    // emailVisibility = false
    users.emailVisibility = false

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('display_name')) users.fields.removeByName('display_name')
    if (users.fields.getByName('bio')) users.fields.removeByName('bio')
    if (users.fields.getByName('city')) users.fields.removeByName('city')
    if (users.fields.getByName('state')) users.fields.removeByName('state')
    if (users.fields.getByName('role')) users.fields.removeByName('role')
    app.save(users)
  },
)
