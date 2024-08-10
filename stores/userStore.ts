import { defineStore } from 'pinia'
import type { User } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'
import { useMilestoneStore } from './milestoneStore'

interface UserState {
  user: User | null
  token: string
  apiKey: string | null
  loading: boolean
  lastError: string | null
  highClickScores: []
  highMatchScores: []
  stayLoggedIn: boolean
  milestones: number[]
}
export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    user: null,
    token: '',
    apiKey: typeof window !== 'undefined' ? localStorage.getItem('api_key') : null,
    loading: false,
    lastError: null,
    highClickScores: [],
    highMatchScores: [],
    stayLoggedIn: true,
    milestones: [],
  }),

  // Getters are functions that compute derived state based on the store's state
  getters: {
    karma(): number {
      return this.user ? this.user.karma : 1000
    },
    mana(): number {
      const manaValue = this.user?.mana || this.milestones.length
      return manaValue
    },
    isLoggedIn(): boolean {
      return Boolean(this.token) && Boolean(this.user)
    },

    userId(): number {
      return this.user ? this.user.id : 0
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
    clickRecord(): number {
      return this.user?.clickRecord || 0
    },
    matchRecord(): number {
      return this.user?.matchRecord || 0
    },
  },

  // Actions are functions that modify the state or trigger other actions
  actions: {
    // Update the initializeUser action
    initializeUser() {
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'
      const storedToken = this.getFromLocalStorage('token')

      // Set the state variables
      this.stayLoggedIn = stayLoggedIn
      if (storedToken) {
        this.token = storedToken
      }

      // If stayLoggedIn is true, then we should also set the token and fetch user data
      if (stayLoggedIn && storedToken) {
        this.fetchUserDataByToken(storedToken)
      }
    },
    async fetchUserDataByToken(token: string) {
      try {
        const response = await this.apiCall('/api/auth/validate', 'POST', {
          type: 'token',
          data: { token },
        })

        if (response.success) {
          this.setUser(response.user)
        }
      }
      catch (error: any) {
        console.log('error!', error)
        this.setError(error)
      }
    },
    async fetchUserByApiKey(): Promise<void> {
      if (!this.apiKey) return
      try {
        const response = await this.apiCall('/api/user')
        if (response.ok) {
          this.setUser(response.user)
        }
        else {
          throw new Error('Failed to fetch user')
        }
      }
      catch (error: any) {
        this.setError(error)
        console.error('Failed to fetch user:', this.lastError)
      }
    },
    // User actions
    setUser(userData: User): void {
      this.user = {
        ...userData,
      }
      this.updateKarmaAndMana().catch((error) => {
        console.error('Failed to update karma and mana:', error)
      })
    },

    setStayLoggedIn(value: boolean) {
      try {
        // Save the value to local storage
        this.saveToLocalStorage('stayLoggedIn', value.toString())

        // Retrieve the value from local storage and update the state
        const storedValue = this.getFromLocalStorage('stayLoggedIn')
        this.stayLoggedIn = storedValue === 'true'

        // Debugging logs
        console.log('🚀 I\'m in setStayLoggedIn')
        console.log(`🍞 Breadcrumb: Stay Logged In - ${this.stayLoggedIn}`)
      }
      catch (error: any) {
        // Centralized error handling
        errorHandler({ success: false, message: `Operation failed: ${error.message}` })
      }
    },

    async fetchHighClickScores() {
      try {
        const response = await fetch('/api/milestones/highClickScores')
        const data = await response.json()
        this.highClickScores = data.milestones
      }
      catch (error: any) {
        errorHandler({ success: false, message: error.message })
      }
    },

    async fetchHighMatchScores() {
      try {
        const response = await fetch('/api/milestones/highMatchScores')
        const data = await response.json()
        this.highMatchScores = data.milestones
      }
      catch (error: any) {
        errorHandler({ success: false, message: error.message })
      }
    },

    // New action to fetch username by userId
    async fetchUsernameById(userId: number): Promise<string | null> {
      try {
        const response = await fetch(`/api/users/${userId}/username`)
        if (response.ok) {
          const data = await response.json()
          return data.username || 'Unknown'
        }
        else {
          const errorText = await response.text()
          const handledError = errorHandler(new Error(errorText))
          console.error('Failed to fetch username:', handledError.message)
          return null
        }
      }
      catch (error: any) {
        const handledError = errorHandler(error)
        console.error('Error fetching username:', handledError.message)
        return null
      }
    },

    async updateClickRecord(newScore: number) {
      try {
        // Fetch the userId from the store
        const userId = this.userId
        if (!userId) {
          throw new Error('User ID is not available')
        }

        const response = await fetch('/api/milestones/updateClickRecord', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newScore, userId }), // Include userId in the request body
        })

        const data = await response.json()
        if (data.success) {
          return 'Updated'
        }
      }
      catch (error: any) {
        errorHandler({ success: false, message: error.message })
      }
    },

    async updateKarmaAndMana(): Promise<{ success: boolean, message: string }> {
      try {
        const milestoneStore = useMilestoneStore()

        // Fetch milestones and records concurrently
        await Promise.all([milestoneStore.fetchMilestones(), milestoneStore.fetchMilestoneRecords()])

        const milestoneCount = milestoneStore.getMilestoneCountForUser(this.userId)
        console.log('milestoneCount', milestoneCount, 'userid', this.userId)

        // Update karma and mana based on milestoneCount
        const updatedKarma: number = milestoneCount * 1000
        const updatedMana: number = milestoneCount

        const response = await fetch(`/api/users/${this.userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: this.userId,
            karma: updatedKarma,
            mana: updatedMana,
          }),
        })

        const data = await response.json()
        if (data.success) {
          // Update the store state here
          if (this.user) {
            this.user.karma = updatedKarma
            this.user.mana = updatedMana
          }
          return {
            success: true,
            message: 'Successfully updated karma and mana.',
          }
        }
        else {
          return {
            success: false,
            message: data.message || 'Failed to update karma and mana.',
          }
        }
      }
      catch (error: any) {
        const { message } = errorHandler(error)
        return {
          success: false,
          message,
        }
      }
    },

    async updateMatchRecord(newScore: number) {
      try {
        // Fetch the userId from the store
        const userId = this.userId
        if (!userId) {
          throw new Error('User ID is not available')
        }

        const response = await fetch('/api/milestones/updateMatchRecord', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newScore, userId }), // Include userId in the request body
        })

        const data = await response.json()
        if (data.success) {
          return this.fetchHighMatchScores() // Make sure to use 'this' to call the store action
        }
      }
      catch (error: any) {
        errorHandler({ success: false, message: error.message })
      }
    },

    logout(): void {
      this.user = null
      this.token = ''
      this.apiKey = null

      // Centralized error handling
      try {
        this.removeFromLocalStorage('api_key')
        this.removeFromLocalStorage('token')
        this.removeFromLocalStorage('user')
        this.removeFromLocalStorage('stayLoggedIn')
      }
      catch (error: any) {
        // Utilize your centralized error handling approach here
        errorHandler({ success: false, message: `Logout failed: ${error.message}` })
      }

      this.setStayLoggedIn(false)
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
    setMilestones(milestoneIds: number[]) {
      this.milestones = milestoneIds
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
          body: body ? JSON.stringify(body) : undefined,
        })
        if (!response.ok) {
          const { message } = await response.json()
          throw new Error(message || 'Network response was not ok')
        }
        return await response.json()
      }
      catch (error: any) {
        this.setError(error)
        throw error
      }
    },

    // User-related API actions
    async getUsernames(): Promise<string[]> {
      try {
        const { usernames } = await this.apiCall('/api/users/usernames')
        return usernames
      }
      catch (error: any) {
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
        }
        else {
          return { success: false, message: response.message }
        }
      }
      catch (error: any) {
        this.setError(error)
        console.error('Failed to update user info:', this.lastError)
        return { success: false, message: this.lastError }
      }
    },

    async login(credentials: { username: string, password?: string }) {
      this.startLoading()
      try {
        const response = await this.apiCall('/api/auth/login', 'POST', credentials)
        if (response.success) {
          this.setUser(response.user)
          this.setToken(response.token)
          this.setApiKey(response.apiKey)

          if (this.stayLoggedIn) {
            this.saveToLocalStorage('token', response.token) // Save token if "stayLoggedIn" is true
          }

          this.stopLoading()
          return { success: true }
        }
        else {
          this.stopLoading()
          return { success: false, message: response.message }
        }
      }
      catch (error: any) {
        this.stopLoading()
        this.setError(error)
        return { success: false, message: this.lastError }
      }
    },
    async validate(): Promise<boolean> {
      try {
        // Use either token or apiKey based on what's available
        const credentials = this.token ? { token: this.token } : { apiKey: this.apiKey }

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
        }
        else {
          console.log('User Token Invalidated')
          this.setError(new Error('Invalid token or API key')) // Update the error state
          return false
        }
      }
      catch (error: any) {
        const { message } = errorHandler(error)
        this.setError(new Error(`🚀 Mission abort! ${message}`)) // Update the error state
        return false
      }
    },

    async register(userData: {
      username: string
      email?: string
      password?: string
    }): Promise<{ success: boolean, user?: User, token?: string, message?: string }> {
      try {
        const response = await this.apiCall('/api/users/register', 'POST', userData)
        if (response.success) {
          this.setUser(response.user)
          this.setToken(response.token)
          if (response.apiKey) {
            this.setApiKey(response.apiKey)
          }
          return { success: true, user: response.user, token: response.token }
        }
        else {
          return {
            success: false,
            message: response.message || 'An error occurred during registration.',
          } // Providing a fallback message
        }
      }
      catch (error: any) {
        this.setError(error)
        console.error('Failed to register:', this.lastError)
        return { success: false, message: this.lastError || 'An unknown error occurred.' } // Providing a fallback message
      }
    },
  },
})

export type { User }
