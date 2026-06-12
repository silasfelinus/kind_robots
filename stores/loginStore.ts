//stores/loginStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '~/prisma/generated/prisma/client'
import { useUserStore } from '@/stores/userStore'
import {
  getFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
} from '@/stores/helpers/userHelper'

export type LoginRelationship =
  | 'main'
  | 'alt'
  | 'child'
  | 'parent'
  | 'friend'
  | 'blocked'
  | 'testing'

export type ManagedLogin = {
  userId: number
  username: string
  role: string
  token: string
  googleToken: boolean
  avatarImage?: string | null
  artImageId?: number | null
  label?: string
  relationship: LoginRelationship
  lastUsedAt: string
}

const loginStorageKey = 'kindLoginAccounts'
const activeLoginStorageKey = 'kindActiveLoginUserId'
const fallbackAvatar = '/images/kindart.webp'

function parseAccounts(value: string | null): ManagedLogin[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((account): account is ManagedLogin => {
      return (
        typeof account === 'object' &&
        account !== null &&
        typeof account.userId === 'number' &&
        typeof account.username === 'string' &&
        typeof account.token === 'string'
      )
    })
  } catch {
    return []
  }
}

function safeAvatar(user: User | null): string {
  if (!user?.avatarImage || user.avatarImage === 'default') {
    return fallbackAvatar
  }

  return user.avatarImage
}

export const useLoginManagerStore = defineStore('loginManagerStore', () => {
  const accounts = ref<ManagedLogin[]>([])
  const activeUserId = ref<number | null>(null)
  const isOpen = ref(false)
  const isSwitching = ref(false)
  const lastError = ref<string | null>(null)

  const userStore = useUserStore()

  const activeAccount = computed(() => {
    return accounts.value.find((account) => account.userId === activeUserId.value) ?? null
  })

  const otherAccounts = computed(() => {
    return accounts.value
      .filter((account) => account.userId !== userStore.userId)
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
  })

  const currentAvatar = computed(() => safeAvatar(userStore.user))

  const hasAccounts = computed(() => accounts.value.length > 0)

  function persist() {
    saveToLocalStorage(loginStorageKey, JSON.stringify(accounts.value))

    if (activeUserId.value) {
      saveToLocalStorage(activeLoginStorageKey, String(activeUserId.value))
    } else {
      removeFromLocalStorage(activeLoginStorageKey)
    }
  }

  function initialize() {
    accounts.value = parseAccounts(getFromLocalStorage(loginStorageKey))

    const storedActiveId = Number(getFromLocalStorage(activeLoginStorageKey))
    activeUserId.value = Number.isFinite(storedActiveId) ? storedActiveId : null

    if (userStore.user && userStore.token) {
      captureCurrentSession()
    }
  }

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function captureCurrentSession(relationship: LoginRelationship = 'testing') {
    if (!userStore.user || !userStore.token || userStore.user.id === 10) {
      return
    }

    const now = new Date().toISOString()
    const existing = accounts.value.find(
      (account) => account.userId === userStore.user?.id,
    )

    const managedLogin: ManagedLogin = {
      userId: userStore.user.id,
      username: userStore.user.username,
      role: userStore.user.Role ?? 'USER',
      token: userStore.token,
      googleToken: userStore.googleToken,
      avatarImage: userStore.user.avatarImage,
      artImageId: userStore.user.artImageId,
      label: existing?.label,
      relationship: existing?.relationship ?? relationship,
      lastUsedAt: now,
    }

    if (existing) {
      Object.assign(existing, managedLogin)
    } else {
      accounts.value.push(managedLogin)
    }

    activeUserId.value = managedLogin.userId
    persist()
  }

  async function switchToAccount(userId: number) {
    const account = accounts.value.find((candidate) => candidate.userId === userId)

    if (!account) {
      lastError.value = 'Saved login was not found.'
      return { success: false, message: lastError.value }
    }

    isSwitching.value = true
    lastError.value = null

    try {
      userStore.setGoogleToken(account.googleToken)
      userStore.setToken(account.token)

      await userStore.initialize({
        token: account.token,
        force: true,
      })

      if (!userStore.user || userStore.user.id !== account.userId) {
        throw new Error('That saved login is no longer valid.')
      }

      account.username = userStore.user.username
      account.role = userStore.user.Role ?? account.role
      account.avatarImage = userStore.user.avatarImage
      account.artImageId = userStore.user.artImageId
      account.lastUsedAt = new Date().toISOString()

      activeUserId.value = account.userId
      persist()
      close()

      return { success: true, message: `Switched to ${account.username}.` }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to switch accounts.'

      lastError.value = message

      return { success: false, message }
    } finally {
      isSwitching.value = false
    }
  }

  function updateAccountRelationship(
    userId: number,
    relationship: LoginRelationship,
  ) {
    const account = accounts.value.find((candidate) => candidate.userId === userId)

    if (!account) {
      return
    }

    account.relationship = relationship
    persist()
  }

  function updateAccountLabel(userId: number, label: string) {
    const account = accounts.value.find((candidate) => candidate.userId === userId)

    if (!account) {
      return
    }

    account.label = label.trim() || undefined
    persist()
  }

  function removeAccount(userId: number) {
    accounts.value = accounts.value.filter((account) => account.userId !== userId)

    if (activeUserId.value === userId) {
      activeUserId.value = userStore.user?.id ?? null
    }

    persist()
  }

  function clearSavedAccounts() {
    accounts.value = []
    activeUserId.value = null
    removeFromLocalStorage(loginStorageKey)
    removeFromLocalStorage(activeLoginStorageKey)
  }

  return {
    accounts,
    activeUserId,
    activeAccount,
    otherAccounts,
    currentAvatar,
    hasAccounts,
    isOpen,
    isSwitching,
    lastError,
    initialize,
    open,
    close,
    toggle,
    captureCurrentSession,
    switchToAccount,
    updateAccountRelationship,
    updateAccountLabel,
    removeAccount,
    clearSavedAccounts,
  }
})