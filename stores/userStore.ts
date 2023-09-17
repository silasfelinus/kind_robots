import { defineStore } from 'pinia'
import { User } from '@prisma/client'
import { onMounted } from 'vue'
import { errorHandler } from '../server/api/utils/error'

interface UserState {
  user: User | null
  token: string
  apiKey: string | null
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: '',
    apiKey: typeof window !== 'undefined' ? localStorage.getItem('api_key') : null // Read from local storage at initialization safely
  }),
  getters: {
    isLoggedIn(): boolean {
      return !!this.token
    },
    userId(): number | null {
      return this.user ? this.user.id : null
    },
    username(): string {
      return this.user ? this.user.username : 'guest'
    },
    email(): string | null {
      return this.user ? this.user.email : null
    }
  },
  actions: {
    setUser(userData: User): void {
      this.user = userData
    },
    setToken(newToken: string): void {
      this.token = newToken
      localStorage.setItem('token', newToken) // Save to local storage
    },
    setApiKey(apiKey: string): void {
      this.apiKey = apiKey
      localStorage.setItem('api_key', apiKey) // Save to local storage
    },
    async getUsernames(): Promise<string[]> {
      try {
        const response = await fetch('/api/users/usernames', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const { usernames } = await response.json()
          return usernames
        } else {
          throw new Error('Failed to fetch usernames')
        }
      } catch (error: any) {
        const { message } = errorHandler(error)
        console.error('Failed to fetch usernames:', message)
        return []
      }
    },
    async validate(): Promise<boolean> {
      try {
        const credentials = this.token ? { token: this.token } : { apiKey: this.apiKey }
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })

        if (response.ok) {
          return true
        } else {
          throw new Error('Validation failed')
        }
      } catch (error: any) {
        const { message } = errorHandler(error)
        console.error('Failed to validate:', message)
        return false
      }
    },
    async register(userData: {
      username: string
      email?: string
      password?: string
    }): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        if (response.ok) {
          console.log('positive response', response)
          const { user, token, apiKey } = await response.json()
          this.setUser(user)
          this.setToken(token)
          if (apiKey) {
            this.setApiKey(apiKey)
          }
          return { success: true, user, token }
        } else {
          throw new Error('Registration failed. Please try again.')
        }
      } catch (error: any) {
        const { message } = errorHandler(error)
        console.error('Failed to register:', message)
        return { success: false, message }
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return

      try {
        // this isn't implemented
        const response = await fetch('/api/user', {
          headers: {
            'x-api-key': this.apiKey
          }
        })

        if (response.ok) {
          this.user = await response.json()
        } else {
          throw new Error('Failed to fetch user')
        }
      } catch (error: any) {
        const { message } = errorHandler(error)
        console.error('Failed to fetch user:', message)
      }
    },
    logout(): void {
      this.user = null
      this.token = ''
      this.apiKey = null
      localStorage.removeItem('api_key') // Remove from local storage
      localStorage.removeItem('token') // Remove from local storage
    },
    initializeStore() {
      onMounted(() => {
        this.apiKey = localStorage.getItem('api_key') // Move localStorage access here
      })
    }
  }
})
