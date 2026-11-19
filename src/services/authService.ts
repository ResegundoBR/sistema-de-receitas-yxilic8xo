import pb from '@/lib/pocketbase/client'
import { User } from '@/types/recipe'

export const authService = {
  getCurrentUser(): User | null {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return null
    }
    return pb.authStore.record as unknown as User
  },

  isAuthenticated(): boolean {
    return pb.authStore.isValid
  },

  async login(emailOrUsername: string, password: string): Promise<User> {
    const authData = await pb.collection('users').authWithPassword(emailOrUsername, password)
    return authData.record as unknown as User
  },

  async register(data: {
    username: string
    email: string
    password: string
    passwordConfirm: string
    display_name: string
    bio?: string
    city?: string
    state?: string
    avatar?: File
  }): Promise<User> {
    const formData = new FormData()
    formData.append('username', data.username.toLowerCase().trim())
    formData.append('email', data.email.trim())
    formData.append('password', data.password)
    formData.append('passwordConfirm', data.passwordConfirm)
    formData.append('display_name', data.display_name.trim())
    if (data.bio) formData.append('bio', data.bio.trim())
    if (data.city) formData.append('city', data.city.trim())
    if (data.state) formData.append('state', data.state.trim().toUpperCase())
    formData.append('role', 'user')
    if (data.avatar) formData.append('avatar', data.avatar)

    await pb.collection('users').create(formData)
    // Auto login
    const auth = await pb.collection('users').authWithPassword(data.email, data.password)
    return auth.record as unknown as User
  },

  async updateProfile(
    userId: string,
    data: {
      display_name?: string
      bio?: string
      city?: string
      state?: string
      avatar?: File | null
    },
  ): Promise<User> {
    const formData = new FormData()
    if (data.display_name !== undefined) formData.append('display_name', data.display_name)
    if (data.bio !== undefined) formData.append('bio', data.bio)
    if (data.city !== undefined) formData.append('city', data.city)
    if (data.state !== undefined) formData.append('state', data.state)
    if (data.avatar) formData.append('avatar', data.avatar)

    const updated = await pb.collection('users').update(userId, formData)

    // Sincroniza a sessão com o registro novo: sem isto, o usuário continua
    // vendo os dados antigos (avatar, nome, cidade) até deslogar.
    if (pb.authStore.record && pb.authStore.record.id === userId) {
      pb.authStore.save(updated.token || pb.authStore.token, updated)
    }

    return updated as unknown as User
  },

  async requestPasswordReset(email: string): Promise<void> {
    await pb.collection('users').requestPasswordReset(email.trim())
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.getCurrentUser()
    if (!user) throw new Error('Você precisa estar logado para alterar a senha.')
    await pb.collection('users').update(user.id, {
      password: newPassword,
      passwordConfirm: newPassword,
      oldPassword: currentPassword,
    })
  },

  logout(): void {
    pb.authStore.clear()
  },

  subscribe(callback: (user: User | null) => void): () => void {
    return pb.authStore.onChange(() => {
      callback(this.getCurrentUser())
    })
  },

  getAvatarUrl(user: User): string {
    if (user.avatar) {
      return pb.files.getURL(user as any, user.avatar, { thumb: '200x200' })
    }
    return `https://img.usecurling.com/ppl/medium?seed=${user.username || 'chef'}`
  },
}
