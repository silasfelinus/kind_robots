import { useRandomName } from './useRandomName'
import { useRandomHonorific } from './useRandomHonorific'
import { useRandomClass } from './useRandomClass'
import { useRandomGenre } from './useRandomGenre'
import { useRandomSpecies } from './useRandomSpecies'
import { useRandomBackstory } from './useRandomBackstory'
import { useRandomInventory } from './useRandomInventory'
import { useRandomQuirk } from './useRandomQuirks'
import { useRandomSkill } from './useRandomSkills'
import { useRandomStats } from './useRandomStats'

export function useRandomCharacterData() {
  // Import random generators from individual composables
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

  // Generate a complete random character
  function generateRandomCharacter() {
    return {
      name: randomName(),
      honorific: randomHonorific(),
      class: randomClass(),
      genre: randomGenre(),
      species: randomSpecies(),
      backstory: randomBackstory(),
      inventory: randomInventory(),
      quirks: randomQuirk(),
      skills: randomSkill(),
      ...generateStats(), // Include stats as flat fields
    }
  }

  return { generateRandomCharacter }
}
