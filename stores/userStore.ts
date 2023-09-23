import { defineStore } from 'pinia'
import { User } from '@prisma/client'
import { onMounted } from 'vue'
import { errorHandler } from '../server/api/utils/error'

interface UserState {
  user: User | null
  token: string
  apiKey: string | null
  loading: boolean
  lastError: string | null
}

export const useUserStore = defineStore({
  id: 'user',

  // Defining the initial state and its types
  state: (): UserState => ({
    user: null,
    token: '',
    apiKey: typeof window !== 'undefined' ? localStorage.getItem('api_key') : null,
    loading: false,
    lastError: null
  }),

  // Getters are functions that compute derived state based on the store's state
  getters: {
    karma(): number {
      return this.user?.karma || 0
    },
    mana(): number {
      return this.user?.mana || 0
    },
    isLoggedIn(): boolean {
      return !!this.token
    },
    userId(): number | null {
      return this.user ? this.user.id : null
    },
    username(): string {
      return this.user ? this.user.username : 'Kind Guest'
    },
    email(): string {
      return this.user?.email || ''
    },
    role(): string {
      return this.user ? this.user.Role : 'GUEST'
    },
    avatarImage(): string {
      return this.user?.avatarImage || '/images/kindart.webp'
    },
    bio(): string {
      return this.user?.bio || 'I was born and then things happened and now I am here.'
    },
    milestones(): number[] {
      return this.user?.milestones || []
    }
  },

  // Actions are functions that modify the state or trigger other actions
  actions: {
    // User actions
    setUser(userData: User): void {
      this.user = {
        ...userData,
        karma: userData.karma || 0,
        mana: userData.mana || 0
      }
    },
    logout(): void {
      this.user = null
      this.token = ''
      this.apiKey = null
      this.removeFromLocalStorage('api_key')
      this.removeFromLocalStorage('token')
    },

    // Token and API key actions
    setToken(newToken: string): void {
      this.token = newToken
      this.saveToLocalStorage('token', newToken)
    },
    setApiKey(apiKey: string): void {
      this.apiKey = apiKey
      this.saveToLocalStorage('api_key', apiKey)
    },

    // Loading state actions
    startLoading() {
      this.loading = true
    },
    stopLoading() {
      this.loading = false
    },

    // Error handling actions
    setError(error: any) {
      const { message } = errorHandler(error)
      this.lastError = message || 'An unknown error occurred.' // Ensuring message is always a string
    },
    // Local storage actions
    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    },
    saveToLocalStorage(key: string, value: string): void {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value)
      }
    },
    removeFromLocalStorage(key: string): void {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    },

    // API call utility action
    async apiCall(endpoint: string, method: string = 'GET', body?: any) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        })
        if (!response.ok) {
          const { message } = await response.json()
          throw new Error(message || 'Network response was not ok')
        }
        return await response.json()
      } catch (error: any) {
        this.setError(error)
        throw error
      }
    },

    // User-related API actions
    async getUsernames(): Promise<string[]> {
      try {
        const { usernames } = await this.apiCall('/api/users/usernames')
        return usernames
      } catch (error: any) {
        this.setError(error)
        console.error('Failed to fetch usernames:', this.lastError)
        return []
      }
    },
    async updateUserInfo(updatedUserInfo: Partial<User>) {
      try {
        const response = await this.apiCall('/api/users', 'PATCH', updatedUserInfo)
        if (response.success) {
          this.setUser(response.user)
          return { success: true, message: 'User info updated successfully' }
        } else {
          return { success: false, message: response.message }
        }
      } catch (error: any) {
        this.setError(error)
        console.error('Failed to update user info:', this.lastError)
        return { success: false, message: this.lastError }
      }
    },
    async login(credentials: { username: string; password?: string }) {
      this.startLoading()
      try {
        const response = await this.apiCall('/api/auth/login', 'POST', credentials)
        if (response.success) {
          this.setUser(response.user)
          this.setToken(response.token)
          this.setApiKey(response.apiKey)
          this.stopLoading()
          return { success: true }
        } else {
          this.stopLoading()
          return { success: false, message: response.message }
        }
      } catch (error: any) {
        this.stopLoading()
        this.setError(error)
        return { success: false, message: this.lastError }
      }
    },
    async validate(): Promise<boolean> {
      try {
        const credentials = this.token ? { token: this.token } : { apiKey: this.apiKey }
        const response = await this.apiCall('/api/auth/validate', 'POST', credentials)
        return response.ok
      } catch (error: any) {
        this.setError(error)
        console.error('Failed to validate:', this.lastError)
        return false
      }
    },
    async register(userData: {
      username: string
      email?: string
      password?: string
    }): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
      try {
        const response = await this.apiCall('/api/users/register', 'POST', userData)
        if (response.success) {
          this.setUser(response.user)
          this.setToken(response.token)
          if (response.apiKey) {
            this.setApiKey(response.apiKey)
          }
          return { success: true, user: response.user, token: response.token }
        } else {
          return {
            success: false,
            message: response.message || 'An error occurred during registration.'
          } // Providing a fallback message
        }
      } catch (error: any) {
        this.setError(error)
        console.error('Failed to register:', this.lastError)
        return { success: false, message: this.lastError || 'An unknown error occurred.' } // Providing a fallback message
      }
    },

    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return
      try {
        const response = await this.apiCall('/api/user')
        if (response.ok) {
          this.setUser(response.user)
        } else {
          throw new Error('Failed to fetch user')
        }
      } catch (error: any) {
        this.setError(error)
        console.error('Failed to fetch user:', this.lastError)
      }
    },

    // Lifecycle method to initialize the store
    initializeStore() {
      onMounted(() => {
        this.apiKey = this.getFromLocalStorage('api_key')
        if (this.apiKey) {
          this.fetchUserByApiKey()
        }
      })
    }
  }
})
