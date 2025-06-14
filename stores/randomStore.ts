// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
      // Reroll
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

  return {
    supportedKeys,
    getRandom,
    randomSelections,
    toggleSelection,
    clearSelection,
    getAllSelections,
    pickRandomFromArray,
    clearAllSelections,
  }
})
