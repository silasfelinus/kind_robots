// ~/stores/userStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { User } from '@prisma/client' // Import the User type based on your actual types file
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'
import { userData } from './seeds/seedUsers' // Assuming you have a seeds file for User data

const errorStore = useErrorStore()
const statusStore = useStatusStore()

interface UserStoreState {
  users: User[]
  currentUser: User | null
  totalUsers: number
  errors: string[]
  page: number
  pageSize: number
}

export const useUserStore = defineStore({
  id: 'users',
  state: (): UserStoreState => ({
    users: [],
    currentUser: null,
    totalUsers: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading user store...')
      try {
        // Get the current count of users
        await this.countUsers()
        if (this.totalUsers === 0) {
          await this.seedUsers()
        }

        // Load other store data
        await this.getUsers(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.users.length} users`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing user store: ' + error)
      }
    },
    async getUsers(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching users...')
      try {
        const { data } = await axios.get(`/api/users?page=${page}&pageSize=${pageSize}`)
        this.users = [...this.users, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.users.length} users`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch users: ' + error)
      }
    },
    async getUserById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching user with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/users/${id}`)
        this.currentUser = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched user with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch user by id: ' + error)
      }
    },
    async addUsers(userData: Partial<User>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new users...')
      try {
        const { data } = await axios.post(`/api/users`, userData)
        this.users = [...this.users, ...data.users]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.users.length} users`)
        // Update the total users count after adding new users
        await this.countUsers()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add users: ' + error)
      }
    },
    async updateUser(id: number, data: Partial<User>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating user with id ${id}...`)
      try {
        const { data: updatedUser } = await axios.put(`/api/users/${id}`, data)
        this.currentUser = updatedUser
        statusStore.setStatus(StatusType.SUCCESS, `Updated user with id ${id}`)
        // Fetch the updated list of users after updating a user
        await this.getUsers()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update user: ' + error)
      }
    },
    async deleteUser(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting user with id ${id}...`)
      try {
        await axios.delete(`/api/users/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted user with id ${id}`)
        // Fetch the updated list of users and total users count after deleting a user
        await this.getUsers()
        await this.countUsers()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete user: ' + error)
      }
    },
    async randomUser(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random user...')
      try {
        const { data } = await axios.get(`/api/users/random`)
        this.currentUser = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random user')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random user: ' + error)
      }
    },
    async countUsers(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting users...')
      try {
        const { data } = await axios.get(`/api/users/count`)
        this.totalUsers = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted a total of ${this.totalUsers} users`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count users: ' + error)
      }
    },
    async seedUsers(): Promise<void> {
      // If there are no users, load them
      statusStore.setStatus(StatusType.INFO, 'Seeding users...')
      try {
        await this.addUsers(userData)
        statusStore.setStatus(StatusType.SUCCESS, 'Users successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading users: ' + error)
      }

      // Fetch the updated list of users and total users count after seeding
      await this.getUsers()
      await this.countUsers()
    }
  }
})
