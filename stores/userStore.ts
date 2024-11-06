import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { performFetch } from './utils'
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

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: undefined,
    loading: false,
    lastError: null,
    stayLoggedIn: true,
    milestones: [],
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
    initializeUser() {
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')
      this.setStayLoggedIn(stayLoggedIn)
      if (storedToken) {
        this.token = storedToken
      }
      if (stayLoggedIn && storedToken) {
        this.fetchUserDataByToken(storedToken)
      }
    },
    // Update other methods to ensure they access response.data.user correctly
    async fetchUserDataByToken(token: string): Promise<void> {
      try {
        const response = await performFetch<{ user: User }>(
          '/api/auth/validate',
          {
            method: 'POST',
            body: JSON.stringify({ type: 'token', data: { token } }),
          },
        )
        if (response.success && response.data) {
          await this.setUser(response.data.user) // Ensure user is set properly
        }
      } catch (error) {
        this.handleError(error, 'fetching user data by token')
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      try {
        const response = await performFetch<{ success: boolean; user: User }>(
          '/api/user',
        )
        if (response.success && response.user) {
          this.setUser(response.user) // Ensure we're accessing the correct property
        } else {
          throw new Error(response.message || 'Failed to fetch user')
        }
      } catch (error) {
        this.handleError(error, 'fetching user by API key')
      }
    },

    async validate(): Promise<boolean> {
      try {
        const credentials = this.token
          ? { token: this.token }
          : { apiKey: this.apiKey }
        const response = await performFetch<{ success: boolean; user: User }>(
          '/api/auth/validate',
          {
            method: 'POST',
            body: JSON.stringify(credentials),
          },
        )
        if (response.success && response.user) {
          this.setUser(response.user) // Accessing the user directly
          return true
        } else {
          this.handleError(
            new Error(response.message || 'Invalid token or API key'),
            'validating user',
          )
          return false
        }
      } catch (error) {
        this.handleError(error, 'validating user')
        return false
      }
    },

    async setUser(userData: User): Promise<void> {
      this.user = userData
    },
    setStayLoggedIn(value: boolean) {
      this.saveToLocalStorage('stayLoggedIn', value.toString())
      this.stayLoggedIn = value
    },
    async fetchUsernameById(userId: number): Promise<string | null> {
      try {
        const response = await performFetch<{ username: string }>(
          `/api/users/${userId}`,
        )
        return response.success ? response.data?.username || 'Unknown' : null
      } catch (error) {
        this.handleError(error, 'fetching username by ID')
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
        const response = await performFetch<{
          success: boolean
          karma: number
          mana: number
        }>(`/api/users/${this.userId}`, {
          method: 'PATCH',
          body: JSON.stringify({ karma: updatedKarma, mana: updatedMana }),
        })
        if (response.success) {
          this.user = {
            ...this.user,
            karma: updatedKarma,
            mana: updatedMana,
          } as User
          return {
            success: true,
            message: 'Successfully updated karma and mana.',
          }
        } else {
          return {
            success: false,
            message: response.message || 'Failed to update karma and mana.',
          }
        }
      } catch (error) {
        this.handleError(error, 'updating karma and mana')
        return {
          success: false,
          message: this.lastError || 'An unknown error occurred',
        }
      }
    },

    async getUsernames(): Promise<string[]> {
      try {
        const data = await performFetch<{ usernames: string[] }>(
          '/api/users/usernames',
        )
        return data.success ? data.data?.usernames || [] : []
      } catch (error) {
        this.handleError(error, 'fetching usernames')
        return []
      }
    },
    async updateUserInfo(
      updatedUserInfo: Partial<User>,
    ): Promise<{ success: boolean; message?: string }> {
      try {
        const response = await performFetch<User>('/api/users', {
          method: 'PATCH',
          body: JSON.stringify(updatedUserInfo),
        })
        if (response.success && response.data) {
          this.setUser(response.data)
          return { success: true, message: 'User info updated successfully' }
        } else {
          return { success: false, message: response.message }
        }
      } catch (error) {
        this.handleError(error, 'updating user info')
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
        const response = await performFetch<User>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        })
        if (response.success && response.data) {
          this.setUser(response.data)
          this.token = response.data.apiKey || undefined
          if (this.stayLoggedIn) {
            this.saveToLocalStorage('token', this.token || '')
          }
          this.stopLoading()
          return { success: true }
        } else {
          this.stopLoading()
          return { success: false, message: response.message }
        }
      } catch (error) {
        this.stopLoading()
        this.handleError(error, 'logging in')
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
        const response = await performFetch<User>('/api/users/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        })
        if (response.success && response.data) {
          this.setUser(response.data)
          this.token = response.data.apiKey || undefined
          return {
            success: true,
            user: response.data,
            token: this.token,
          }
        } else {
          return { success: false, message: response.message }
        }
      } catch (error) {
        this.handleError(error, 'registering user')
        return {
          success: false,
          message: this.lastError || 'An unknown error occurred',
        }
      }
    },
    logout(): void {
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
    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    },
    handleError(error: unknown, action: string): void {
      const errorStore = useErrorStore()
      if (error instanceof Error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `An error occurred while ${action}: ${error.message}`,
        )
      } else {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          `An unknown error occurred while ${action}.`,
        )
      }
    },
  },
})

export type { User }
