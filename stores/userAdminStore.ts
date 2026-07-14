// /stores/userAdminStore.ts
//
// Admin user management: roster + moderation actions for the /user-admin page.
// All endpoints are admin-gated server-side; this store just orchestrates them
// and threads impersonation through the login manager.
//
// API:
//   GET   /api/users/admin                 -> roster (rich fields)
//   POST  /api/users/admin/create          -> { username, email?, password?, Role?, showMature? }
//   PATCH /api/users/:id/admin             -> { Role?, showMature?, isPublic?, emailVerified? }
//   POST  /api/users/:id/password          -> { newPassword }
//   POST  /api/users/:id/restrict          -> { reason? }
//   POST  /api/users/:id/unrestrict
//   POST  /api/users/:id/impersonate       -> { token, user }

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from './utils'
import { useLoginManagerStore } from './loginStore'

export type AdminUser = {
  id: number
  username: string
  name?: string | null
  email?: string | null
  Role: string
  emailVerified?: string | Date | null
  showMature: boolean
  isPublic: boolean
  isActive: boolean
  isRestricted: boolean
  restrictedReason?: string | null
  listInDirectory: boolean
  messagePolicy: string
  newsletterFrequency: string
  newsletterConfirmedAt?: string | Date | null
  avatarImage?: string | null
  artImageId?: number | null
  createdAt?: string | Date
}

type Result = { success: boolean; message: string }

export const useUserAdminStore = defineStore('userAdminStore', () => {
  const loginManager = useLoginManagerStore()

  const roster = ref<AdminUser[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastError = ref('')
  const lastMessage = ref('')
  const search = ref('')
  const roleFilter = ref<string>('ALL')

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return roster.value.filter((u) => {
      if (roleFilter.value !== 'ALL' && u.Role !== roleFilter.value) return false
      if (!q) return true
      return (
        u.username.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.name ?? '').toLowerCase().includes(q) ||
        String(u.id) === q
      )
    })
  })

  function patchLocal(userId: number, patch: Partial<AdminUser>) {
    const i = roster.value.findIndex((u) => u.id === userId)
    if (i !== -1) {
      roster.value.splice(i, 1, { ...roster.value[i], ...patch } as AdminUser)
    }
  }

  async function loadRoster(): Promise<void> {
    isLoading.value = true
    lastError.value = ''
    try {
      const res = await performFetch<AdminUser[]>('/api/users/admin')
      roster.value = res.success && Array.isArray(res.data) ? res.data : []
      if (!res.success) lastError.value = res.message || 'Failed to load roster.'
    } catch (error) {
      handleError(error, 'loadRoster')
      lastError.value = 'Failed to load roster.'
    } finally {
      isLoading.value = false
    }
  }

  async function act<T = unknown>(
    label: string,
    url: string,
    method: string,
    body?: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string; data?: T }> {
    isSaving.value = true
    lastError.value = ''
    lastMessage.value = ''
    try {
      const res = await performFetch<T>(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      })
      lastMessage.value = res.message || ''
      if (!res.success) lastError.value = res.message || 'Action failed.'
      return { success: !!res.success, message: res.message || '', data: res.data as T }
    } catch (error) {
      handleError(error, label)
      lastError.value = 'Something went wrong.'
      return { success: false, message: lastError.value }
    } finally {
      isSaving.value = false
    }
  }

  async function createUser(payload: {
    username: string
    email?: string
    password?: string
    Role?: string
    showMature?: boolean
  }): Promise<Result> {
    const res = await act<AdminUser>('createUser', '/api/users/admin/create', 'POST', payload)
    if (res.success && res.data) roster.value.push(res.data as AdminUser)
    return res
  }

  async function updateAdmin(userId: number, patch: Record<string, unknown>): Promise<Result> {
    const res = await act<Partial<AdminUser>>(
      'updateAdmin',
      `/api/users/${userId}/admin`,
      'PATCH',
      patch,
    )
    if (res.success && res.data) patchLocal(userId, res.data as Partial<AdminUser>)
    return res
  }

  function setPassword(userId: number, newPassword: string): Promise<Result> {
    return act('setPassword', `/api/users/${userId}/password`, 'POST', { newPassword })
  }

  async function restrict(userId: number, reason?: string): Promise<Result> {
    const res = await act('restrict', `/api/users/${userId}/restrict`, 'POST', { reason })
    if (res.success) patchLocal(userId, { isRestricted: true, restrictedReason: reason ?? null })
    return res
  }

  async function unrestrict(userId: number): Promise<Result> {
    const res = await act('unrestrict', `/api/users/${userId}/unrestrict`, 'POST')
    if (res.success) patchLocal(userId, { isRestricted: false, restrictedReason: null })
    return res
  }

  // Mint a session for `userId` and switch to it via the login manager. The
  // admin's own session is captured first so they can switch back.
  async function loginAs(userId: number): Promise<Result> {
    const res = await act<{
      token: string
      user: {
        id: number
        username: string
        Role: string
        avatarImage?: string | null
        artImageId?: number | null
      }
    }>('loginAs', `/api/users/${userId}/impersonate`, 'POST')

    if (!res.success || !res.data?.token) {
      return { success: false, message: res.message || 'Could not log in as user.' }
    }

    loginManager.captureCurrentSession('main')
    loginManager.addAccount({
      userId: res.data.user.id,
      username: res.data.user.username,
      role: res.data.user.Role,
      token: res.data.token,
      avatarImage: res.data.user.avatarImage,
      artImageId: res.data.user.artImageId,
      relationship: 'testing',
      label: 'admin login-as',
    })

    const switched = await loginManager.switchToAccount(res.data.user.id)
    return switched
  }

  return {
    roster,
    filtered,
    isLoading,
    isSaving,
    lastError,
    lastMessage,
    search,
    roleFilter,
    loadRoster,
    createUser,
    updateAdmin,
    setPassword,
    restrict,
    unrestrict,
    loginAs,
  }
})
