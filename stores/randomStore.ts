// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import { useUserStore } from './userStore'
import { useArtStore } from './artStore'
import { handleError, performFetch } from './utils'
import type { Pitch } from '@prisma/client'
import { artListPresets, negativeList } from '@/stores/seeds/artList'

// Local single-value randomizers
import { useRandomAdjective } from '@/stores/utils/randomAdjective'
import { useRandomAnimal } from '@/stores/utils/randomAnimal'
import { useRandomBackstory } from '@/stores/utils/randomBackstory'
import { useRandomClass } from '@/stores/utils/randomClass'
import { useRandomColor } from '@/stores/utils/randomColor'
import { useRandomGenre } from '@/stores/utils/randomGenre'
import { useRandomHonorific } from '@/stores/utils/randomHonorific'
import { useRandomInventory } from '@/stores/utils/randomInventory'
import { useRandomItem } from '@/stores/utils/randomItem'
import { useRandomMaterial } from '@/stores/utils/randomMaterial'
import { useRandomName } from '@/stores/utils/randomName'
import { useRandomNoun } from '@/stores/utils/randomNoun'
import { useRandomPersonality } from '@/stores/utils/randomPersonality'
import { useRandomQuirk } from '@/stores/utils/randomQuirks'
import { useRandomSkill } from '@/stores/utils/randomSkills'
import { useRandomSpecies } from '@/stores/utils/randomSpecies'
import { useRandomVerb } from '@/stores/utils/randomVerb'
import { useRandomEncounter } from '@/stores/utils/randomEncounter'

type SingleSource = () => string

export const useRandomStore = defineStore('randomStore', () => {
  const userStore = useUserStore()
  const artStore = useArtStore()

  const singleValueSources: Record<string, SingleSource> = {
    adjective: () => useRandomAdjective().randomAdjective(),
    animal: () => useRandomAnimal().randomAnimal(),
    backstory: () => useRandomBackstory().randomBackstory(),
    class: () => useRandomClass().randomClass(),
    color: () => useRandomColor().randomColor(),
    genre: () => useRandomGenre().randomGenre(),
    honorific: () => useRandomHonorific().randomHonorific(),
    inventory: () => useRandomInventory().randomInventory(),
    item: () => useRandomItem().randomItem(),
    material: () => useRandomMaterial().randomMaterial(),
    name: () => useRandomName().randomName(),
    noun: () => useRandomNoun().randomNoun(),
    personality: () => useRandomPersonality().randomPersonality(),
    quirk: () => useRandomQuirk().randomQuirk(),
    skill: () => useRandomSkill().randomSkill(),
    species: () => useRandomSpecies().randomSpecies(),
    verb: () => useRandomVerb().randomVerb(),
    encounter: () => useRandomEncounter().message,
  }

  const supportedKeys = computed(() => Object.keys(singleValueSources))

  function getRandom(key: string, count = 1): string[] {
    const source = singleValueSources[key]
    if (!source) return []
    return Array.from({ length: count }, () => source())
  }

  function pickRandomFromArray(arr: string[], count: number): string[] {
    if (!Array.isArray(arr)) return []
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, arr.length))
  }

  const randomSelections = ref<Record<string, string>>({})

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

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('artRandomizerRandomSelections')
    if (stored) {
      try {
        randomSelections.value = JSON.parse(stored)
      } catch {}
    }

    watch(
      randomSelections,
      (val) => {
        localStorage.setItem(
          'artRandomizerRandomSelections',
          JSON.stringify(val),
        )
      },
      { deep: true },
    )
  }

  // 🔹 RANDOMLIST Pitch database handling
  const randomLists = ref<Pitch[]>([])

  const filteredLists = computed(() =>
    randomLists.value.filter((r) => {
      const isOwner = r.userId === userStore.userId
      const isVisible = r.isPublic || isOwner
      const maturityOk = userStore.showMature || !r.isMature
      return r.PitchType === 'RANDOMLIST' && isVisible && maturityOk
    }),
  )

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

  // 🔸 ART RANDOMIZATION METHODS

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
    // Local generators
    supportedKeys,
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
