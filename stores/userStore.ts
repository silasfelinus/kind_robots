import { defineStore } from 'pinia'
import { User } from '@prisma/client'

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
    apiKey: localStorage.getItem('api_key') || null // Read from local storage
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
        const response = await fetch('/api/usernames', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const usernames = await response.json()
          return usernames
        } else {
          const { message } = await response.json()
          console.error('Failed to fetch usernames:', message)
          return []
        }
      } catch (error: any) {
        console.error('Failed to fetch usernames:', error.message)
        return []
      }
    },
    async validate(): Promise<boolean> {
      try {
        const credentials = this.token ? { token: this.token } : { apiKey: this.apiKey }
        const response = await fetch('/api/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })

        if (response.ok) {
          return true
        } else {
          const { message } = await response.json()
          console.error('Validation failed:', message)
          return false
        }
      } catch (error: any) {
        console.error('Failed to validate:', error.message)
        return false
      }
    },
    async register(userData: {
      username: string
      email: string
      password: string
    }): Promise<{ success: boolean; user?: User; token?: string }> {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        if (response.ok) {
          const { user, token, apiKey } = await response.json()
          this.setUser(user)
          this.setToken(token)
          if (apiKey) {
            this.setApiKey(apiKey)
          }
          return { success: true, user, token }
        } else {
          const { message } = await response.json()
          console.error('Registration failed:', message)
          return { success: false, user: undefined, token: undefined }
        }
      } catch (error: any) {
        console.error('Failed to register:', error.message)
        return { success: false, user: undefined, token: undefined }
      }
    },

    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return

      try {
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
        console.error('Failed to fetch user:', error.message)
      }
    },
    logout(): void {
      this.user = null
      this.token = ''
      this.apiKey = null
      localStorage.removeItem('api_key') // Remove from local storage
      localStorage.removeItem('token') // Remove from local storage
    }
  }
})
