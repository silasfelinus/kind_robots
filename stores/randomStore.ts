// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'

import { useUserStore } from './userStore'
import { useArtStore } from './artStore'
import { handleError, performFetch } from './utils'

import type { Pitch } from '@prisma/client'
import { artListPresets } from '@/stores/seeds/artList'
import {
  getRandom,
  supportedKeys,
  getAllPresetLists,
  pitchToRandomListItem,
} from './helpers/randomHelper'
import type { RandomListItem } from './helpers/randomHelper'

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

function isRandomListPitch(p: Pitch): boolean {
  return (p as unknown as { PitchType?: unknown }).PitchType === 'RANDOMLIST'
}

function safeParseStringArray(value: unknown): string[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    )
  } catch {
    return []
  }
}

export const useRandomStore = defineStore('randomStore', () => {
  const userStore = useUserStore()
  const artStore = useArtStore()

  const randomSelections = ref<Record<string, string>>({})
  const randomLists = ref<Pitch[]>([])
  const presetLists = ref<RandomListItem[]>(getAllPresetLists(artListPresets))

  const filteredLists = computed<RandomListItem[]>(() => {
    const userLists = (
      Array.isArray(randomLists.value) ? randomLists.value : []
    )
      .filter((r: Pitch) => {
        const isOwner = r.userId === userStore.userId
        const isVisible = r.isPublic || isOwner
        const maturityOk = userStore.showMature || !r.isMature
        return isRandomListPitch(r) && isVisible && maturityOk
      })
      .map(pitchToRandomListItem)

    return [...presetLists.value, ...userLists]
  })

  function pickRandomFromArray(arr: string[], count: number): string[] {
    if (!Array.isArray(arr)) return []
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, arr.length))
  }

  function toggleSelection(key: string) {
    const result = getRandom(key, 1)[0]
    if (!result) return

    if (randomSelections.value[key] === result) {
      const next = getRandom(key, 1)[0]
      if (next) randomSelections.value[key] = next
      return
    }

    randomSelections.value[key] = result
  }

  function clearSelection(key: string) {
    delete randomSelections.value[key]
  }

  function clearAllSelections() {
    randomSelections.value = {}
  }

  function getAllSelections() {
    return randomSelections.value
  }

  function initialize() {
    onMounted(() => {
      const stored = localStorage.getItem('artRandomizerRandomSelections')
      if (stored) {
        try {
          randomSelections.value = JSON.parse(stored) as Record<string, string>
        } catch (error: unknown) {
          handleError(
            error,
            'Failed to parse randomSelections from localStorage',
          )
        }
      }

      watch(
        randomSelections,
        (val: Record<string, string>) => {
          try {
            localStorage.setItem(
              'artRandomizerRandomSelections',
              JSON.stringify(val),
            )
          } catch (error: unknown) {
            handleError(
              error,
              'Failed to save randomSelections to localStorage',
            )
          }
        },
        { deep: true },
      )
    })
  }

  async function fetchRandomLists() {
    const res = (await performFetch<Pitch[]>(
      '/api/pitch/randomlists',
    )) as PerformFetchResult<Pitch[]>

    if (res.success && res.data) {
      randomLists.value = res.data
      return
    }

    handleError(
      new Error(res.message || 'Failed to fetch random lists'),
      'fetching random lists',
    )
  }

  async function createList(title: string) {
    const body: Partial<Pitch> & Record<string, unknown> = {
      title,
      pitch: '[]',
      PitchType: 'RANDOMLIST',
      userId: userStore.userId,
      isPublic: true,
      isMature: false,
    }

    const res = (await performFetch<Pitch>('/api/pitch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Pitch>

    if (res.success && res.data) {
      randomLists.value.push(res.data)
      return
    }

    handleError(
      new Error(res.message || 'Failed to create list'),
      'creating list',
    )
  }

  async function updateList(pitch: Pitch) {
    const res = (await performFetch<Pitch>(`/api/pitch/${pitch.id}`, {
      method: 'PATCH',
      body: JSON.stringify(pitch),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Pitch>

    if (res.success && res.data) {
      const idx = randomLists.value.findIndex(
        (r: Pitch) => r.id === res.data?.id,
      )
      if (idx !== -1) randomLists.value[idx] = res.data
      return
    }

    handleError(
      new Error(res.message || 'Failed to update list'),
      'updating list',
    )
  }

  async function updateListItem(list: RandomListItem) {
    if (list.source !== 'user') return

    const body: Partial<Pitch> & Record<string, unknown> = {
      id: list.id,
      title: list.title,
      PitchType: 'RANDOMLIST',
      userId: list.userId ?? userStore.userId,
      isPublic: list.isPublic,
      isMature: list.isMature,
      pitch: list.examplesJson,
    }

    await updateList(body as Pitch)
  }

  async function deleteList(id: number) {
    const res = (await performFetch(`/api/pitch/${id}`, {
      method: 'DELETE',
    })) as PerformFetchResult<unknown>

    if (res.success) {
      randomLists.value = randomLists.value.filter((r: Pitch) => r.id !== id)
      return
    }

    handleError(
      new Error(res.message || 'Failed to delete list'),
      'deleting list',
    )
  }

  async function generateListItems(id: number) {
    const res = (await performFetch<Pitch>(`/api/pitch/${id}/generate-items`, {
      method: 'POST',
    })) as PerformFetchResult<Pitch>

    if (res.success && res.data) {
      const idx = randomLists.value.findIndex(
        (r: Pitch) => r.id === res.data?.id,
      )
      if (idx !== -1) randomLists.value[idx] = res.data
      return
    }

    handleError(
      new Error(res.message || 'Failed to generate list items'),
      'generating list items',
    )
  }

  function resetAll() {
    Object.keys(artStore.artListSelections).forEach((key: string) => {
      artStore.updateArtListSelection(key, [])
    })
    clearAllSelections()
  }

  function applyMakePretty() {
    const pretty = artListPresets.find((p) => p.id === '__pretty__')
    const negative = artListPresets.find((p) => p.id === '__negative__')

    if (pretty) {
      artStore.updateArtListSelection(
        '__pretty__',
        pickRandomFromArray(pretty.content, 4),
      )
    }

    if (negative) {
      artStore.updateArtListSelection(
        '__negative__',
        pickRandomFromArray(negative.content, 4),
      )
    }
  }

  function applySurprise() {
    for (const entry of artListPresets) {
      const values = entry.allowMultiple
        ? pickRandomFromArray(
            entry.content,
            Math.ceil(Math.random() * entry.content.length),
          )
        : pickRandomFromArray(entry.content, 1)

      artStore.updateArtListSelection(entry.id, values)
    }
  }

  function getExamplesForList(list: RandomListItem): string[] {
    return safeParseStringArray(list.examplesJson)
  }

  function setExamplesForList(list: RandomListItem, values: string[]) {
    const cleaned = Array.isArray(values)
      ? values.filter((v) => typeof v === 'string' && v.trim().length > 0)
      : []
    list.examplesJson = JSON.stringify(cleaned)
  }

  return {
    initialize,

    // Random single selection helpers
    getRandom,
    supportedKeys,
    pickRandomFromArray,
    toggleSelection,
    clearSelection,
    clearAllSelections,
    getAllSelections,
    randomSelections,

    // Preset + user lists
    presetLists,
    randomLists,
    filteredLists,

    // Remote random list handling
    fetchRandomLists,
    createList,
    updateList,
    updateListItem,
    deleteList,
    generateListItems,

    // Commands
    resetAll,
    applyMakePretty,
    applySurprise,

    // Convenience for components
    getExamplesForList,
    setExamplesForList,
  }
})
