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

export function getUserNameByUserId(
  users: User[],
  userId: number | null,
): string | null {
  if (userId === null) return null
  const user = users.find((u) => u.id === userId)
  return user?.username || null
}

export function getUserById(users: User[], userId: number | null): User | null {
  if (userId === null) return null
  return users.find((u) => u.id === userId) || null
}

export async function userImage(
  users: User[],
  userId?: number,
): Promise<string> {
  const userStore = useUserStore()
  const resolvedId = userId ?? userStore.userId

  const user = users.find((u) => u.id === resolvedId)

  if (!user) {
    console.warn(`[userImage] No user found for ID ${resolvedId}`)
    return '/images/kindart.webp'
  }

  if (!user.artImageId) {
    return user.avatarImage || '/images/kindart.webp'
  }

  const artStore = useArtStore()
  try {
    const artImage = await artStore.getArtImageById(user.artImageId)
    return artImage?.imageData || '/images/kindart.webp'
  } catch (error) {
    console.error('[userImage] Error fetching art image:', error)
    return '/images/kindart.webp'
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
