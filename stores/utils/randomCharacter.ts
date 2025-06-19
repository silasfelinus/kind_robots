// /composables/useRandomCharacterData.ts
import { randomName } from './randomName'
import { randomHonorific } from './randomHonorific'
import { randomClass } from './randomClass'
import { randomGenre } from './randomGenre'
import { randomSpecies } from './randomSpecies'
import { randomBackstory } from './randomBackstory'
import { randomInventory } from './randomInventory'
import { randomQuirk } from './randomQuirks'
import { randomSkill } from './randomSkills'
import { useRandomStats } from './randomStats'
import { randomPersonality } from './randomPersonality'

export function useRandomCharacterData() {
  function generateRandomCharacter() {
    const generatedName = randomName()
    const generatedHonorific = randomHonorific()
    const generatedClass = randomClass()
    const generatedGenre = randomGenre()
    const generatedSpecies = randomSpecies()
    const generatedPersonality = randomPersonality()
    const generatedBackstory = randomBackstory()
    const generatedInventory = randomInventory()
    const generatedQuirks = randomQuirk()
    const generatedSkills = randomSkill()
    const generatedStats = useRandomStats().generateStats()

    return {
      name: generatedName,
      honorific: generatedHonorific,
      class: generatedClass,
      genre: generatedGenre,
      species: generatedSpecies,
      personality: generatedPersonality,
      backstory: generatedBackstory,
      inventory: generatedInventory,
      quirks: generatedQuirks,
      skills: generatedSkills,
      ...generatedStats,
    }
  }

  return {
    randomName,
    randomHonorific,
    randomClass,
    randomGenre,
    randomSpecies,
    randomPersonality,
    randomBackstory,
    randomInventory,
    randomQuirk,
    randomSkill,
    generateRandomCharacter,
  }
}
