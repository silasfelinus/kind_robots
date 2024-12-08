import { useRandomName } from './useRandomName'
import { useRandomHonorific } from './useRandomHonorific'
import { useRandomClass } from './useRandomClass'
import { useRandomGenre } from './useRandomGenre'
import { useRandomBackstory } from './useRandomBackstory'
import { useRandomInventory } from './useRandomInventory'
import { useRandomQuirks } from './useRandomQuirks'
import { useRandomSkills } from './useRandomSkills'
import { useRandomStats } from './useRandomStats'

export function useRandomCharacterData() {
  // Import random generators from individual composables
  const { randomName } = useRandomName()
  const { randomHonorific } = useRandomHonorific()
  const { randomClass } = useRandomClass()
  const { randomGenre } = useRandomGenre()
  const { randomBackstory } = useRandomBackstory()
  const { randomInventory } = useRandomInventory()
  const { randomQuirk } = useRandomQuirks()
  const { randomSkills } = useRandomSkills()
  const { generateStats } = useRandomStats()

  // Generate a complete random character
  function generateRandomCharacter() {
    return {
      name: randomName(),
      honorific: randomHonorific(),
      class: randomClass(),
      genre: randomGenre(),
      backstory: randomBackstory(),
      inventory: randomInventory(),
      quirks: randomQuirk(),
      skills: randomSkills(),
      ...generateStats(), // Include stats as flat fields
    }
  }

  return { generateRandomCharacter }
}
