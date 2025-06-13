// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { computed } from 'vue'

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

  return {
    supportedKeys,
    getRandom,
  }
})
