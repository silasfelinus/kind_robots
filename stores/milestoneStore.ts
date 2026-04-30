// /stores/milestoneStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Milestone,
  MilestoneRecord,
} from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { milestoneData } from './../training/milestoneData'
import { performFetch, handleError, type ApiResponse } from './utils'

type UserScore = {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

type MilestoneInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  migratePendingGuestMilestones?: boolean
}

const isClient = typeof window !== 'undefined'
const milestonesStorageKey = 'milestones'
const milestoneRecordsStorageKey = 'milestoneRecords'
const pendingGuestMilestonesStorageKey = 'pendingGuestMilestones'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string) {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeRemoveLocalStorage(key: string) {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useMilestoneStore = defineStore('milestoneStore', () => {
  const userStore = useUserStore()

  const milestones = ref<Milestone[]>([])
  const milestoneRecords = ref<MilestoneRecord[]>([])
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const loadingMilestones = ref(false)
  const loadingRecords = ref(false)
  const loadingScores = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchMilestonesPromise = ref<Promise<Milestone[]> | null>(null)
  const fetchRecordsPromise = ref<Promise<MilestoneRecord[]> | null>(null)
  const fetchHighClickScoresPromise = ref<Promise<UserScore[]> | null>(null)
  const fetchHighMatchScoresPromise = ref<Promise<UserScore[]> | null>(null)

  const highClickScores = ref<UserScore[]>([])
  const highMatchScores = ref<UserScore[]>([])
  const pendingGuestMilestones = ref<number[]>([])
  const rewardMilestonePromises = new Map<number, Promise<void>>()

  const hasPendingGuestMilestones = computed(
    () => pendingGuestMilestones.value.length > 0,
  )

  const milestoneCountForUser = computed(
    () =>
      milestoneRecords.value.filter(
        (record) => record.userId === userStore.userId,
      ).length,
  )

  const unconfirmedMilestones = computed(() =>
    milestones.value.filter((milestone) =>
      milestoneRecords.value.some(
        (record) =>
          record.userId === userStore.userId &&
          record.milestoneId === milestone.id &&
          !record.isConfirmed,
      ),
    ),
  )

  const milestoneSummary = computed(() =>
    milestones.value.map((milestone) => ({
      id: milestone.id,
      label: milestone.label,
      isActive: milestone.isActive,
    })),
  )

  const activeMilestones = computed(() =>
    milestones.value.filter((milestone) => milestone.isActive),
  )

  function setLastError(error: unknown, fallback: string) {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function persist() {
    safeSetLocalStorage(milestonesStorageKey, JSON.stringify(milestones.value))
    safeSetLocalStorage(
      milestoneRecordsStorageKey,
      JSON.stringify(milestoneRecords.value),
    )
  }

  function hydrateFromLocalStorage() {
    milestones.value = safeParseArray<Milestone>(
      safeGetLocalStorage(milestonesStorageKey),
    )

    milestoneRecords.value = safeParseArray<MilestoneRecord>(
      safeGetLocalStorage(milestoneRecordsStorageKey),
    )

    pendingGuestMilestones.value = safeParseArray<number>(
      safeGetLocalStorage(pendingGuestMilestonesStorageKey),
    ).filter((id) => Number.isInteger(id) && id > 0)
  }

  function shouldRun(): boolean {
    return userStore.isLoggedIn && userStore.userId !== 10
  }

  function hasMilestone(userId: number, milestoneId: number) {
    return milestoneRecords.value.some(
      (record) =>
        record.userId === userId && record.milestoneId === milestoneId,
    )
  }

  function upsertMilestoneRecord(record: MilestoneRecord) {
    const index = milestoneRecords.value.findIndex(
      (entry) => entry.id === record.id,
    )

    if (index >= 0) {
      milestoneRecords.value.splice(index, 1, record)
    } else {
      milestoneRecords.value.push(record)
    }

    persist()
  }

  function upsertMilestone(milestone: Milestone) {
    const index = milestones.value.findIndex(
      (entry) => entry.id === milestone.id,
    )

    if (index >= 0) {
      milestones.value.splice(index, 1, milestone)
    } else {
      milestones.value.push(milestone)
    }

    persist()
  }

  function deactivateMilestone(id: number) {
    const milestone = milestones.value.find((entry) => entry.id === id)

    if (milestone) {
      milestone.isActive = false
      persist()
    }
  }

  async function fetchMilestones(force = false): Promise<Milestone[]> {
    if (!force && milestones.value.length) return milestones.value
    if (fetchMilestonesPromise.value && !force) {
      return fetchMilestonesPromise.value
    }

    fetchMilestonesPromise.value = (async () => {
      try {
        loadingMilestones.value = true
        lastError.value = null

        const res = await performFetch<Milestone[]>('/api/milestones/')

        if (res.success && Array.isArray(res.data)) {
          milestones.value = res.data
          persist()
          return milestones.value
        }

        throw new Error(res.message || 'Failed to fetch milestones')
      } catch (error) {
        handleError(error, 'fetching milestones')
        setLastError(error, 'Failed to fetch milestones')
        return milestones.value
      } finally {
        loadingMilestones.value = false
        fetchMilestonesPromise.value = null
      }
    })()

    return fetchMilestonesPromise.value
  }

  async function fetchMilestoneRecords(
    force = false,
  ): Promise<MilestoneRecord[]> {
    if (!force && milestoneRecords.value.length) return milestoneRecords.value
    if (fetchRecordsPromise.value && !force) return fetchRecordsPromise.value

    fetchRecordsPromise.value = (async () => {
      try {
        loadingRecords.value = true
        lastError.value = null

        const res = await performFetch<MilestoneRecord[]>(
          '/api/milestones/records',
        )

        if (res.success && Array.isArray(res.data)) {
          milestoneRecords.value = res.data
          persist()
          return milestoneRecords.value
        }

        throw new Error(res.message || 'Failed to fetch milestone records')
      } catch (error) {
        handleError(error, 'fetching milestone records')
        setLastError(error, 'Failed to fetch milestone records')
        return milestoneRecords.value
      } finally {
        loadingRecords.value = false
        fetchRecordsPromise.value = null
      }
    })()

    return fetchRecordsPromise.value
  }

  async function initialize(
    options: MilestoneInitializeOptions = {},
  ): Promise<void> {
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        lastError.value = null

        hydrateFromLocalStorage()

        if (options.fetchRemote) {
          await Promise.all([fetchMilestones(), fetchMilestoneRecords()])
        }

        isInitialized.value = true

        if (options.migratePendingGuestMilestones) {
          await migratePendingGuestMilestones()
        }
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing milestoneStore')
        setLastError(error, 'Failed to initialize milestone store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function migratePendingGuestMilestones() {
    if (userStore.isGuest || !isClient) return

    const pendingIds = safeParseArray<number>(
      safeGetLocalStorage(pendingGuestMilestonesStorageKey),
    ).filter((id) => Number.isInteger(id) && id > 0)

    if (!pendingIds.length) return

    for (const id of pendingIds) {
      await rewardMilestone(id)
    }

    pendingGuestMilestones.value = []
    safeRemoveLocalStorage(pendingGuestMilestonesStorageKey)
  }

  async function confirmMilestone(milestoneId: number) {
    if (userStore.isGuest) {
      deactivateMilestone(milestoneId)
      return
    }

    const record = milestoneRecords.value.find(
      (entry) =>
        entry.userId === userStore.userId && entry.milestoneId === milestoneId,
    )

    if (!record) return

    const previous = record.isConfirmed
    record.isConfirmed = true

    try {
      const result = await updateMilestoneRecord({
        id: record.id,
        isConfirmed: true,
      })

      if (!result.success) {
        record.isConfirmed = previous
      }
    } catch (error) {
      record.isConfirmed = previous
      handleError(error, 'confirming milestone')
      deactivateMilestone(milestoneId)
    }
  }

  async function updateMilestone(milestone: Milestone) {
    if (!milestone.id) {
      return
    }

    try {
      const response = await performFetch<Milestone>(
        `/api/milestones/${milestone.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(milestone),
        },
      )

      if (response.success && response.data) {
        upsertMilestone(response.data)
        return
      }

      throw new Error(response.message || 'Failed to update milestone')
    } catch (error) {
      handleError(error, 'updating milestone')
      setLastError(error, 'Failed to update milestone')
    }
  }

  async function updateMilestonesFromData() {
    for (const updatedMilestone of milestoneData) {
      const existingMilestone = milestones.value.find(
        (entry) => entry.id === updatedMilestone.id,
      )

      if (existingMilestone) {
        Object.assign(existingMilestone, updatedMilestone)
        await updateMilestone(existingMilestone)
      }
    }
  }

  async function fetchHighClickScores(force = false): Promise<UserScore[]> {
    if (!force && highClickScores.value.length) return highClickScores.value
    if (fetchHighClickScoresPromise.value && !force) {
      return fetchHighClickScoresPromise.value
    }

    fetchHighClickScoresPromise.value = (async () => {
      try {
        loadingScores.value = true

        const response = await performFetch<UserScore[]>(
          '/api/milestones/highClickScores',
        )

        highClickScores.value = response.data ?? []
        return highClickScores.value
      } catch (error) {
        handleError(error, 'fetching high click scores')
        return highClickScores.value
      } finally {
        loadingScores.value = false
        fetchHighClickScoresPromise.value = null
      }
    })()

    return fetchHighClickScoresPromise.value
  }

  async function fetchHighMatchScores(force = false): Promise<UserScore[]> {
    if (!force && highMatchScores.value.length) return highMatchScores.value
    if (fetchHighMatchScoresPromise.value && !force) {
      return fetchHighMatchScoresPromise.value
    }

    fetchHighMatchScoresPromise.value = (async () => {
      try {
        loadingScores.value = true

        const response = await performFetch<UserScore[]>(
          '/api/milestones/highMatchScores',
        )

        highMatchScores.value = response.data ?? []
        return highMatchScores.value
      } catch (error) {
        handleError(error, 'fetching high match scores')
        return highMatchScores.value
      } finally {
        loadingScores.value = false
        fetchHighMatchScoresPromise.value = null
      }
    })()

    return fetchHighMatchScoresPromise.value
  }

  async function updateClickRecord(newScore: number): Promise<string> {
    if (userStore.isGuest) return 'Guest'

    try {
      const userId = userStore.userId

      const response = await performFetch('/api/milestones/updateClickRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      return response.success ? 'Updated' : 'Failed'
    } catch (error) {
      handleError(error, 'updating click record')
      return 'Failed'
    }
  }

  async function updateMatchRecord(newScore: number): Promise<void> {
    if (userStore.isGuest) return

    try {
      const userId = userStore.userId

      await performFetch('/api/milestones/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      await fetchHighMatchScores(true)
    } catch (error) {
      handleError(error, 'updating match record')
    }
  }

  async function updateMilestoneRecord(
    record: Partial<MilestoneRecord>,
  ): Promise<{ success: boolean; message?: string }> {
    if (!record.id) {
      return { success: false, message: 'Milestone record ID is required.' }
    }

    try {
      const response = await performFetch<MilestoneRecord>(
        `/api/milestones/records/${record.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(record),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update milestone record')
      }

      upsertMilestoneRecord(response.data)
      return { success: true }
    } catch (error) {
      handleError(error, 'updating milestone record')
      return { success: false, message: (error as Error).message }
    }
  }

  async function fetchMilestoneById(
    milestoneId: number,
  ): Promise<ApiResponse<Milestone>> {
    const existing = milestones.value.find((entry) => entry.id === milestoneId)

    if (existing) {
      return {
        success: true,
        message: 'Milestone found locally',
        data: existing,
      }
    }

    try {
      const response = await performFetch<Milestone>(
        `/api/milestones/${milestoneId}`,
      )

      if (response.success && response.data) {
        upsertMilestone(response.data)

        return {
          success: true,
          message: 'Milestone recovered',
          data: response.data,
        }
      }

      return {
        success: false,
        message: response.message || 'Milestone not found',
      }
    } catch (error) {
      handleError(error, 'fetching milestone by ID')
      return {
        success: false,
        message: 'Unknown error occurred while fetching milestone',
      }
    }
  }

  async function addMilestoneRecord(record: Partial<MilestoneRecord>) {
    try {
      const response = await performFetch<MilestoneRecord>(
        '/api/milestones/records',
        {
          method: 'POST',
          body: JSON.stringify(record),
        },
      )

      if (response.success && response.data) {
        upsertMilestoneRecord(response.data)
        return { success: true, message: 'Milestone recorded successfully.' }
      }

      throw new Error(response.message || 'Unknown error occurred')
    } catch (error) {
      handleError(error, 'adding milestone record')
      return { success: false, message: 'An error occurred' }
    }
  }

  async function recordMilestone(userId: number, milestoneId: number) {
    if (userStore.isGuest) {
      return {
        success: true,
        message: 'Guest users cannot earn milestones.',
      }
    }

    if (hasMilestone(userId, milestoneId)) {
      return {
        success: true,
        message: 'Milestone already recorded for this user.',
      }
    }

    try {
      return await addMilestoneRecord({
        userId,
        milestoneId,
        username: userStore.username,
      })
    } catch (error) {
      handleError(error, 'recording milestone')
      return {
        success: false,
        message: 'An error occurred while recording milestone',
      }
    }
  }

  async function rewardMilestone(milestoneId: number) {
    if (rewardMilestonePromises.has(milestoneId)) {
      return rewardMilestonePromises.get(milestoneId)
    }

    const promise = (async () => {
      const userId = userStore.userId

      if (userStore.isGuest) {
        if (!isClient) return

        const current = safeParseArray<number>(
          safeGetLocalStorage(pendingGuestMilestonesStorageKey),
        ).filter((id) => Number.isInteger(id) && id > 0)

        if (!current.includes(milestoneId)) {
          current.push(milestoneId)
          safeSetLocalStorage(
            pendingGuestMilestonesStorageKey,
            JSON.stringify(current),
          )
        }

        pendingGuestMilestones.value = current
        return
      }

      if (!shouldRun()) return

      let milestone = milestones.value.find((entry) => entry.id === milestoneId)

      if (!milestone) {
        const fetched = await fetchMilestoneById(milestoneId)

        if (!fetched.success || !fetched.data) {
          return
        }

        milestone = fetched.data
      }

      if (!hasMilestone(userId, milestoneId)) {
        const result = await recordMilestone(userId, milestoneId)

        if (!result.success) {
          return
        }
      }

      if (milestone && !milestone.isActive) {
        milestone.isActive = true
        persist()
      }
    })()

    rewardMilestonePromises.set(milestoneId, promise)

    try {
      await promise
    } finally {
      rewardMilestonePromises.delete(milestoneId)
    }
  }

  async function clearAllMilestoneRecords() {
    try {
      const response = await performFetch(`/api/milestones/records/clear/`, {
        method: 'DELETE',
      })

      if (response.success) {
        milestoneRecords.value = []
        persist()
      }
    } catch (error) {
      handleError(error, 'clearing all milestone records')
    }
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchMilestonesPromise.value = null
    fetchRecordsPromise.value = null
    lastError.value = null
  }

  return {
    milestones,
    milestoneRecords,
    activeMilestones,
    unconfirmedMilestones,
    milestoneSummary,
    highClickScores,
    highMatchScores,
    isInitialized,
    isInitializing,
    loadingMilestones,
    loadingRecords,
    loadingScores,
    lastError,
    hasPendingGuestMilestones,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    fetchMilestones,
    fetchMilestoneRecords,
    fetchMilestoneById,
    updateMilestone,
    updateMilestonesFromData,
    deactivateMilestone,
    rewardMilestone,
    migratePendingGuestMilestones,

    addMilestoneRecord,
    confirmMilestone,
    updateMilestoneRecord,
    recordMilestone,
    hasMilestone,
    clearAllMilestoneRecords,
    milestoneCountForUser,

    fetchHighClickScores,
    fetchHighMatchScores,
    updateMatchRecord,
    updateClickRecord,

    persist,
  }
})

export type { Milestone, MilestoneRecord }
