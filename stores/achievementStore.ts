// /stores/achievementStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Achievement,
  AchievementRecord,
} from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { useErrorStore } from './errorStore'
import { achievementData } from './../training/achievementData'
import { performFetch, handleError } from './utils'
import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { slugify } from '~/utils/slugify'
import type { ApiResponse } from '~/types/api'

type UserScore = {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

type AchievementInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  migratePendingGuestAchievements?: boolean
}

const isClient = typeof window !== 'undefined'
const achievementsStorageKey = 'achievements'
const achievementRecordsStorageKey = 'achievementRecords'
const pendingGuestAchievementsStorageKey = 'pendingGuestAchievements'

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

export const useAchievementStore = defineStore('achievementStore', () => {
  const userStore = useUserStore()
  const errorStore = useErrorStore()

  const achievements = ref<Achievement[]>([])
  const achievementRecords = ref<AchievementRecord[]>([])
  const usingSnapshot = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const loadingAchievements = ref(false)
  const loadingRecords = ref(false)
  const loadingScores = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchAchievementsPromise = ref<Promise<Achievement[]> | null>(null)
  const fetchRecordsPromise = ref<Promise<AchievementRecord[]> | null>(null)
  const fetchHighClickScoresPromise = ref<Promise<UserScore[]> | null>(null)
  const fetchHighMatchScoresPromise = ref<Promise<UserScore[]> | null>(null)

  const highClickScores = ref<UserScore[]>([])
  const highMatchScores = ref<UserScore[]>([])
  const pendingGuestAchievements = ref<number[]>([])
  const rewardAchievementPromises = new Map<number, Promise<void>>()

  const hasPendingGuestAchievements = computed(
    () => pendingGuestAchievements.value.length > 0,
  )

  const achievementCountForUser = computed(
    () =>
      achievementRecords.value.filter(
        (record) => record.userId === userStore.userId,
      ).length,
  )

  const unconfirmedAchievements = computed(() =>
    achievements.value.filter((achievement) =>
      achievementRecords.value.some(
        (record) =>
          record.userId === userStore.userId &&
          record.achievementId === achievement.id &&
          !record.isConfirmed,
      ),
    ),
  )

  const achievementSummary = computed(() =>
    achievements.value.map((achievement) => ({
      id: achievement.id,
      label: achievement.label,
      isActive: achievement.isActive,
    })),
  )

  const activeAchievements = computed(() =>
    achievements.value.filter((achievement) => achievement.isActive),
  )

  function setLastError(error: unknown, fallback: string) {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function persist() {
    safeSetLocalStorage(achievementsStorageKey, JSON.stringify(achievements.value))
    safeSetLocalStorage(
      achievementRecordsStorageKey,
      JSON.stringify(achievementRecords.value),
    )
  }

  function hydrateFromLocalStorage() {
    achievements.value = safeParseArray<Achievement>(
      safeGetLocalStorage(achievementsStorageKey),
    )

    achievementRecords.value = safeParseArray<AchievementRecord>(
      safeGetLocalStorage(achievementRecordsStorageKey),
    )

    pendingGuestAchievements.value = safeParseArray<number>(
      safeGetLocalStorage(pendingGuestAchievementsStorageKey),
    ).filter((id) => Number.isInteger(id) && id > 0)
  }

  function shouldRun(): boolean {
    return userStore.isLoggedIn && userStore.userId !== 10
  }

  function hasAchievement(userId: number, achievementId: number) {
    return achievementRecords.value.some(
      (record) =>
        record.userId === userId && record.achievementId === achievementId,
    )
  }

  function upsertAchievementRecord(record: AchievementRecord) {
    const index = achievementRecords.value.findIndex(
      (entry) => entry.id === record.id,
    )

    if (index >= 0) {
      achievementRecords.value.splice(index, 1, record)
    } else {
      achievementRecords.value.push(record)
    }

    persist()
  }

  function upsertAchievement(achievement: Achievement) {
    const index = achievements.value.findIndex(
      (entry) => entry.id === achievement.id,
    )

    if (index >= 0) {
      achievements.value.splice(index, 1, achievement)
    } else {
      achievements.value.push(achievement)
    }

    persist()
  }

  function deactivateAchievement(id: number) {
    const achievement = achievements.value.find((entry) => entry.id === id)

    if (achievement) {
      achievement.isActive = false
      persist()
    }
  }

  async function fetchAchievements(force = false): Promise<Achievement[]> {
    if (!force && achievements.value.length) return achievements.value
    if (fetchAchievementsPromise.value && !force) {
      return fetchAchievementsPromise.value
    }

    fetchAchievementsPromise.value = (async () => {
      try {
        loadingAchievements.value = true
        lastError.value = null

        const res = await performFetch<Achievement[]>('/api/achievements/')

        if (res.success && Array.isArray(res.data)) {
          achievements.value = res.data
          usingSnapshot.value = false
          markSnapshotActive('achievements', false)
          persist()
          return achievements.value
        }

        throw new Error(res.message || 'Failed to fetch achievements')
      } catch (error) {
        handleError(error, 'fetching achievements')
        setLastError(error, 'Failed to fetch achievements')

        // Database unreachable and nothing loaded yet: fall back to the
        // nightly snapshot. fetchAchievements' cache guard checks
        // achievements.length, so snapshot rows must only land here (after a
        // failure), never before a fetch — and they are not persisted, so
        // the next page load still fetches live.
        if (achievements.value.length === 0) {
          const snapshotRows = await loadSnapshot<Achievement>('achievements')

          if (snapshotRows.length && achievements.value.length === 0) {
            achievements.value = snapshotRows
            usingSnapshot.value = true
            markSnapshotActive('achievements', true)
          }
        }

        return achievements.value
      } finally {
        loadingAchievements.value = false
        fetchAchievementsPromise.value = null
      }
    })()

    return fetchAchievementsPromise.value
  }

  async function fetchAchievementRecords(
    force = false,
  ): Promise<AchievementRecord[]> {
    if (!force && achievementRecords.value.length) return achievementRecords.value
    if (fetchRecordsPromise.value && !force) return fetchRecordsPromise.value

    fetchRecordsPromise.value = (async () => {
      try {
        loadingRecords.value = true
        lastError.value = null

        const res = await performFetch<AchievementRecord[]>(
          '/api/achievements/records',
        )

        if (res.success && Array.isArray(res.data)) {
          achievementRecords.value = res.data
          persist()
          return achievementRecords.value
        }

        throw new Error(res.message || 'Failed to fetch achievement records')
      } catch (error) {
        handleError(error, 'fetching achievement records')
        setLastError(error, 'Failed to fetch achievement records')
        return achievementRecords.value
      } finally {
        loadingRecords.value = false
        fetchRecordsPromise.value = null
      }
    })()

    return fetchRecordsPromise.value
  }

  async function initialize(
    options: AchievementInitializeOptions = {},
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
          await Promise.all([fetchAchievements(), fetchAchievementRecords()])
        }

        isInitialized.value = true

        if (options.migratePendingGuestAchievements) {
          await migratePendingGuestAchievements()
        }
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing achievementStore')
        setLastError(error, 'Failed to initialize achievement store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function migratePendingGuestAchievements() {
    if (userStore.isGuest || !isClient) return

    const pendingIds = safeParseArray<number>(
      safeGetLocalStorage(pendingGuestAchievementsStorageKey),
    ).filter((id) => Number.isInteger(id) && id > 0)

    if (!pendingIds.length) return

    for (const id of pendingIds) {
      await rewardAchievement(id)
    }

    pendingGuestAchievements.value = []
    safeRemoveLocalStorage(pendingGuestAchievementsStorageKey)
  }

  async function confirmAchievement(achievementId: number) {
    const id = Number(achievementId)

    if (!Number.isInteger(id) || id <= 0) {
      errorStore.report(
        'Valid achievement ID is required.',
        ErrorType.VALIDATION_ERROR,
        'confirming achievement',
      )

      return {
        success: false,
        message: 'Valid achievement ID is required.',
      }
    }

    if (userStore.isGuest) {
      deactivateAchievement(id)
      persist()

      return {
        success: true,
        message: 'Guest achievement dismissed locally.',
      }
    }

    const userId = Number(userStore.userId)

    const record = achievementRecords.value.find(
      (entry) =>
        Number(entry.userId) === userId && Number(entry.achievementId) === id,
    )

    deactivateAchievement(id)

    if (!record) {
      persist()

      return {
        success: true,
        message: 'Achievement dismissed locally. No record was found to confirm.',
      }
    }

    record.isConfirmed = true
    persist()

    try {
      await userStore.updateKarmaAndMana()

      const result = await updateAchievementRecord({
        id: record.id,
        isConfirmed: true,
      })

      if (!result.success) {
        errorStore.report(
          result.message ?? 'Achievement dismissed locally but failed to sync.',
          ErrorType.STORE_ERROR,
          'confirming achievement',
        )

        return {
          success: false,
          message:
            result.message ?? 'Achievement dismissed locally but failed to sync.',
        }
      }

      return {
        success: true,
        message: 'Achievement confirmed.',
      }
    } catch (error) {
      errorStore.report(
        error,
        ErrorType.INTERACTION_ERROR,
        `Failed to confirm achievement ${id}`,
      )

      return {
        success: false,
        message: errorStore.normalizeError(
          error,
          'Achievement dismissed locally but failed to sync.',
        ),
      }
    }
  }

  async function updateAchievement(achievement: Achievement) {
    if (!achievement.id) {
      return
    }

    try {
      const response = await performFetch<Achievement>(
        `/api/achievements/${achievement.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(achievement),
        },
      )

      if (response.success && response.data) {
        upsertAchievement(response.data)
        return
      }

      throw new Error(response.message || 'Failed to update achievement')
    } catch (error) {
      handleError(error, 'updating achievement')
      setLastError(error, 'Failed to update achievement')
    }
  }

  async function updateAchievementsFromData() {
    for (const updatedAchievement of achievementData) {
      const existingAchievement = achievements.value.find(
        (entry) => entry.id === updatedAchievement.id,
      )

      if (existingAchievement) {
        Object.assign(existingAchievement, updatedAchievement)
        await updateAchievement(existingAchievement)
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
          '/api/achievements/highClickScores',
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
          '/api/achievements/highMatchScores',
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

      const response = await performFetch('/api/achievements/updateClickRecord', {
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

      await performFetch('/api/achievements/updateMatchRecord', {
        method: 'PUT',
        body: JSON.stringify({ newScore, userId }),
      })

      await fetchHighMatchScores(true)
    } catch (error) {
      handleError(error, 'updating match record')
    }
  }

  async function updateAchievementRecord(
    record: Partial<AchievementRecord>,
  ): Promise<{ success: boolean; message?: string }> {
    if (!record.id) {
      return { success: false, message: 'Achievement record ID is required.' }
    }

    try {
      const response = await performFetch<AchievementRecord>(
        `/api/achievements/records/${record.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(record),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update achievement record')
      }

      upsertAchievementRecord(response.data)
      return { success: true }
    } catch (error) {
      const message = errorStore.report(
        error,
        ErrorType.STORE_ERROR,
        'updating achievement record',
        'Failed to update achievement record',
      )

      return { success: false, message }
    }
  }

  async function fetchAchievementById(
    achievementId: number,
  ): Promise<ApiResponse<Achievement>> {
    const existing = achievements.value.find((entry) => entry.id === achievementId)

    if (existing) {
      return {
        success: true,
        message: 'Achievement found locally',
        data: existing,
      }
    }

    try {
      const response = await performFetch<Achievement>(
        `/api/achievements/${achievementId}`,
      )

      if (response.success && response.data) {
        upsertAchievement(response.data)

        return {
          success: true,
          message: 'Achievement recovered',
          data: response.data,
        }
      }

      return {
        success: false,
        message: response.message || 'Achievement not found',
      }
    } catch (error) {
      handleError(error, 'fetching achievement by ID')
      return {
        success: false,
        message: 'Unknown error occurred while fetching achievement',
      }
    }
  }

  async function addAchievementRecord(record: Partial<AchievementRecord>) {
    try {
      const response = await performFetch<AchievementRecord>(
        '/api/achievements/records',
        {
          method: 'POST',
          body: JSON.stringify(record),
        },
      )

      if (response.success && response.data) {
        upsertAchievementRecord(response.data)
        return { success: true, message: 'Achievement recorded successfully.' }
      }

      throw new Error(response.message || 'Unknown error occurred')
    } catch (error) {
      handleError(error, 'adding achievement record')
      return { success: false, message: 'An error occurred' }
    }
  }

  async function recordAchievement(userId: number, achievementId: number) {
    if (userStore.isGuest) {
      return {
        success: true,
        message: 'Guest users cannot earn achievements.',
      }
    }

    if (hasAchievement(userId, achievementId)) {
      return {
        success: true,
        message: 'Achievement already recorded for this user.',
      }
    }

    try {
      return await addAchievementRecord({
        userId,
        achievementId,
        username: userStore.username,
      })
    } catch (error) {
      handleError(error, 'recording achievement')
      return {
        success: false,
        message: 'An error occurred while recording achievement',
      }
    }
  }

  async function rewardAchievement(achievementId: number) {
    if (rewardAchievementPromises.has(achievementId)) {
      return rewardAchievementPromises.get(achievementId)
    }

    const promise = (async () => {
      const userId = userStore.userId

      if (userStore.isGuest) {
        if (!isClient) return

        const current = safeParseArray<number>(
          safeGetLocalStorage(pendingGuestAchievementsStorageKey),
        ).filter((id) => Number.isInteger(id) && id > 0)

        if (!current.includes(achievementId)) {
          current.push(achievementId)
          safeSetLocalStorage(
            pendingGuestAchievementsStorageKey,
            JSON.stringify(current),
          )
        }

        pendingGuestAchievements.value = current
        return
      }

      if (!shouldRun()) return

      let achievement = achievements.value.find((entry) => entry.id === achievementId)

      if (!achievement) {
        const fetched = await fetchAchievementById(achievementId)

        if (!fetched.success || !fetched.data) {
          return
        }

        achievement = fetched.data
      }

      if (!hasAchievement(userId, achievementId)) {
        const result = await recordAchievement(userId, achievementId)

        if (!result.success) {
          return
        }
      }

      if (achievement && !achievement.isActive) {
        achievement.isActive = true
        persist()
      }

      // Meta achievement: "Jellybean Hunter" for earning 10 achievements. Only
      // fire from a non-hunter reward to avoid recursing into itself, and let
      // the hunter's own record/dedupe guards prevent repeats.
      if (
        slugify(achievement?.triggerCode ?? '') !== 'jellybean-hunter' &&
        achievementCountForUser.value >= 10
      ) {
        await rewardAchievementByCode('jellybean-hunter')
      }
    })()

    rewardAchievementPromises.set(achievementId, promise)

    try {
      await promise
    } finally {
      rewardAchievementPromises.delete(achievementId)
    }
  }

  // Trigger a achievement by its unique triggerCode instead of a magic numeric
  // id. Codes are canonical slugs (see utils/slugify), so call sites survive
  // reseeded databases where ids shift.
  async function rewardAchievementByCode(code: string) {
    const target = slugify(code)
    if (!target) return

    if (!achievements.value.length) {
      await fetchAchievements()
    }

    const achievement = achievements.value.find(
      (entry) => slugify(entry.triggerCode ?? '') === target,
    )

    if (!achievement) {
      console.warn(`[achievementStore] No achievement with triggerCode "${target}"`)
      return
    }

    return rewardAchievement(achievement.id)
  }

  async function clearAllAchievementRecords() {
    try {
      const response = await performFetch(`/api/achievements/records/clear/`, {
        method: 'DELETE',
      })

      if (response.success) {
        achievementRecords.value = []
        persist()
      }
    } catch (error) {
      handleError(error, 'clearing all achievement records')
    }
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchAchievementsPromise.value = null
    fetchRecordsPromise.value = null
    lastError.value = null
  }

  return {
    achievements,
    achievementRecords,
    usingSnapshot,
    activeAchievements,
    unconfirmedAchievements,
    achievementSummary,
    highClickScores,
    highMatchScores,
    isInitialized,
    isInitializing,
    loadingAchievements,
    loadingRecords,
    loadingScores,
    lastError,
    hasPendingGuestAchievements,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    fetchAchievements,
    fetchAchievementRecords,
    fetchAchievementById,
    updateAchievement,
    updateAchievementsFromData,
    deactivateAchievement,
    rewardAchievement,
    rewardAchievementByCode,
    migratePendingGuestAchievements,

    addAchievementRecord,
    confirmAchievement,
    updateAchievementRecord,
    recordAchievement,
    hasAchievement,
    clearAllAchievementRecords,
    achievementCountForUser,

    fetchHighClickScores,
    fetchHighMatchScores,
    updateMatchRecord,
    updateClickRecord,

    persist,
  }
})

export type { Achievement, AchievementRecord }
