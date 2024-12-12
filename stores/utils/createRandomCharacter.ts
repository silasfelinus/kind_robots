// /composables/useRandomCharacterData.ts
import { randomName } from './randomName'
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
    const generatedStats = generateStats()

    console.log('Generated Name:', generatedName)
    console.log('Generated Honorific:', generatedHonorific)
    console.log('Generated Class:', generatedClass)
    console.log('Generated Genre:', generatedGenre)
    console.log('Generated Species:', generatedSpecies)
    console.log('Generated Personality:', generatedPersonality)
    console.log('Generated Backstory:', generatedBackstory)
    console.log('Generated Inventory:', generatedInventory)
    console.log('Generated Quirks:', generatedQuirks)
    console.log('Generated Skills:', generatedSkills)
    console.log('Generated Stats:', generatedStats)

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
    generateStats,
    generateRandomCharacter,
  }
}
