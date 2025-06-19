// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import { useUserStore } from './userStore'
import { useArtStore } from './artStore'
import { handleError, performFetch } from './utils'
import type { Pitch } from '@prisma/client'
import { artListPresets } from '@/stores/seeds/artList'
import {
  getAllPresetPitches,
  getRandom,
  supportedKeys,
} from './helpers/randomHelper'

export const useRandomStore = defineStore('randomStore', () => {
  const userStore = useUserStore()
  const artStore = useArtStore()

  const randomSelections = ref<Record<string, string>>({})
  const presetLists = getAllPresetPitches(artListPresets)
  const randomLists = ref<Pitch[]>([])

  const filteredLists = computed(() => {
    const userLists = Array.isArray(randomLists.value)
      ? randomLists.value.filter((r) => {
          const isOwner = r.userId === userStore.userId
          const isVisible = r.isPublic || isOwner
          const maturityOk = userStore.showMature || !r.isMature
          return r.PitchType === 'RANDOMLIST' && isVisible && maturityOk
        })
      : []

    return [...presetLists, ...userLists]
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
      randomSelections.value[key] = getRandom(key, 1)[0]
    } else {
      randomSelections.value[key] = result
    }
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
    if (!process.client) return

    const stored = localStorage.getItem('artRandomizerRandomSelections')
    if (stored) {
      try {
        randomSelections.value = JSON.parse(stored)
      } catch {
        // ignore malformed JSON
      }
    }

    watch(
      randomSelections,
      (val) => {
        localStorage.setItem(
          'artRandomizerRandomSelections',
          JSON.stringify(val),
        )
      },
      { deep: true }
    )
  }

  async function fetchRandomLists() {
    const { data, success, message } = await performFetch<Pitch[]>(
      '/api/pitch/randomlists',
    )
    if (success && data) {
      randomLists.value = data
    } else {
      handleError(new Error(message), 'fetching random lists')
    }
  }

  async function createList(title: string) {
    const body = {
      title,
      pitch: '',
      PitchType: 'RANDOMLIST',
      userId: userStore.userId,
      isPublic: true,
      isMature: false,
    }
    const { data, success, message } = await performFetch<Pitch>('/api/pitch', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    if (success && data) {
      randomLists.value.push(data)
    } else {
      handleError(new Error(message), 'creating list')
    }
  }

  async function updateList(pitch: Pitch) {
    const { data, success, message } = await performFetch<Pitch>(
      `/api/pitch/${pitch.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(pitch),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    if (success && data) {
      const i = randomLists.value.findIndex((r) => r.id === data.id)
      if (i !== -1) randomLists.value[i] = data
    } else {
      handleError(new Error(message), 'updating list')
    }
  }

  async function deleteList(id: number) {
    const { success, message } = await performFetch(`/api/pitch/${id}`, {
      method: 'DELETE',
    })
    if (success) {
      randomLists.value = randomLists.value.filter((r) => r.id !== id)
    } else {
      handleError(new Error(message), 'deleting list')
    }
  }

  async function generateListItems(id: number) {
    const { data, success, message } = await performFetch<Pitch>(
      `/api/pitch/${id}/generate-items`,
      {
        method: 'POST',
      },
    )
    if (success && data) {
      const i = randomLists.value.findIndex((r) => r.id === data.id)
      if (i !== -1) randomLists.value[i] = data
    } else {
      handleError(new Error(message), 'generating list items')
    }
  }

  function resetAll() {
    Object.keys(artStore.artListSelections).forEach((key) => {
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

  return {
    initialize,
    getRandom,
    pickRandomFromArray,
    toggleSelection,
    clearSelection,
    clearAllSelections,
    getAllSelections,
    randomSelections,

    // Centralized commands
    resetAll,
    applyMakePretty,
    applySurprise,
    supportedKeys,

    // Remote random list handling
    randomLists,
    filteredLists,
    fetchRandomLists,
    createList,
    updateList,
    deleteList,
    generateListItems,
  }
})
