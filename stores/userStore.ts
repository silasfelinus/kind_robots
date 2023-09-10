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
    async validateToken(): Promise<boolean> {
      if (!this.token) return false

      try {
        const response = await fetch('/api/validate-token', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        })

        return response.ok
      } catch (error: any) {
        console.error('Failed to validate token:', error.message)
        return false
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
