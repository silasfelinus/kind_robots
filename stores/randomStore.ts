// /stores/randomStore.ts
import { defineStore } from 'pinia'
import { computed } from 'vue'

// 🔌 Import all random utility generators
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

type RandomSource = () => string[]

export const useRandomStore = defineStore('randomStore', () => {
  const sources: Record<string, RandomSource> = {
    adjective: useRandomAdjective,
    animal: useRandomAnimal,
    backstory: useRandomBackstory,
    class: useRandomClass,
    color: useRandomColor,
    genre: useRandomGenre,
    honorific: useRandomHonorific,
    inventory: useRandomInventory,
    item: useRandomItem,
    material: useRandomMaterial,
    name: useRandomName,
    noun: useRandomNoun,
    personality: useRandomPersonality,
    quirk: useRandomQuirk,
    skill: useRandomSkill,
    species: useRandomSpecies,
    verb: useRandomVerb,
  }

  const supportedKeys = computed(() => Object.keys(sources))

  function getRandom(key: string, count = 1): string[] {
    const source = sources[key]
    if (!source) return []
    const list = source()
    if (!list.length) return []

    const result: string[] = []
    for (let i = 0; i < count; i++) {
      result.push(list[Math.floor(Math.random() * list.length)])
    }

    return result
  }

  return {
    supportedKeys,
    getRandom,
  }
})
