// /stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { useMilestoneStore } from './milestoneStore'
import {
  getFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  updateUserFields,
  startLoading,
  stopLoading,
} from './helpers/userHelper'

export const useUserStore = defineStore('userStore', () => {
  const user = ref<User | null>(null)
  const token = ref<string | undefined>()
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const stayLoggedIn = ref(true)
  const milestones = ref<number[]>([])
  const users = ref<User[]>([])
  const recipient = ref<User | null>(null)
  const googleToken = ref(false)
  const initialized = ref(false)

  const isGuest = computed(() => !user.value || user.value.id === 10)
  const isLoggedIn = computed(() => !!user.value && user.value.id !== 10)
  const userId = computed(() => user.value?.id ?? 10)
  const username = computed(() => user.value?.username ?? 'Kind Guest')
  const karma = computed(() => user.value?.karma ?? 1000)
  const mana = computed(() => user.value?.mana ?? 0)
  const role = computed(() => user.value?.Role ?? 'USER')
  const isAdmin = computed(() => user.value?.Role === 'ADMIN')
  const avatarImage = computed(() => user.value?.avatarImage ?? 'default')
  const apiKey = computed(() => user.value?.apiKey ?? null)
  const showMature = computed(() => user.value?.showMature ?? false)
  const matchRecord = computed(() => user.value?.matchRecord ?? 0)
  const clickRecord = computed(() => user.value?.clickRecord ?? 0)

  async function initialize(customToken?: string) {
    if (initialized.value) return
    initialized.value = true

    await fetchUsers()

    const storedToken = getFromLocalStorage('token')
    const googleStored = getFromLocalStorage('googleToken')
    const stay = getFromLocalStorage('stayLoggedIn') === 'true'

    setStayLoggedIn(stay)
    if (googleStored) googleToken.value = true

    const tokenToUse = customToken || googleStored || storedToken
    if (tokenToUse) {
      token.value = tokenToUse
      const success = await validateAndFetchUserData()
      if (!success) {
        removeFromLocalStorage('token')
        removeFromLocalStorage('googleToken')
        token.value = undefined
      } else if (customToken) {
        saveToLocalStorage('token', customToken)
      }
    }
  }

  async function fetchUsers() {
    try {
      const response = await performFetch<User[]>('/api/users')
      if (response.success && response.data) users.value = response.data
      else throw new Error(response.message)
    } catch (error) {
      handleError(error, 'fetching users')
      users.value = []
    }
  }

  function setStayLoggedIn(val: boolean) {
    stayLoggedIn.value = val
    saveToLocalStorage('stayLoggedIn', val.toString())
  }

  function setGoogleToken(val: boolean) {
    googleToken.value = val
    setStayLoggedIn(true)
    saveToLocalStorage('googleToken', val.toString())
  }

  function setToken(newToken: string) {
    token.value = newToken || undefined
    saveToLocalStorage('token', newToken)
  }

async function userImage(userIdOverride?: number): Promise<string> {
    const resolvedId = userIdOverride ?? userId.value
    const target = users.value.find((u) => u.id === resolvedId)

    if (!target) return '/images/kindart.webp'
    if (!target.artImageId) return target.avatarImage || '/images/kindart.webp'

    const artStore = useArtStore()
    try {
      const artImage = await artStore.getArtImageById(target.artImageId)
      return artImage?.imageData || '/images/kindart.webp'
    } catch (err) {
      console.error('[userImage] Error loading image:', err)
      return '/images/kindart.webp'
    }
  }

  function getUserNameByUserId(id: number | null): string | null {
    if (id === null) return null
    return users.value.find((u) => u.id === id)?.username ?? null
  }

  function getUserById(id: number | null): User | null {
    if (id === null) return null
    return users.value.find((u) => u.id === id) ?? null
  }

  function logout() {
    console.log('Logging out user.')
    user.value = null
    token.value = undefined
    ;['token', 'user', 'stayLoggedIn'].forEach(removeFromLocalStorage)
  }

  async function login(credentials: { username: string; password?: string }) {
    startLoading(setLoading)
    try {
      const res = await performFetch<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      if (res.success && res.data) {
        await setUser(res.data)
        token.value = res.data.token ?? undefined
        if (stayLoggedIn.value && token.value)
          saveToLocalStorage('token', token.value)
        if (!res.data.token && token.value) await updateUserToken(token.value)
        return { success: true }
      } else {
        handleError(new Error(res.message || 'Login failed'), 'login')
        return { success: false, message: res.message }
      }
    } catch (e) {
      handleError(e, 'login')
      return { success: false, message: 'An unknown error occurred' }
    } finally {
      stopLoading(setLoading)
    }
  }

  async function register(userData: {
    username: string
    email?: string
    password?: string
  }) {
    try {
      const res = await performFetch<{ user: User; token: string }>(
        '/api/user/register',
        {
          method: 'POST',
          body: JSON.stringify(userData),
        },
      )
      if (res.success && res.data) {
        user.value = res.data.user
        token.value = res.data.token
        return res
      } else {
        handleError(new Error(res.message), 'register')
        return { success: false, message: res.message }
      }
    } catch (e) {
      handleError(e, 'register')
      return { success: false, message: 'Unknown error' }
    }
  }

  async function validateAndFetchUserData(): Promise<boolean> {
    if (!token.value) return false
    try {
      const res = await performFetch<User>('/api/auth/validate/token', {
        method: 'POST',
        body: JSON.stringify({ token: token.value }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.success && res.data) {
        await setUser(res.data)
        if (stayLoggedIn.value && token.value)
          saveToLocalStorage('token', token.value)
        return true
      } else {
        lastError.value = res.message || 'Invalid token'
        return false
      }
    } catch (e) {
      lastError.value = 'Validation error'
      return false
    }
  }

  async function updateUserToken(newToken: string) {
    try {
      const res = await performFetch<User>(`/api/users/${userId.value}`, {
        method: 'PATCH',
        body: JSON.stringify({ token: newToken }),
      })
      if (res.success && res.data) await setUser(res.data)
    } catch (e) {
      handleError(e, 'updateUserToken')
    }
  }

  async function setUser(u: User) {
    user.value = u
    if (initialized.value) updateUserInList(u)
  }

  function updateUserInList(u: User) {
    const index = users.value.findIndex((x) => x.id === u.id)
    if (index !== -1) users.value.splice(index, 1, u)
    else users.value.push(u)
  }

  async function updateUser(fields: Partial<User>) {
    if (!user.value) return
    try {
      const res = await performFetch(`/api/users/${user.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.success && res.data) {
        user.value = { ...user.value, ...fields }
      } else {
        throw new Error(res.message)
      }
    } catch (error) {
      handleError(error, 'updateUser')
    }
  }

  async function updateUserInfo(info: Partial<User>) {
    const res = await performFetch<User>(`/api/users/${userId.value}`, {
      method: 'PATCH',
      body: JSON.stringify(info),
    })
    if (res.success && res.data) {
      await setUser(res.data)
      await fetchUsers()
    }
  }

  async function updateKarmaAndMana() {
    try {
      const milestoneStore = useMilestoneStore()
      await Promise.all([
        milestoneStore.fetchMilestones(),
        milestoneStore.fetchMilestoneRecords(),
      ])
      const count = milestoneStore.milestoneCountForUser
      const updatedKarma = count * 1000
      const updatedMana = count

      const res = await performFetch<User>(`/api/users/${userId.value}`, {
        method: 'PATCH',
        body: JSON.stringify({ karma: updatedKarma, mana: updatedMana }),
      })

      if (res.success && res.data) {
        user.value = { ...res.data, karma: updatedKarma, mana: updatedMana }
        users.value = updateUserFields(users.value, userId.value, {
          karma: updatedKarma,
          mana: updatedMana,
        })
        return { success: true, message: 'Karma and mana updated.' }
      } else {
        throw new Error(res.message)
      }
    } catch (e) {
      handleError(e, 'updateKarmaAndMana')
      return { success: false, message: 'Failed to update karma and mana.' }
    }
  }

  async function getUsernames(): Promise<string[]> {
    try {
      const res = await performFetch<string[]>('/api/users/usernames')
      return res.success && res.data ? res.data : []
    } catch (e) {
      handleError(e, 'getUsernames')
      return []
    }
  }

  async function userImageFromId(id: number): Promise<string> {
    return await userImage(users.value, id)
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  return {
    user,
    token,
    loading,
    lastError,
    stayLoggedIn,
    milestones,
    users,
    recipient,
    googleToken,
    initialized,
    isGuest,
    isLoggedIn,
    userId,
    username,
    karma,
    mana,
    role,
    isAdmin,
    avatarImage,
    apiKey,
    showMature,
    matchRecord,
    clickRecord,
    initialize,
    login,
    logout,
    register,
    fetchUsers,
    getUsernames,
    setUser,
    setToken,
    setGoogleToken,
    setStayLoggedIn,
    validateAndFetchUserData,
    updateUser,
    updateUserInfo,
    updateUserToken,
    updateKarmaAndMana,
    userImageFromId,
    getFromLocalStorage,
    userImage: async (id?: number): Promise<string> => {
      return await userImage(users.value, id ?? userId.value)
    },
    getUserNameByUserId: (id: number | null) =>
      getUserNameByUserId(users.value, id),
    getUserById: (id: number | null) => getUserById(users.value, id),
  }
})

export type { User }
