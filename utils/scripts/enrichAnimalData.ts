// /scripts/enrichAnimalData.ts

import { animalDataList } from '@/stores/utils/animalData'
import fs from 'fs'
import path from 'path'

function getWikiUrl(name: string): string {
  const baseName = name.replace(/\s+/g, '_').replace(/[’']/g, '')
  return `https://en.wikipedia.org/wiki/${baseName}`
}

function getFallbackImageUrl(name: string): string {
  const query = encodeURIComponent(`${name} animal`)
  return `https://www.google.com/search?tbm=isch&q=${query}`
}

function inferFallbackTraits(name: string): Partial<AnimalData['traits']> {
  const lower = name.toLowerCase()
  const traits: Partial<AnimalData['traits']> = {
    legs: 4,
    eyes: 2,
    wings: 0,
    antennae: 0,
    tail: true,
  }

  if (lower.includes('fish') || lower.includes('shark') || lower.includes('whale') || lower.includes('ray')) {
    traits.environment = 'water'
    traits.bodyType = 'serpentine'
  } else if (lower.includes('crab') || lower.includes('shrimp') || lower.includes('clam')) {
    traits.environment = 'water'
    traits.bodyType = 'crustacean'
    traits.legs = 6
  } else if (lower.includes('bird') || lower.includes('eagle') || lower.includes('penguin') || lower.includes('owl') || lower.includes('booby') || lower.includes('puffin') || lower.includes('loon')) {
    traits.environment = 'air'
    traits.hasFeathers = true
    traits.bodyType = 'winged'
    traits.wings = 2
    traits.legs = 2
  } else if (lower.includes('lizard') || lower.includes('gecko') || lower.includes('dragon') || lower.includes('iguana')) {
    traits.environment = 'land'
    traits.texture = 'scaly'
    traits.bodyType = 'quadruped'
  } else if (lower.includes('insect') || lower.includes('ant') || lower.includes('mantis') || lower.includes('worm') || lower.includes('beetle') || lower.includes('fly') || lower.includes('bug') || lower.includes('glowworm')) {
    traits.environment = 'land'
    traits.legs = 6
    traits.antennae = 2
    traits.bodyType = 'other'
  } else if (lower.includes('jellyfish') || lower.includes('sea cucumber') || lower.includes('starfish')) {
    traits.environment = 'water'
    traits.bodyType = 'amorphous'
    traits.legs = 0
  } else if (lower.includes('bat') || lower.includes('fly') || lower.includes('bee')) {
    traits.environment = 'air'
    traits.wings = 2
    traits.bodyType = 'winged'
  } else {
    traits.environment = 'land'
    traits.bodyType = 'quadruped'
  }

  // General rules
  if (!traits.size) {
    if (lower.includes('whale') || lower.includes('elephant') || lower.includes('giraffe')) {
      traits.size = 'giant'
    } else if (lower.includes('shrew') || lower.includes('mouse') || lower.includes('ant')) {
      traits.size = 'tiny'
    } else if (lower.includes('fox') || lower.includes('otter') || lower.includes('bird')) {
      traits.size = 'small'
    } else {
      traits.size = 'medium'
    }
  }

  return traits
}

const enrichedAnimalDataList = animalDataList.map((entry) => {
  return {
    ...entry,
    wikiUrl: entry.wikiUrl || getWikiUrl(entry.scientificName || entry.name),
    imageUrl: entry.imageUrl || getFallbackImageUrl(entry.name),
    traits: {
      ...inferFallbackTraits(entry.name),
      ...entry.traits, // keep existing traits
    },
  }
})

const outputPath = path.resolve('./enrichedAnimalData.ts')

fs.writeFileSync(
  outputPath,
  `// Auto-generated enriched animal data\n\nexport const enrichedAnimalDataList = ${JSON.stringify(enrichedAnimalDataList, null, 2)};\n`
)

console.log(`✅ Enriched animal data written to ${outputPath}`)
