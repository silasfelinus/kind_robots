// /composables/useRandomCharacterData.ts
import { useRandomName } from './randomName'
import { useRandomHonorific } from './randomHonorific'
import { useRandomClass } from './randomClass'
import { useRandomGenre } from './randomGenre'
import { useRandomSpecies } from './randomSpecies'
import { useRandomBackstory } from './randomBackstory'
import { useRandomInventory } from './randomInventory'
import { useRandomQuirk } from './randomQuirks'
import { useRandomSkill } from './randomSkills'
import { useRandomStats } from './randomStats'
import { useRandomPersonality } from './randomPersonality'

export function useRandomCharacterData() {
  const { randomName } = useRandomName()
  const { randomHonorific } = useRandomHonorific()
  const { randomClass } = useRandomClass()
  const { randomGenre } = useRandomGenre()
  const { randomSpecies } = useRandomSpecies()
  const { randomBackstory } = useRandomBackstory()
  const { randomInventory } = useRandomInventory()
  const { randomQuirk } = useRandomQuirk()
  const { randomSkill } = useRandomSkill()
  const { generateStats } = useRandomStats()
  const { randomPersonality } = useRandomPersonality()

  function generateRandomCharacter() {
    return {
      name: randomName(),
      honorific: randomHonorific(),
      class: randomClass(),
      genre: randomGenre(),
      species: randomSpecies(),
      personality: randomPersonality(), // Add personality here
      backstory: randomBackstory(),
      inventory: randomInventory(),
      quirks: randomQuirk(),
      skills: randomSkill(),
      ...generateStats(),
    }
  }

  return { generateRandomCharacter }
}
