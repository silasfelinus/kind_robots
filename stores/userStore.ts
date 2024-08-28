import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { useErrorStore } from './errorStore'
import { useMilestoneStore } from './milestoneStore'

interface UserState {
  user: User | null
  token?: string
  apiKey: string | null
  loading: boolean
  lastError: string | null
  highClickScores: []
  highMatchScores: []
  stayLoggedIn: boolean
  milestones: number[]
  showMatureContent: boolean
}

export interface ApiResponse {
  success: boolean
  data?: unknown // Replace `any` with a more specific type if possible
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
    apiKey:
      typeof window !== 'undefined' ? localStorage.getItem('api_key') : null,
    loading: false,
    lastError: null,
    highClickScores: [],
    highMatchScores: [],
    stayLoggedIn: true,
    milestones: [],
    showMatureContent: false
  }),
  getters: {
    karma(state): number {
      return state.user ? state.user.karma : 1000
    },
    showMature(state): boolean {
      return state.showMatureContent; // Updated getter to reflect the renamed state property
    },
    mana(state): number {
      const manaValue = state.user?.mana || state.milestones.length
      return manaValue
    },
    isLoggedIn(state): boolean {
      return Boolean(state.token) && Boolean(state.user)
    },
    userId(state): number {
      return state.user ? state.user.id : 0
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
  },

  actions: {
    initializeUser() {
      console.log('initializing user')
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')

      this.setStayLoggedIn(stayLoggedIn) // Corrected to use action
      if (storedToken) {
        this.token = storedToken
      }

      if (stayLoggedIn && storedToken) {
        console.log('token found')
        this.fetchUserDataByToken(storedToken)
      }
    },
    async fetchUserDataByToken(token: string): Promise<void> {
      console.log('Verifying token:', token)
      if (!token) {
        throw new Error('Token is required for token validation.')
      }
      try {
        const response = await this.apiCall('/api/auth/validate', 'POST', {
          type: 'token',
          data: { token },
        })

        if (response.success && response.user) {
          console.log('fetched user by token, now setting user', response.user.showMature)
          this.setUser(response.user)
        }
      } catch (error: unknown) {
        console.log('something weird happened in fetchuserbydatatoken')
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
      this.user = userData;
      // Ensure showMature is being updated
      this.showMatureContent = userData.showMature;
      console.log('User set. showmature is now ', this.showMatureContent, this.user)
      this.updateKarmaAndMana().catch((error) => {
        this.setError(error);
      });
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
        if (!userId) {
          throw new Error('User ID is not available')
        }

        const response = await fetch('/api/milestones/updateClickRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        })

        const data = await response.json()
        if (data.success) {
          return 'Updated'
        }
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
    async updateMatchRecord(newScore: number) {
      try {
        const userId = this.userId
        if (!userId) {
          throw new Error('User ID is not available')
        }

        const response = await fetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newScore, userId }),
        })

        const data = await response.json()
        if (data.success) {
          await this.fetchHighMatchScores()
        }
      } catch (error: unknown) {
        this.setError(error)
      }
    },
    logout(): void {
      this.user = null
      this.token = ''
      this.apiKey = null

      try {
        this.removeFromLocalStorage('api_key')
        this.removeFromLocalStorage('token')
        this.removeFromLocalStorage('user')
        this.removeFromLocalStorage('stayLoggedIn')
      } catch (error: unknown) {
        this.setError(error)
      }

      this.setStayLoggedIn(false)
    },
    setToken(newToken: string): void {
      this.token = newToken
      this.saveToLocalStorage('token', newToken)
    },
    setApiKey(apiKey: string): void {
      this.apiKey = apiKey
      this.saveToLocalStorage('api_key', apiKey)
    },
    startLoading() {
      this.loading = true
    },
    stopLoading() {
      this.loading = false
    },
    setMilestones(milestoneIds: number[]) {
      this.milestones = milestoneIds
    },
    async apiCall(
      endpoint: string,
      method: string = 'GET',
      body?: unknown,
    ): Promise<ApiResponse> {
      const errorStore = useErrorStore()

      // Wrap the API call in handleError to catch and process errors
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
            // Pass a specific error message and type
            throw new Error(`API call failed with status ${response.status}`)
          }
        },
        ErrorType.NETWORK_ERROR,
        'API request failed',
      )
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
    async fetchUserById(userId: number): Promise<void> {
      try {
        const response = await this.apiCall(`/api/users/${userId}`)
        if (response.success && response.user) {
          this.setUser(response.user)
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (error: unknown) {
        this.setError(error)
      }
    },

    setError(error: unknown): string {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'An unknown error occurred.'

      const errorStore = useErrorStore()
      errorStore.setError(ErrorType.UNKNOWN_ERROR, message) // Adjust type if necessary

      return message
    },

    async getUsernames(): Promise<string[]> {
      try {
        const data = await this.apiCall('/api/users/usernames')
        // Ensure 'usernames' is defined before returning it
        const usernames: string[] = data.usernames ?? []
        return usernames
      } catch (error: unknown) {
        this.setError(error)
        console.error('Failed to fetch usernames:', this.lastError)
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
        console.error('Failed to update user info:', this.lastError)
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
      console.log(
        'The store has been notified of the login attempt by ',
        credentials,
      )
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
            this.saveToLocalStorage('token', response.token) // Save token if "stayLoggedIn" is true
          }

          this.stopLoading()
          return { success: true }
        } else {
          this.stopLoading()
          return { success: false, message: response.message }
        }
      } catch (error: unknown) {
        console.error('Error in login process:', error)
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
        // Use either token or apiKey based on what's available
        const credentials = this.token
          ? { token: this.token }
          : { apiKey: this.apiKey }

        // Make the API call to /api/auth/validate
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        // Parse the JSON response
        const responseData = await response.json()

        // Check if the validation was successful
        if (responseData.success) {
          console.log('User Token Validated', this.token)
          this.setUser(responseData.user) // Assuming the response contains user data
          return true
        } else {
          console.log('User Token Invalidated')
          this.setError(new Error('Invalid token or API key')) // Update the error state
          return false
        }
      } catch (error: unknown) {
        this.setError(error)
        console.error('Validation failed:', this.lastError)
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
        console.log('registering with the following', userData)
        // Define the response type
        interface RegisterResponse {
          success: boolean
          user?: User
          token?: string
          apiKey?: string
          message?: string
        }

        // Fetch the response
        const response: RegisterResponse = await this.apiCall(
          '/api/users/register',
          'POST',
          userData,
        )

        // Check the response and handle accordingly
        if (response.success) {
          if (response.user) {
            this.setUser(response.user)
          }
          if (response.token) {
            this.setToken(response.token)
          }
          if (response.apiKey) {
            this.setApiKey(response.apiKey)
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
        console.error('Failed to register:', this.lastError)

        // Ensure fallback message is a string
        const errorMessage =
          typeof this.lastError === 'string'
            ? this.lastError
            : 'An unknown error occurred.'

        return { success: false, message: errorMessage }
      }
    },
  },
})
