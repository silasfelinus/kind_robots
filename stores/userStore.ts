import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { useErrorStore, ErrorType } from './errorStore'
import { useMilestoneStore } from './milestoneStore'

interface UserState {
  user: User | null
  token?: string | null
  apiKey: string | null
  loading: boolean
  lastError: string | null
  highClickScores: number[]
  highMatchScores: number[]
  stayLoggedIn: boolean
  milestones: number[]
  showMatureContent: boolean
  openAPIKey: string | null
}

interface ApiResponse {
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
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : '',
    apiKey:
      typeof window !== 'undefined' ? localStorage.getItem('apiKey') : null,
    loading: false,
    lastError: null,
    highClickScores: [],
    highMatchScores: [],
    stayLoggedIn: true,
    milestones: [],
    showMatureContent: false,
    openAPIKey:
      typeof window !== 'undefined'
        ? localStorage.getItem('openAPIKey') || import.meta.env.OPENAI_API_KEY
        : null,
  }),
  getters: {
    apiKey(state): string | null {
      return state.apiKey || state.user?.apiKey || null
    },
    karma(state): number {
      return state.user ? state.user.karma : 1000
    },
    showMature(state): boolean {
      return state.showMatureContent
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
  },
  actions: {
    // Updating initializeUser action with proper logging and retrieval
    initializeUser() {
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')
      const openAPIKey = this.getFromLocalStorage('openAPIKey')
      console.log('Initializing user with:', {
        stayLoggedIn,
        storedToken,
        openAPIKey,
      })

      this.setStayLoggedIn(stayLoggedIn)
      if (storedToken) {
        this.token = storedToken
        console.log('Token loaded from storage:', storedToken)
      }
      if (openAPIKey) {
        this.openAPIKey = openAPIKey
        console.log('Open API Key loaded from storage:', openAPIKey)
      }
      if (stayLoggedIn && storedToken) {
        this.fetchUserDataByToken(storedToken)
      }
    },
    async fetchUserDataByToken(token: string): Promise<void> {
      try {
        const response = await this.apiCall('/api/auth/validate', 'POST', {
          type: 'token',
          data: { token },
        })
        if (response.success && response.user) {
          this.setUser(response.user)
        }
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return
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
    setUser(userData: User): void {
      this.user = userData
      this.showMatureContent = userData.showMature
    },
    setStayLoggedIn(value: boolean) {
      try {
        this.saveToLocalStorage('stayLoggedIn', value.toString())
        this.stayLoggedIn = value
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    async fetchHighClickScores() {
      try {
        const response = await fetch('/api/milestones/highClickScores')
        const data = await response.json()
        this.highClickScores = data.milestones
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    async fetchHighMatchScores() {
      try {
        const response = await fetch('/api/milestones/highMatchScores')
        const data = await response.json()
        this.highMatchScores = data.milestones
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
    async updateClickRecord(newScore: number) {
      try {
        const userId = this.userId
        if (!userId) throw new Error('User ID is not available')
        const response = await fetch('/api/milestones/updateClickRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        })
        const data = await response.json()
        if (data.success) return 'Updated'
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    async updateMatchRecord(newScore: number) {
      try {
        const userId = this.userId
        if (!userId) throw new Error('User ID is not available')
        const response = await fetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        })
        const data = await response.json()
        if (data.success) await this.fetchHighMatchScores()
      } catch (error: unknown) {
        this.setError(error)
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

          console.log('API Key after login:', this.apiKey)

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
      this.user = null
      this.token = ''
      this.apiKey = null
      this.removeFromLocalStorage('apiKey')
      this.removeFromLocalStorage('token')
      this.removeFromLocalStorage('user')
      this.removeFromLocalStorage('stayLoggedIn')
      this.removeFromLocalStorage('openAPIKey')
      this.setStayLoggedIn(false)
    },
    setToken(newToken: string): void {
      this.token = newToken
      this.saveToLocalStorage('token', newToken)
    },

    setOpenApiKey(apiKey: string): void {
      this.openAPIKey = apiKey
      this.saveToLocalStorage('openAPIKey', apiKey)
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
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: body ? JSON.stringify(body) : undefined,
          })
          if (response.ok) {
            console.log('API call response:', response)

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
