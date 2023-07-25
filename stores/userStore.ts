// ~/stores/userStore.ts
import { defineStore } from 'pinia'
import {
  User,
  fetchUsers,
  fetchUserById,
  addUser,
  updateUser,
  deleteUser,
  randomUser,
  countUsers
} from '~/server/api/users'

export const useUserStore = defineStore('userStore', {
  state: () => ({
    users: [] as User[],
    currentUser: null as User | null,
    totalUsers: 0
  }),
  actions: {
    async getUsers(page = 1, pageSize = 10) {
      this.users = await fetchUsers(page, pageSize)
    },
    async getUserById(id: number) {
      this.currentUser = await fetchUserById(id)
    },
    async createUser(userData: Partial<User>) {
      const newUser = await addUser(userData)
      if (newUser) {
        this.users.push(newUser)
      }
      return newUser
    },
    async updateUserById(id: number, data: Partial<User>) {
      const updatedUser = await updateUser(id, data)
      if (updatedUser) {
        const index = this.users.findIndex((user) => user.id === updatedUser.id)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
      }
      return updatedUser
    },
    async deleteUserById(id: number) {
      const deleted = await deleteUser(id)
      if (deleted) {
        this.users = this.users.filter((user) => user.id !== id)
      }
      return deleted
    },
    async getRandomUser() {
      this.currentUser = await randomUser()
    },
    async getTotalUsers() {
      this.totalUsers = await countUsers()
    },
    async loadStore() {
      try {
        await this.currentUser
        return `Loaded ${this.users.length} users`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})
