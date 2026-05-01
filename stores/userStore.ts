// /stores/userStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { useMilestoneStore } from './milestoneStore'
import { useArtStore } from './artStore'
import {
  getFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  updateUserFields,
  startLoading,
  stopLoading,
} from './helpers/userHelper'

type LoginCredentials = {
  username: string
  password?: string
}

type RegisterUserData = {
  username: string
  email?: string
  password?: string
}

type UserPatch = Partial<User>

type InitializeOptions = {
  token?: string
  force?: boolean
}

const fallbackAvatar = '/images/kindart.webp'

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const sorted = Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (value as Record<string, unknown>)[key]
        return acc
      }, {})

    return JSON.stringify(sorted)
  }

  return JSON.stringify(value)
}

function valuesMatch(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

function cleanPatch(fields: UserPatch): UserPatch {
  return Object.entries(fields).reduce<UserPatch>((patch, [key, value]) => {
    if (value !== undefined) {
      ;(patch as Record<string, unknown>)[key] = value
    }

    return patch
  }, {})
}

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

  const initializePromise = ref<Promise<void> | null>(null)
  const validatePromise = ref<Promise<boolean> | null>(null)
  const fetchUsersPromise = ref<Promise<User[]> | null>(null)
  const patchUserPromise = ref<Promise<User | null> | null>(null)
  const queuedUserPatch = ref<UserPatch>({})
  const lastPatchSignature = ref<string | null>(null)
  const userByIdPromises = ref<Record<number, Promise<User | null>>>({})

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

  function readStoredStayLoggedIn(): boolean {
    const storedStay = getFromLocalStorage('stayLoggedIn')
    return storedStay === null ? true : storedStay === 'true'
  }

  function cacheUser(u: User) {
    const index = users.value.findIndex(
      (existingUser) => existingUser.id === u.id,
    )

    if (index !== -1) {
      users.value.splice(index, 1, u)
    } else {
      users.value.push(u)
    }

    if (user.value?.id === u.id) {
      user.value = u
    }
  }

  function readStoredGoogleFlag(): boolean {
    return getFromLocalStorage('googleToken') === 'true'
  }

  function readStoredToken(): string | undefined {
    const storedToken = getFromLocalStorage('token')
    return storedToken || undefined
  }

  function setLoading(val: boolean) {
    loading.value = val
  }

  function setStayLoggedIn(val: boolean) {
    stayLoggedIn.value = val
    saveToLocalStorage('stayLoggedIn', val.toString())
  }

  function setGoogleToken(val: boolean) {
    googleToken.value = val

    if (val) {
      setStayLoggedIn(true)
    }

    saveToLocalStorage('googleToken', val.toString())
  }

  function setToken(newToken: string) {
    token.value = newToken || undefined

    if (newToken) {
      saveToLocalStorage('token', newToken)
    } else {
      removeFromLocalStorage('token')
    }
  }

  function clearAuthStorage() {
    removeFromLocalStorage('token')
    removeFromLocalStorage('googleToken')
  }

  function resetSessionState(clearError = true) {
    user.value = null
    token.value = undefined
    googleToken.value = false
    recipient.value = null

    if (clearError) {
      lastError.value = null
    }
  }

  function updateUserInList(u: User) {
    const index = users.value.findIndex(
      (existingUser) => existingUser.id === u.id,
    )

    if (index !== -1) {
      users.value.splice(index, 1, u)
    } else {
      users.value.push(u)
    }
  }

  async function setUser(u: User) {
    user.value = u
    updateUserInList(u)
  }

  function getChangedUserFields(fields: UserPatch): UserPatch {
    const cleaned = cleanPatch(fields)

    if (!user.value) {
      return {}
    }

    return Object.entries(cleaned).reduce<UserPatch>((patch, [key, value]) => {
      const currentValue = (user.value as Record<string, unknown>)[key]

      if (!valuesMatch(currentValue, value)) {
        ;(patch as Record<string, unknown>)[key] = value
      }

      return patch
    }, {})
  }

  function queueUserPatch(fields: UserPatch) {
    queuedUserPatch.value = {
      ...queuedUserPatch.value,
      ...cleanPatch(fields),
    }
  }

  async function flushUserPatchQueue(): Promise<User | null> {
    if (patchUserPromise.value) {
      return patchUserPromise.value
    }

    patchUserPromise.value = (async () => {
      let latestUser: User | null = null

      try {
        while (Object.keys(queuedUserPatch.value).length > 0) {
          if (!user.value || user.value.id === 10) {
            queuedUserPatch.value = {}
            return null
          }

          const patch = getChangedUserFields(queuedUserPatch.value)
          queuedUserPatch.value = {}

          if (!Object.keys(patch).length) {
            continue
          }

          const signature = stableStringify(patch)

          if (signature === lastPatchSignature.value) {
            continue
          }

          lastPatchSignature.value = signature

          const res = await performFetch<User>(`/api/users/${user.value.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })

          if (!res.success || !res.data) {
            throw new Error(res.message || 'Failed to update user')
          }

          await setUser(res.data)
          latestUser = res.data
          lastError.value = null
        }

        return latestUser
      } catch (error) {
        handleError(error, 'flushUserPatchQueue')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to update user'
        return null
      } finally {
        patchUserPromise.value = null
        lastPatchSignature.value = null
      }
    })()

    return patchUserPromise.value
  }

  async function initialize(
    options: InitializeOptions | string = {},
  ): Promise<void> {
    const normalizedOptions =
      typeof options === 'string' ? { token: options } : options

    if (initialized.value && !normalizedOptions.force) {
      return
    }

    if (initializePromise.value && !normalizedOptions.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        loading.value = true
        lastError.value = null

        const shouldStayLoggedIn = readStoredStayLoggedIn()
        const storedToken = readStoredToken()
        const tokenToUse = normalizedOptions.token || storedToken

        stayLoggedIn.value = shouldStayLoggedIn
        googleToken.value = readStoredGoogleFlag()

        if (!tokenToUse) {
          resetSessionState()
          initialized.value = true
          return
        }

        token.value = tokenToUse

        const success = await validateAndFetchUserData()

        if (!success) {
          clearAuthStorage()
          resetSessionState(false)
          initialized.value = true
          return
        }

        if (normalizedOptions.token && stayLoggedIn.value) {
          saveToLocalStorage('token', normalizedOptions.token)
        }

        initialized.value = true
      } catch (error) {
        initialized.value = false
        handleError(error, 'initialize user store')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to initialize user'
        throw error
      } finally {
        loading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function validateAndFetchUserData(): Promise<boolean> {
    if (!token.value) {
      return false
    }

    if (validatePromise.value) {
      return validatePromise.value
    }

    validatePromise.value = (async () => {
      try {
        const res = await performFetch<User>('/api/auth/validate/token', {
          method: 'POST',
          body: JSON.stringify({ token: token.value }),
          headers: { 'Content-Type': 'application/json' },
        })

        if (res.success && res.data) {
          await setUser(res.data)

          if (stayLoggedIn.value && token.value) {
            saveToLocalStorage('token', token.value)
          }

          lastError.value = null
          return true
        }

        lastError.value = res.message || 'Invalid token'
        return false
      } catch (error) {
        handleError(error, 'validateAndFetchUserData')
        lastError.value = 'Validation error'
        return false
      } finally {
        validatePromise.value = null
      }
    })()

    return validatePromise.value
  }

  async function fetchUsers(force = false): Promise<User[]> {
    if (!force && users.value.length) {
      return users.value
    }

    if (fetchUsersPromise.value) {
      return fetchUsersPromise.value
    }

    fetchUsersPromise.value = (async () => {
      try {
        const response = await performFetch<User[]>('/api/users')

        if (response.success && response.data) {
          users.value = response.data
          return users.value
        }

        throw new Error(response.message || 'Failed to fetch users')
      } catch (error) {
        handleError(error, 'fetching users')
        users.value = []
        return []
      } finally {
        fetchUsersPromise.value = null
      }
    })()

    return fetchUsersPromise.value
  }

  async function userImage(userIdOverride?: number): Promise<string> {
    const resolvedId = userIdOverride ?? userId.value
    let target = users.value.find((u) => u.id === resolvedId)

    if (!target && resolvedId === userId.value && user.value) {
      target = user.value
    }

    if (!target) {
      await fetchUsers()
      target = users.value.find((u) => u.id === resolvedId)
    }

    if (!target) {
      console.warn('[userImage] no target found for id:', resolvedId)
      return fallbackAvatar
    }

    console.debug(
      '[userImage] target:',
      target.username,
      '| artImageId:',
      target.artImageId,
      '| avatarImage:',
      target.avatarImage,
    )

    if (!target.artImageId) {
      console.debug(
        '[userImage] no artImageId, returning avatarImage or fallback',
      )
      return target.avatarImage || fallbackAvatar
    }

    const artStore = useArtStore()

    try {
      const artImage = await artStore.getArtImageById(target.artImageId)
      console.debug('[userImage] artImage result:', artImage)

      if (!artImage?.imageData) {
        console.warn(
          '[userImage] artImage has no imageData, falling back to avatarImage:',
          target.avatarImage,
        )
        return target.avatarImage || fallbackAvatar
      }

      const data = artImage.imageData
      if (
        data.startsWith('/') ||
        data.startsWith('http') ||
        data.startsWith('data:')
      ) {
        return data
      }
      return `data:image/png;base64,${data}`
    } catch (error) {
      handleError(error, 'userImage')
      return target.avatarImage || fallbackAvatar
    }
  }

  async function getUserById(id: number | null): Promise<User | null> {
    if (id === null) return null

    if (user.value?.id === id) {
      return user.value
    }

    const existing = users.value.find((u) => u.id === id)

    if (existing) {
      return existing
    }

    if (userByIdPromises.value[id]) {
      return userByIdPromises.value[id]
    }

    userByIdPromises.value[id] = (async () => {
      try {
        const response = await performFetch<User>(`/api/users/${id}`)

        if (!response.success || !response.data) {
          throw new Error(response.message || `Failed to fetch user ${id}`)
        }

        cacheUser(response.data)

        return response.data
      } catch (error) {
        handleError(error, 'getUserById')
        return null
      } finally {
        delete userByIdPromises.value[id]
      }
    })()

    return userByIdPromises.value[id]
  }

  async function getUserNameByUserId(
    id: number | null,
  ): Promise<string | null> {
    if (id === null) return null

    if (user.value?.id === id) {
      return user.value.username
    }

    const existing = users.value.find((u) => u.id === id)

    if (existing) {
      return existing.username
    }

    const fetched = await getUserById(id)

    return fetched?.username ?? null
  }

  function logout() {
    resetSessionState()
    initialized.value = false
    initializePromise.value = null
    validatePromise.value = null
    fetchUsersPromise.value = null
    patchUserPromise.value = null
    queuedUserPatch.value = {}
    lastPatchSignature.value = null
    users.value = []
    clearAuthStorage()
    removeFromLocalStorage('user')
    removeFromLocalStorage('stayLoggedIn')
  }

  type LoginResponseData =
    | (User & { token?: string })
    | {
        user: User
        token?: string
      }

  function normalizeLoginData(data: LoginResponseData): {
    user: User | null
    token?: string
  } {
    if ('user' in data) {
      return {
        user: data.user,
        token: data.token,
      }
    }

    return {
      user: data,
      token: data.token,
    }
  }

  async function login(credentials: LoginCredentials) {
    startLoading(setLoading)

    try {
      lastError.value = null

      const res = await performFetch<LoginResponseData>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!res.success || !res.data) {
        const message = res.message || 'Login failed'
        handleError(new Error(message), 'login')
        lastError.value = message
        return { success: false, message }
      }

      const loginData = normalizeLoginData(res.data)

      if (!loginData.user?.id) {
        const message = 'Login response did not include a valid user.'
        handleError(new Error(message), 'login')
        lastError.value = message
        return { success: false, message }
      }

      if (!loginData.token) {
        const message = 'Login response did not include a token.'
        handleError(new Error(message), 'login')
        lastError.value = message
        return { success: false, message }
      }

      await setUser(loginData.user)
      setToken(loginData.token)

      initialized.value = true
      lastError.value = null

      return {
        success: true,
        message: 'Login successful.',
      }
    } catch (error) {
      handleError(error, 'login')
      const message = error instanceof Error ? error.message : 'Login failed'
      lastError.value = message

      return {
        success: false,
        message,
      }
    } finally {
      stopLoading(setLoading)
    }
  }

  async function register(userData: RegisterUserData) {
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
        initialized.value = true
        updateUserInList(res.data.user)

        if (stayLoggedIn.value) {
          saveToLocalStorage('token', res.data.token)
        }

        lastError.value = null
        return res
      }

      handleError(new Error(res.message), 'register')
      lastError.value = res.message

      return { success: false, message: res.message }
    } catch (error) {
      handleError(error, 'register')
      lastError.value = 'Unknown error'

      return { success: false, message: 'Unknown error' }
    }
  }

  async function updateUserToken(newToken: string) {
    if (!newToken) {
      return
    }

    token.value = newToken

    if (stayLoggedIn.value) {
      saveToLocalStorage('token', newToken)
    }

    await updateUser({ token: newToken } as UserPatch)
  }

  async function updateUser(fields: UserPatch) {
    if (!user.value || user.value.id === 10) {
      return
    }

    queueUserPatch(fields)
    await flushUserPatchQueue()
  }

  async function updateUserInfo(info: UserPatch) {
    await updateUser(info)
  }

  async function updateKarmaAndMana() {
    if (!user.value || user.value.id === 10) {
      return { success: false, message: 'Guest users do not update karma.' }
    }

    try {
      const milestoneStore = useMilestoneStore()

      await Promise.all([
        milestoneStore.fetchMilestones(),
        milestoneStore.fetchMilestoneRecords(),
      ])

      const count = milestoneStore.milestoneCountForUser
      const updatedKarma = count * 1000
      const updatedMana = count

      const latestUser = await flushSpecificUserPatch({
        karma: updatedKarma,
        mana: updatedMana,
      } as UserPatch)

      if (latestUser) {
        users.value = updateUserFields(users.value, userId.value, {
          karma: updatedKarma,
          mana: updatedMana,
        })

        return { success: true, message: 'Karma and mana updated.' }
      }

      throw new Error('Failed to update karma and mana.')
    } catch (error) {
      handleError(error, 'updateKarmaAndMana')
      return { success: false, message: 'Failed to update karma and mana.' }
    }
  }

  async function flushSpecificUserPatch(
    fields: UserPatch,
  ): Promise<User | null> {
    queueUserPatch(fields)
    return flushUserPatchQueue()
  }

  async function getUsernames(): Promise<string[]> {
    try {
      const res = await performFetch<string[]>('/api/users/usernames')
      return res.success && res.data ? res.data : []
    } catch (error) {
      handleError(error, 'getUsernames')
      return []
    }
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
    initializePromise,
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
    getFromLocalStorage,
    userImage,
    getUserNameByUserId,
    getUserById,
    userByIdPromises,
  }
})

export type { User }
