import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { useMilestoneStore } from './milestoneStore'

interface UserState {
  user: User | null
  token?: string
  loading: boolean
  lastError: string | null
  stayLoggedIn: boolean
  milestones: number[]
  users: User[]
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: undefined,
    loading: false,
    lastError: null,
    stayLoggedIn: true,
    milestones: [],
    users: [],
  }),
  getters: {
    karma(state): number {
      return state.user ? state.user.karma : 1000
    },
    mana(state): number {
      return state.user ? state.user.mana : 0
    },
    avatarImage(state): string {
      return state.user?.avatarImage || 'default'
    },
    isLoggedIn(state): boolean {
      return Boolean(state.token) && Boolean(state.user)
    },
    userId(state): number {
      return state.user ? state.user.id : 10
    },
    username(state): string {
      return state.user ? state.user.username : 'Kind Guest'
    },
    role(state): string {
      return state.user?.Role || 'USER'
    },
    isAdmin(state): boolean {
      return state.user?.Role === 'ADMIN'
    },
    apiKey(state): string | null {
      return state.user?.apiKey || null
    },
    showMature(state): boolean {
      return state.user?.showMature || false
    },
    matchRecord(state): number | null {
      return state.user?.matchRecord || 0
    },
    clickRecord(state): number | null {
      return state.user?.clickRecord || 0
    },
  },
  actions: {
    async initializeUser() {
      await this.fetchUsers()
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')
      this.setStayLoggedIn(stayLoggedIn)
      if (storedToken) {
        this.token = storedToken
      }

      if (stayLoggedIn && storedToken) {
        this.validateAndFetchUserData()
      }
    },
    async fetchUsers(): Promise<void> {
      try {
        const response = await performFetch<User[]>('/api/users')
        if (response.success && response.data) {
          this.users = response.data
        } else {
          throw new Error(response.message || 'Failed to fetch users')
        }
      } catch (error) {
        handleError(error, 'fetching users')
        this.users = [] // Reset to empty if there's an error
      }
    },
    async getUsernames(): Promise<string[]> {
      try {
        const response = await performFetch<string[]>('/api/users/usernames')
        if (response.success && response.data) {
          return response.data // Access `usernames` directly
        } else {
          handleError(
            new Error(response.message || 'Failed to fetch usernames'),
            'fetching usernames',
          )
          return []
        }
      } catch (error) {
        handleError(error, 'fetching usernames')
        return []
      }
    },
    getUserById(userId: number) {
      return this.users.find((user) => user.id === userId) || null
    },

    async register(userData: {
      username: string
      email?: string
      password?: string
    }) {
      try {
        const response = await performFetch<User>('/api/user/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        })

        if (response.success && response.user && response.token) {
          this.user = response.user
          this.token = response.token
          return {
            success: true,
            user: response.user,
            token: response.token,
          }
        } else {
          console.warn('Registration failed:', response.message)
          handleError(
            new Error(response.message || 'Unknown registration error'),
            'registering user',
          )
          return { success: false, message: response.message }
        }
      } catch (error) {
        handleError(error, 'registering user')
        return { success: false, message: 'An unknown error occurred' }
      }
    },
    setStayLoggedIn(value: boolean) {
      this.stayLoggedIn = value
      this.saveToLocalStorage('stayLoggedIn', value.toString())
    },

    async validateAndFetchUserData(): Promise<boolean> {
      try {
        const response = await performFetch<User>('/api/auth/validate/token', {
          method: 'POST',
          body: JSON.stringify({ token: this.token }),
        })

        if (response.success && response.data) {
          await this.setUser(response.data)
          return true
        } else {
          console.warn('User validation failed:', response.message)
          handleError(
            new Error(response.message || 'Invalid token'),
            'validating user',
          )
          return false
        }
      } catch (error) {
        handleError(error, 'validating user')
        return false
      }
    },

    async fetchUserByApiKey(): Promise<void> {
      try {
        const response = await performFetch<User>('/api/user')
        if (response.success && response.data) {
          await this.setUser(response.data)
        } else {
          throw new Error(response.message || 'Failed to fetch user')
        }
      } catch (error) {
        handleError(error, 'fetching user by API key')
      }
    },

    async updateUserToken(newToken: string): Promise<void> {
      try {
        const response = await performFetch<User>(`/api/users/${this.userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ token: newToken }),
        })
        if (response.success && response.data) {
          await this.setUser(response.data)
          console.log('User token successfully updated in the database.')
        } else {
          console.warn('Failed to update user token:', response.message)
          handleError(
            new Error(response.message || 'Error updating token'),
            'updating user token',
          )
        }
      } catch (error) {
        handleError(error, 'updating user token')
      }
    },

    async updateKarmaAndMana(): Promise<{ success: boolean; message: string }> {
      try {
        const milestoneStore = useMilestoneStore()
        await Promise.all([
          milestoneStore.fetchMilestones(),
          milestoneStore.fetchMilestoneRecords(),
        ])
        const milestoneCount = milestoneStore.getMilestoneCountForUser(
          this.userId,
        )
        const updatedKarma = milestoneCount * 1000
        const updatedMana = milestoneCount

        const response = await performFetch<User>(`/api/users/${this.userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ karma: updatedKarma, mana: updatedMana }),
        })

        if (response.success && response.data) {
          this.user = {
            ...response.data, // Use the updated user data from response
            karma: updatedKarma,
            mana: updatedMana,
          } as User
          return {
            success: true,
            message: 'Successfully updated karma and mana.',
          }
        } else {
          handleError(
            new Error(response.message || 'Failed to update karma and mana.'),
            'updating karma and mana',
          )
          return { success: false, message: 'Failed to update karma and mana.' }
        }
      } catch (error) {
        handleError(error, 'updating karma and mana')
        return { success: false, message: 'An unknown error occurred' }
      }
    },

    async setUser(userData: User): Promise<void> {
      this.user = userData
    },

    async updateUserInfo(
      updatedUserInfo: Partial<User>,
    ): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await performFetch<User>(`/api/users/${this.userId}`, {
          method: 'PATCH',
          body: JSON.stringify(updatedUserInfo),
        })
        if (response.success && response.data) {
          await this.setUser(response.data)
          return { success: true, message: 'User info updated successfully' }
        } else {
          handleError(
            new Error(response.message || 'Unknown error'),
            'updating user info',
          )
          return { success: false, message: response.message }
        }
      } catch (error) {
        handleError(error, 'updating user info')
        return { success: false, message: 'An unknown error occurred' }
      }
    },
    async login(credentials: {
      username: string
      password?: string
    }): Promise<{ success: boolean; message?: string }> {
      this.startLoading()

      try {
        const response = await performFetch<User>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        })

        if (response.success && response.data) {
          await this.setUser(response.data)
          this.token = response.data.token ?? undefined

          // Save the token if it's the first login or stayLoggedIn is true
          if (this.stayLoggedIn && this.token) {
            this.saveToLocalStorage('token', this.token)
          }

          // Update the user's database entry with the token if it's missing
          if (!response.data.token && this.token) {
            await this.updateUserToken(this.token)
          }

          return { success: true }
        } else {
          console.warn('Login failed:', response.message)
          handleError(
            new Error(response.message || 'Unknown login error'),
            'logging in',
          )
          return { success: false, message: response.message }
        }
      } catch (error) {
        handleError(error, 'logging in')
        return { success: false, message: 'An unknown error occurred' }
      } finally {
        this.stopLoading()
      }
    },

    logout(): void {
      console.log('Logging out user.')
      this.user = null
      this.token = undefined
      this.removeFromLocalStorage('token')
      this.removeFromLocalStorage('user')
      this.removeFromLocalStorage('stayLoggedIn')
      this.setStayLoggedIn(false)
    },

    setToken(newToken: string): void {
      this.token = newToken || undefined
      this.saveToLocalStorage('token', newToken)
    },

    startLoading() {
      this.loading = true
    },

    stopLoading() {
      this.loading = false
    },

    saveToLocalStorage(key: string, value: string) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    },

    removeFromLocalStorage(key: string) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    },

    userImage(userId: number): string {
      const user = this.users.find((u) => u.id === userId)
console.log("retrieved user: ", user)
      if (!user || !user.artImageId)
        return user?.avatarImage || '/images/kindart.webp' // Fallback to default image

      const artStore = useArtStore()
      const artImage = artStore.getArtImageById(user.artImageId)
      return artImage?.imageData || '/images/kindart.webp'
    },

    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    },
  },
})

export type { User }
