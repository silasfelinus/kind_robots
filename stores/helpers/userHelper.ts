// /stores/helpers/userHelper.ts

import type { User } from '@prisma/client'
import { useArtStore } from '@/stores/artStore'

export function getFromLocalStorage(key: string): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(key) : null
}

export function saveToLocalStorage(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value)
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key)
    console.log('removed', key)
  }
}




export function updateUserFields(
  users: User[],
  userId: number,
  fields: Partial<User>,
): User[] {
  const index = users.findIndex((user) => user.id === userId)
  if (index !== -1) {
    const updatedUser = { ...users[index], ...fields }
    const updatedUsers = [...users]
    updatedUsers.splice(index, 1, updatedUser)
    return updatedUsers
  } else {
    console.warn('User not found in list for partial update:', userId)
    return users
  }
}

export function startLoading(setter: (val: boolean) => void): void {
  setter(true)
}

export function stopLoading(setter: (val: boolean) => void): void {
  setter(false)
}
