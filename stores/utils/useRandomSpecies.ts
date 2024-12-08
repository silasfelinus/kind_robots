import { useRandomAnimal } from './useRandomAnimal'

export function useRandomSpecies() {
  const { randomAnimal } = useRandomAnimal()

  // Base fantasy species
  const fantasySpecies = [
    'Elf', 'Dwarf', 'Orc', 'Dragonborn', 'Halfling', 'Tiefling', 'Gnome',
    'Goblin', 'Troll', 'Fairy', 'Merfolk', 'Centaur', 'Minotaur', 'Dryad',
    'Nymph', 'Vampire', 'Werewolf', 'Phoenix', 'Griffin', 'Chimera',
    'Unicorn', 'Pegasus', 'Kraken', 'Djinn', 'Elemental', 'Cyclops',
    'Siren', 'Harpy', 'Lich', 'Wraith', 'Demon', 'Angel', 'Shadowkin',
    'Kobold', 'Satyr', 'Kitsune', 'Tengu', 'Slime', 'Voidwalker', 'Eidolon',
    'Celestial', 'Nightmare', 'Ghoul', 'Zombie', 'Skeleton Warrior',
    'Changeling', 'Beastfolk', 'Lizardfolk', 'Insectoid', 'Plantkin',
    'Flamekin', 'Voidspawn', 'Starborn', 'Astrokin', 'Timewalker',
  ]

  // Sci-fi species
  const sciFiSpecies = [
    'Android', 'Cyborg', 'Martian', 'Venusian', 'Jovian', 'Xenomorph',
    'Kryptonian', 'Zorgon', 'Tralfamadorian', 'Dalek', 'Time Lord',
    'Mutant', 'Replicant', 'Mechanoid', 'Plasmorph', 'Nanobot Swarm',
    'Synthetic', 'Clone', 'Genetically Modified Human', 'Space Elf',
    'Galactic Trader', 'Void Wanderer', 'Starseed', 'Gravimancer',
    'Astral Warden', 'Black Hole Entity', 'AI Overlord', 'Quantum Being',
    'Singularity Entity', 'Bioengineered Beast', 'Moonfolk', 'Cosmic Horror',
    'Sentient Gas Cloud', 'Energy Being', 'Artificial Intelligence Avatar',
  ]

  // Cartoon/Absurd species
  const cartoonSpecies = [
    'Toon', 'Talking Dog', 'Anthropomorphic Duck', 'Sentient Sponge',
    'Living Broomstick', 'Walking Teapot', 'Dancing Cactus', 'Cartoon Villain',
    'Rubber Hose Character', 'Superpowered Hamster', 'Talking Fish',
    'Invisible Manatee', 'Pirate Parrot', 'Banana Person', 'Candyfolk',
    'Living Marshmallow', 'Sentient Pizza', 'Shadow Clown', 'Mime Monster',
    'Cloud Person', 'Floating Eye', 'Shape-Shifting Blob', 'Living Skeleton',
    'Zombie Cat', 'Magic Carpet', 'Haunted Doll', 'Giant Baby', 'Robot Chicken',
    'Living Pumpkin', 'Sentient Flowerpot', 'Talking Vacuum Cleaner',
  ]

  // Generate random hybrid species using randomAnimal
  function generateHybridSpecies() {
    const animal = randomAnimal()
    const base = [
      ...fantasySpecies,
      ...sciFiSpecies,
      ...cartoonSpecies,
    ][Math.floor(Math.random() * (fantasySpecies.length + sciFiSpecies.length + cartoonSpecies.length))]
    const hybridTypes = ['kin', '-folk', 'beast', 'spawn', 'ling', 'walker', 'morph']
    const suffix = hybridTypes[Math.floor(Math.random() * hybridTypes.length)]
    return `${animal.charAt(0).toUpperCase() + animal.slice(1)}-${base}${suffix}`
  }

  // Build the full species list
  const speciesList = [
    ...fantasySpecies,
    ...sciFiSpecies,
    ...cartoonSpecies,
    ...Array(100).fill(0).map(() => randomAnimal()), // Add 100 random animals
    ...Array(100).fill(0).map(() => generateHybridSpecies()), // Add 100 hybrids
  ]

  // Shuffle the list to ensure randomness
  function shuffle(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  // Get a random species from the list
  function randomSpecies(): string {
    return speciesList[Math.floor(Math.random() * speciesList.length)]
  }

  return { randomSpecies, speciesList: shuffle(speciesList) }
}
