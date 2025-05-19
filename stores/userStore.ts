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
  recipient: User | null
  googleToken: boolean
  initialized: boolean
}

export const useUserStore = defineStore('userStore', {
  state: (): UserState => ({
    user: null,
    token: undefined,
    loading: false,
    lastError: null,
    stayLoggedIn: true,
    milestones: [],
    users: [],
    recipient: null,
    googleToken: false,
    initialized: false,
  }),

  getters: {
    isGuest(state): boolean {
      return state.user === null || state.user?.id === 10
    },

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
      return state.user !== null && state.user.id !== 10
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
    async initialize(customToken?: string) {
      if (this.initialized) return
      this.initialized = true

      await this.fetchUsers()

      const storedToken = this.getFromLocalStorage('token')
      const googleToken = this.getFromLocalStorage('googleToken')
      const stayLoggedIn = this.getFromLocalStorage('stayLoggedIn') === 'true'

      this.setStayLoggedIn(stayLoggedIn)

      const tokenToUse = customToken || googleToken || storedToken

      if (googleToken) {
        this.googleToken = true
      }

      if (tokenToUse) {
        this.token = tokenToUse
        const success = await this.validateAndFetchUserData()

        if (!success) {
          console.warn('[userStore] Token invalid on init. Clearing.')
          this.removeFromLocalStorage('token')
          this.removeFromLocalStorage('googleToken')
          this.token = undefined
        } else if (customToken) {
          this.saveToLocalStorage('token', customToken)
        }
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
    getUserNameByUserId(userId: number | null): string | null {
      if (userId === null) {
        return null
      }
      const user = this.users.find((user) => user.id === userId)
      return user ? user.username : null
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
    getUserById(userId: number | null): User | null {
      if (userId === null) {
        return null
      }
      return this.users.find((user) => user.id === userId) || null
    },

    async updateUserInList(updatedUser: User) {
      if (!this.users.length && this.initialized) {
        // If initialized and still no users, fetch once
        console.warn(
          '[userStore] Users list is empty. Fetching users before update...',
        )
        await this.fetchUsers()
      }

      const index = this.users.findIndex((user) => user.id === updatedUser.id)

      if (index !== -1) {
        this.users.splice(index, 1, updatedUser)
        console.log('[userStore] Updated user in list:', updatedUser.username)
      } else {
        // Avoid pushing duplicates if fetchUsers failed or user not found
        const exists = this.users.some((u) => u.id === updatedUser.id)
        if (!exists) {
          console.warn(
            '[userStore] User not found in list after fetch. Adding to list:',
            updatedUser.username,
          )
          this.users.push(updatedUser)
        }
      }
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
      if (this.stayLoggedIn !== value) {
        this.stayLoggedIn = value
        this.saveToLocalStorage('stayLoggedIn', value.toString())
        console.log('Updated stayLoggedIn in localStorage:', value)
      }
    },

    async validateAndFetchUserData(): Promise<boolean> {
      if (!this.token) return false

      try {
        const response = await performFetch<User>('/api/auth/validate/token', {
          method: 'POST',
          body: JSON.stringify({ token: this.token }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.success && response.data) {
          await this.setUser(response.data)

          if (this.stayLoggedIn && this.token) {
            this.saveToLocalStorage('token', this.token)
          }

          return true
        } else {
          handleError(
            new Error(response.message || 'Invalid token'),
            'validating user',
          )
          this.lastError = response.message || 'Invalid token'
          return false
        }
      } catch (error) {
        handleError(error, 'validating user')
        this.lastError = 'An error occurred while validating user'
        return false
      }
    },

    async updateKarmaAndMana(): Promise<{ success: boolean; message: string }> {
      try {
        const milestoneStore = useMilestoneStore()
        await Promise.all([
          milestoneStore.fetchMilestones(),
          milestoneStore.fetchMilestoneRecords(),
        ])
        const milestoneCount = milestoneStore.milestoneCountForUser
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
          }
          this.updateUserFields(this.userId, {
            karma: updatedKarma,
            mana: updatedMana,
          })
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

      // Only update list if already initialized
      if (this.initialized) {
        this.updateUserInList(userData)
      }
    },

    async updateUserInfo(updatedUserInfo: Partial<User>) {
      const response = await performFetch<User>(`/api/users/${this.userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedUserInfo),
      })
      if (response.success && response.data) {
        await this.setUser(response.data)
        await this.fetchUsers() // Refresh the users array
      }
    },
    updateUserFields(userId: number, fields: Partial<User>) {
      const index = this.users.findIndex((user) => user.id === userId)
      if (index !== -1) {
        const updatedUser = { ...this.users[index], ...fields }
        this.users.splice(index, 1, updatedUser)
      } else {
        console.warn('User not found in list for partial update:', userId)
      }
    },
    async updateUser(fields: Partial<User>) {
      if (!this.user) return

      try {
        const res = await performFetch(`/api/users/${this.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        })

        if (res.success && res.data) {
          this.user = { ...this.user, ...fields }
          console.log('[userStore] Updated user fields:', fields)
        } else {
          throw new Error(res.message || 'Failed to update user')
        }
      } catch (error) {
        handleError(error, 'userStore:updateUser')
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
          handleError(
            new Error(response.message || 'Error updating token'),
            'updating user token',
          )
        }
      } catch (error) {
        handleError(error, 'updating user token')
      }
    },

    setGoogleToken(value: boolean) {
      this.googleToken = value
      this.setStayLoggedIn(true)
      this.saveToLocalStorage('googleToken', value.toString())
      console.log('Google login preference updated:', value)
    },

    logout(): void {
      console.log('Logging out user.')
      this.user = null
      this.token = undefined // Clear the in-memory token

      // Log and clear localStorage keys
      ;['token', 'user', 'stayLoggedIn'].forEach((key) => {
        const value = localStorage.getItem(key)
        console.log(`${key} before clearing:`, value)
        localStorage.removeItem(key)
      })

      // Confirm localStorage is cleared
      console.log('LocalStorage state after logout:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        stayLoggedIn: localStorage.getItem('stayLoggedIn'),
      })
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
        console.log('removed ', key)
      }
    },

    async userImage(userId: number): Promise<string> {
      const user = this.users.find((u) => u.id === userId)

      if (!user || !user.artImageId) {
        console.log('no art image or user')
        return user?.avatarImage || '/images/kindart.webp' // Fallback to default image
      }

      const artStore = useArtStore()
      try {
        const artImage = await artStore.getArtImageById(user.artImageId) // Await the Promise
        return artImage?.imageData || '/images/kindart.webp' // Access imageData after the Promise resolves
      } catch (error) {
        console.error('Error fetching art image:', error)
        return '/images/kindart.webp' // Fallback in case of error
      }
    },

    getFromLocalStorage(key: string): string | null {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null
    },
  },
})

export type { User }
