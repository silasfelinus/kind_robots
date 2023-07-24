// ~/stores/userStore.ts
import { defineStore } from 'pinia'
import {
  User as UserRecord,
  fetchUsers,
  fetchUserById,
  addUser,
  updateUser,
  deleteUser
} from '../server/api/users'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type User = UserRecord

interface UserState {
  users: User[]
  selectedUser: User | null
}

export const useUserStore = defineStore({
  id: 'users',
  state: (): UserState => ({
    users: [],
    selectedUser: null
  }),
  getters: {
    getSelectedUser(): User | null {
      return this.selectedUser
    }
  },
  actions: {
    async fetchUsers(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.users = await fetchUsers(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Users fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch users.'
      )
    },
    async fetchUserById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const user = await fetchUserById(id)
          if (user) {
            const userIndex = this.users.findIndex((existingUser) => existingUser.id === id)
            if (userIndex !== -1) {
              this.users.splice(userIndex, 1, user)
            } else {
              this.users.push(user)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch user by id.'
      )
    },
    async addUser(userData: Partial<User>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const newUser = await addUser(userData)
          if (newUser) {
            this.users.push(newUser)
            statusStore.setStatus(StatusType.SUCCESS, 'User added successfully.')
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add user.'
      )
    },
    async updateUser(id: number, data: Partial<User>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedUser = await updateUser(id, data)
          if (updatedUser) {
            const userIndex = this.users.findIndex((user) => user.id === id)
            if (userIndex !== -1) {
              this.users.splice(userIndex, 1, updatedUser)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update user.'
      )
    },
    async deleteUser(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const deleteSuccess = await deleteUser(id)
          if (deleteSuccess) {
            const userIndex = this.users.findIndex((user) => user.id === id)
            if (userIndex !== -1) {
              this.users.splice(userIndex, 1)
              statusStore.setStatus(StatusType.SUCCESS, 'User deleted successfully.')
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete user.'
      )
    },
    selectUser(userId: number): void {
      const user = this.users.find((user) => user.id === userId)
      if (user) {
        this.selectedUser = user
      } else {
        throw new Error('Cannot select user that does not exist')
      }
    },
    deselectUser(): void {
      this.selectedUser = null
    }
  }
})
