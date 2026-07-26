// /stores/dailyDreamStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { handleError, performFetch } from '@/stores/utils'
import type { DreamWithRelations } from '@/stores/dreamStore'

export type DailyDreamBlueprint = {
  title: string
  pitch: string
  characters: Array<{
    name: string
    species: string
    characterClass: string
    alignment: string
  }>
  rewards: Array<{
    name: string
    rarity: string
  }>
}

export type DailyDreamRequest = {
  dateKey: string
  characterCount: number
  rewardCount: number
  isPublic: boolean
  isMature: boolean
}

export type DailyDreamResponse = {
  dream: DreamWithRelations
  blueprint: DailyDreamBlueprint
  reused: boolean
}

export type DailyDreamResult = {
  success: boolean
  data?: DailyDreamResponse
  message?: string
}

export const useDailyDreamStore = defineStore('dailyDreamStore', () => {
  const isCreating = ref(false)
  const error = ref<string | null>(null)
  const lastBlueprint = ref<DailyDreamBlueprint | null>(null)
  const lastDream = ref<DreamWithRelations | null>(null)
  const lastReused = ref(false)

  async function createDailyDream(
    request: DailyDreamRequest,
  ): Promise<DailyDreamResult> {
    isCreating.value = true
    error.value = null

    try {
      const response = await performFetch<DailyDreamResponse>('/api/dreams/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Daily Dream could not be created.')
      }

      lastBlueprint.value = response.data.blueprint
      lastDream.value = response.data.dream
      lastReused.value = response.data.reused

      return {
        success: true,
        data: response.data,
        message: response.message || 'Daily Dream ready.',
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Daily Dream could not be created.'
      error.value = message
      handleError(cause, 'creating daily Facet Dream')
      return { success: false, message }
    } finally {
      isCreating.value = false
    }
  }

  function clearDailyDream(): void {
    error.value = null
    lastBlueprint.value = null
    lastDream.value = null
    lastReused.value = false
  }

  return {
    isCreating,
    error,
    lastBlueprint,
    lastDream,
    lastReused,
    createDailyDream,
    clearDailyDream,
  }
})
