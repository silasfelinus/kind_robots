import { animalList } from './randomAnimal'

// Base fantasy species
export const fantasySpecies = [
  'Elf',
  'Dwarf',
  'Orc',
  'Dragonborn',
  'Halfling',
  'Tiefling',
  'Gnome',
  'Goblin',
  'Troll',
  'Fairy',
  'Merfolk',
  'Centaur',
  'Minotaur',
  'Dryad',
  'Nymph',
  'Vampire',
  'Werewolf',
  'Phoenix',
  'Griffin',
  'Chimera',
  'Unicorn',
  'Pegasus',
  'Kraken',
  'Djinn',
  'Elemental',
  'Cyclops',
  'Siren',
  'Harpy',
  'Lich',
  'Wraith',
  'Demon',
  'Angel',
  'Shadowkin',
  'Kobold',
  'Satyr',
  'Kitsune',
  'Tengu',
  'Slime',
  'Voidwalker',
  'Eidolon',
  'Celestial',
  'Nightmare',
  'Ghoul',
  'Zombie',
  'Skeleton Warrior',
  'Changeling',
  'Beastfolk',
  'Lizardfolk',
  'Insectoid',
  'Plantkin',
  'Flamekin',
  'Voidspawn',
  'Starborn',
  'Astrokin',
  'Timewalker',
]

// Sci-fi species
export const sciFiSpecies = [
  'Android',
  'Cyborg',
  'Martian',
  'Venusian',
  'Jovian',
  'Xenomorph',
  'Kryptonian',
  'Zorgon',
  'Tralfamadorian',
  'Dalek',
  'Time Lord',
  'Mutant',
  'Replicant',
  'Mechanoid',
  'Plasmorph',
  'Nanobot Swarm',
  'Synthetic',
  'Clone',
  'Genetically Modified Human',
  'Space Elf',
  'Galactic Trader',
  'Void Wanderer',
  'Starseed',
  'Gravimancer',
  'Astral Warden',
  'Black Hole Entity',
  'AI Overlord',
  'Quantum Being',
  'Singularity Entity',
  'Bioengineered Beast',
  'Moonfolk',
  'Cosmic Horror',
  'Sentient Gas Cloud',
  'Energy Being',
  'Artificial Intelligence Avatar',
]

// Cartoon/Absurd species
export const cartoonSpecies = [
  'Toon',
  'Talking Dog',
  'Anthropomorphic Duck',
  'Sentient Sponge',
  'Living Broomstick',
  'Walking Teapot',
  'Dancing Cactus',
  'Cartoon Villain',
  'Rubber Hose Character',
  'Superpowered Hamster',
  'Talking Fish',
  'Invisible Manatee',
  'Pirate Parrot',
  'Banana Person',
  'Candyfolk',
  'Living Marshmallow',
  'Sentient Pizza',
  'Shadow Clown',
  'Mime Monster',
  'Cloud Person',
  'Floating Eye',
  'Shape-Shifting Blob',
  'Living Skeleton',
  'Zombie Cat',
  'Magic Carpet',
  'Haunted Doll',
  'Giant Baby',
  'Robot Chicken',
  'Living Pumpkin',
  'Sentient Flowerpot',
  'Talking Vacuum Cleaner',
]

const hybridTypes = [
  'kin',
  '-folk',
  'beast',
  'spawn',
  'ling',
  'walker',
  'morph',
]

// Generates one hybrid species using a provided animal and base species
function hybridSpecies(animal: string, base: string): string {
  const suffix = hybridTypes[Math.floor(Math.random() * hybridTypes.length)]
  return `${animal.charAt(0).toUpperCase() + animal.slice(1)}-${base}${suffix}`
}

// ⚙️ Build a long static species list at module scope
export const speciesList: string[] = (() => {
  const baseSpecies = [...fantasySpecies, ...sciFiSpecies, ...cartoonSpecies]
  const hybrids: string[] = []
  const animals = [...animalList]

  // Add 100 random animals
  for (let i = 0; i < 100; i++) {
    const index = Math.floor(Math.random() * animals.length)
    baseSpecies.push(animals[index])
  }

  // Add 100 hybrid species
  for (let i = 0; i < 100; i++) {
    const base = baseSpecies[Math.floor(Math.random() * baseSpecies.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]
    hybrids.push(hybridSpecies(animal, base))
  }

  return shuffle([...baseSpecies, ...hybrids])
})()

function shuffle(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function randomSpecies(): string {
  return speciesList[Math.floor(Math.random() * speciesList.length)]
}
