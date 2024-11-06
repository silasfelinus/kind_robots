import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'
import { useMilestoneStore } from './milestoneStore'

interface UserState {
  user: User | null
  token?: string
  loading: boolean
  lastError: string | null
  stayLoggedIn: boolean
  milestones: number[]
}

export interface ApiResponse {
  success: boolean
  data?: unknown
  message?: string
  user?: User
  token?: string
  apiKey?: string
  usernames?: string[]
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: '',
    loading: false,
    lastError: null,
    stayLoggedIn: true,
    milestones: [],
  }),
  getters: {
    karma(state): number {
      return state.user ? state.user.karma : 1000
    },
    showMature(state): boolean {
      return state.user ? state.user.showMature : false
    },
    mana(state): number {
      const manaValue = state.user?.mana || state.milestones.length
      return manaValue
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
    email(state): string {
      return state.user?.email || ''
    },
    role(state): string {
      return state.user ? state.user.Role : 'GUEST'
    },
    avatarImage(state): string {
      return state.user?.avatarImage || '/images/kindart.webp'
    },
    bio(state): string {
      return (
        state.user?.bio ||
        'I was born and then things happened and now I am here.'
      )
    },
    clickRecord(state): number {
      return state.user?.clickRecord || 0
    },
    matchRecord(state): number {
      return state.user?.matchRecord || 0
    },
    isAdmin(state): boolean {
      return state.user?.Role === 'ADMIN'
    },
    apiKey(state): string | null {
      return state.user?.apiKey || null
    },
  },
  actions: {
    initializeUser() {
      console.log('Initializing User - apiKey:', this.apiKey) // Debugging
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')
      this.setStayLoggedIn(stayLoggedIn)
      if (storedToken) {
        this.token = storedToken
      }
      console.log('will I call fetchUserByDataToken?')
      if (stayLoggedIn && storedToken) {
        console.log('calling fetchUserByDataToken')
        this.fetchUserDataByToken(storedToken)
      }
      console.log('user logged in: ', this.user)
      console.log('user token: ', this.token)
    },
    async fetchUserDataByToken(token: string): Promise<void> {
      try {
        console.log('Fetching User by data token:', token)
        const response = await this.apiCall('/api/auth/validate', 'POST', {
          type: 'token',
          data: { token },
        })
        console.log('will I set user with this : ', response.user)
        if (response.success && response.user) {
          console.log('success, setting user') // Debugging
          this.setUser(response.user)
        }
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      try {
        const response = await this.apiCall('/api/user')
        if (response.success && response.user) {
          this.setUser(response.user)
        } else {
          throw new Error('Failed to fetch user')
        }
      } catch (error: unknown) {
        this.setError(error)
      }
    },

    async validate(): Promise<boolean> {
      try {
        const credentials = this.token
          ? { token: this.token }
          : { apiKey: this.apiKey }
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })
        const responseData = await response.json()
        if (responseData.success) {
          this.setUser(responseData.user)
          return true
        } else {
          this.setError(new Error('Invalid token or API key'))
          return false
        }
      } catch (error: unknown) {
        this.setError(error)
        return false
      }
    },

    setUser(userData: User): void {
      console.log('setting user: ', userData)
      this.user = userData
      console.log('apikey is now: ', this.apiKey)
    },
    setStayLoggedIn(value: boolean) {
      try {
        this.saveToLocalStorage('stayLoggedIn', value.toString())
        this.stayLoggedIn = value
      } catch (error: unknown) {
        this.setError(error)
      }
    },

    async fetchUsernameById(userId: number): Promise<string | null> {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const data = await response.json()
          return data.username || 'Unknown'
        } else {
          const errorText = await response.text()
          this.setError(new Error(errorText))
          return null
        }
      } catch (error: unknown) {
        this.setError(error)
        return null
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
        const response = await fetch(`/api/users/${this.userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.userId,
            karma: updatedKarma,
            mana: updatedMana,
          }),
        })
        const data = await response.json()
        if (data.success) {
          if (this.user) {
            this.user.karma = updatedKarma
            this.user.mana = updatedMana
          }
          return {
            success: true,
            message: 'Successfully updated karma and mana.',
          }
        } else {
          return {
            success: false,
            message: data.message || 'Failed to update karma and mana.',
          }
        }
      } catch (error: unknown) {
        return { success: false, message: this.setError(error) }
      }
    },
    async getUsernames(): Promise<string[]> {
      try {
        const data = await this.apiCall('/api/users/usernames')
        return data.usernames ?? []
      } catch (error: unknown) {
        this.setError(error)
        return []
      }
    },
    async updateUserInfo(
      updatedUserInfo: Partial<User>,
    ): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await this.apiCall(
          '/api/users',
          'PATCH',
          updatedUserInfo,
        )
        if (response.success && response.user) {
          this.setUser(response.user)
          return { success: true, message: 'User info updated successfully' }
        } else {
          return { success: false, message: response.message }
        }
      } catch (error: unknown) {
        this.setError(error)
        return {
          success: false,
          message: this.lastError || 'An unknown error occurred',
        }
      }
    },
    async login(credentials: {
      username: string
      password?: string
    }): Promise<{ success: boolean; message?: string }> {
      this.startLoading()
      try {
        const response = await this.apiCall(
          '/api/auth/login',
          'POST',
          credentials,
        )
        if (response.success && response.user && response.token) {
          this.setUser(response.user)
          this.setToken(response.token)
          if (this.stayLoggedIn) {
            this.saveToLocalStorage('token', response.token)
          }
          this.stopLoading()
          return { success: true }
        } else {
          this.stopLoading()
          return { success: false, message: response.message }
        }
      } catch (error: unknown) {
        this.stopLoading()
        this.setError(error)
        return {
          success: false,
          message: this.lastError || 'An unknown error occurred',
        }
      }
    },

    async register(userData: {
      username: string
      email?: string
      password?: string
    }): Promise<{
      success: boolean
      user?: User
      token?: string
      message?: string
    }> {
      try {
        const response = await this.apiCall(
          '/api/users/register',
          'POST',
          userData,
        )
        if (response.success) {
          if (response.user) {
            this.setUser(response.user)
          }
          if (response.token) {
            this.setToken(response.token)
          }
          return { success: true, user: response.user, token: response.token }
        } else {
          return {
            success: false,
            message:
              response.message || 'An error occurred during registration.',
          }
        }
      } catch (error: unknown) {
        this.setError(error)
        return {
          success: false,
          message: this.lastError || 'An unknown error occurred.',
        }
      }
    },
    logout(): void {
      console.log('Logging out, clearing apiKey') // Debugging
      this.user = null
      this.token = ''
      this.removeFromLocalStorage('token')
      this.removeFromLocalStorage('user')
      this.removeFromLocalStorage('stayLoggedIn')
      this.setStayLoggedIn(false)
    },
    setToken(newToken: string): void {
      this.token = newToken
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
    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    },
    setError(error: unknown): string {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An unknown error occurred.'
      const errorStore = useErrorStore()
      errorStore.setError(ErrorType.UNKNOWN_ERROR, message)
      return message
    },
    async apiCall(
      endpoint: string,
      method: string = 'GET',
      body?: unknown,
    ): Promise<ApiResponse> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
          })
          if (response.ok) {
            return await response.json()
          } else {
            throw new Error(`API call failed with status ${response.status}`)
          }
        },
        ErrorType.NETWORK_ERROR,
        'API request failed',
      )
    },
  },
})

export type { User }
