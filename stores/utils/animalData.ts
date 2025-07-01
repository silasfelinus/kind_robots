// /stores/utils/animalData.ts

export type AnimalData = {
  name: string
  scientificName?: string
  category?: 'real' | 'mythological' | 'alien'
  icon?: string
  description?: string
  wikiUrl?: string
  imageUrl?: string
  traits: {
    hasHair?: boolean
    hasFeathers?: boolean
    laysEggs?: boolean
    environment?: 'land' | 'water' | 'air' | 'amphibious' | 'space' | 'void'
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant'
    texture?:
      | 'scaly'
      | 'furry'
      | 'smooth'
      | 'spiky'
      | 'armored'
      | 'crystalline'
      | 'undefined'
    bodyType?:
      | 'quadruped'
      | 'biped'
      | 'serpentine'
      | 'winged'
      | 'tentacled'
      | 'crustacean'
      | 'amorphous'
      | 'other'
    legs?: number
    wings?: number
    eyes?: number
    antennae?: number
    tail?: boolean
  }
}

// Central list (eventually enriched with icon/imageId/description/title)
export const animalDataList: AnimalData[] = [
  {
    name: 'Sloth',
    scientificName: 'Bradypus variegatus',
    category: 'real',
    icon: '🦥',
    description:
      'A slow-moving, tree-dwelling mammal with long claws and shaggy fur.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Sloth',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/Bradypus_variegatus_from_Costa_Rica.jpg',
    traits: {
      hasHair: true,
      laysEggs: false,
      environment: 'land',
      size: 'medium',
      texture: 'furry',
      bodyType: 'quadruped',
      legs: 4,
      wings: 0,
      eyes: 2,
      antennae: 0,
      tail: true,
    },
  },
  {
    name: 'Water Bear',
    scientificName: 'Hypsibius dujardini',
    category: 'real',
    icon: '🧸',
    description:
      'A microscopic, water-dwelling invertebrate with eight stubby legs and extreme resilience.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Tardigrade',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/0/00/Hys_dujardini_1.jpg',
    traits: {
      hasHair: false,
      hasFeathers: false,
      laysEggs: true,
      environment: 'water',
      size: 'tiny',
      texture: 'smooth',
      bodyType: 'other',
      legs: 8,
      wings: 0,
      eyes: 2,
      antennae: 0,
      tail: false,
    },
  },
  {
    name: 'Axolotl',
    scientificName: 'Ambystoma mexicanum',
    category: 'real',
    icon: '🦎',
    description:
      'A smiling aquatic salamander with feathery gills that never grows up.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Axolotl',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/6/69/Ambystoma_mexicanum_02.jpg',
    traits: {
      laysEggs: true,
      environment: 'water',
      size: 'small',
      texture: 'smooth',
      bodyType: 'quadruped',
      legs: 4,
      wings: 0,
      eyes: 2,
      antennae: 0,
      tail: true,
    },
  },
  // Fallback entries with minimal info
  { name: 'Flamingo', traits: {} },
  { name: 'Raccoon', traits: {} },
  { name: 'Platypus', traits: {} },
  { name: 'Pangolin', traits: {} },
  { name: 'Narwhal', traits: {} },
  { name: 'Red Panda', traits: {} },
  { name: 'Kiwi Bird', traits: {} },
  { name: 'Hedgehog', traits: {} },
  { name: 'Manatee', traits: {} },
  { name: 'Capybara', traits: {} },
  { name: 'Quokka', traits: {} },
  { name: 'Elephant Shrew', traits: {} },
  { name: 'Okapi', traits: {} },
  { name: 'Aardvark', traits: {} },
  { name: 'Dugong', traits: {} },
  { name: 'Sea Cucumber', traits: {} },
  { name: 'Pufferfish', traits: {} },
  { name: 'Blobfish', traits: {} },
  { name: 'Octopus', traits: {} },
  { name: 'Mongoose', traits: {} },
  { name: 'Lynx', traits: {} },
  { name: 'Fennec Fox', traits: {} },
  { name: 'Chinchilla', traits: {} },
  { name: 'Cockatoo', traits: {} },
  { name: 'Cassowary', traits: {} },
  { name: 'Blue-Footed Booby', traits: {} },
  { name: 'Emu', traits: {} },
  { name: 'Armadillo', traits: {} },
  { name: 'Toucan', traits: {} },
  { name: 'Tarantula', traits: {} },
  { name: 'Bearded Dragon', traits: {} },
  { name: 'Iguana', traits: {} },
  { name: 'Sugar Glider', traits: {} },
  { name: 'Wallaby', traits: {} },
  { name: 'Koala', traits: {} },
  { name: 'Opossum', traits: {} },
  { name: 'Wolverine', traits: {} },
  { name: 'Tasmanian Devil', traits: {} },
  { name: 'Meerkat', traits: {} },
  { name: 'Kinkajou', traits: {} },
  { name: 'Millillillillipede', traits: {} },
  { name: 'Yak', traits: {} },
  { name: 'Alpaca', traits: {} },
  { name: 'Llama', traits: {} },
  { name: 'Oryx', traits: {} },
  { name: 'Binturong', traits: {} },
  { name: 'Harpy Eagle', traits: {} },
  { name: 'Kingfisher', traits: {} },
  { name: 'Loon', traits: {} },
  { name: 'Seahorse', traits: {} },
  { name: 'Glowworm', traits: {} },
  { name: 'Firefly', traits: {} },
  { name: 'Praying Mantis', traits: {} },
  { name: 'Stick Insect', traits: {} },
  { name: 'Hermit Crab', traits: {} },
  { name: 'Leafcutter Ant', traits: {} },
  { name: 'Giant Clam', traits: {} },
  { name: 'Horseshoe Crab', traits: {} },
  { name: 'Sea Dragon', traits: {} },
  { name: 'Moon Jellyfish', traits: {} },
  { name: 'Peacock', traits: {} },
  { name: 'Albatross', traits: {} },
  { name: 'Hammerhead Shark', traits: {} },
  { name: 'Goblin Shark', traits: {} },
  { name: 'Manta Ray', traits: {} },
  { name: 'Stingray', traits: {} },
  { name: 'Dolphin', traits: {} },
  { name: 'Orca', traits: {} },
  { name: 'Beluga Whale', traits: {} },
  { name: 'Honey Badger', traits: {} },
  { name: 'Civet', traits: {} },
  { name: 'Skunk', traits: {} },
  { name: 'Zebra', traits: {} },
  { name: 'Giant Anteater', traits: {} },
  { name: 'Proboscis Monkey', traits: {} },
  { name: 'Mandrill', traits: {} },
  { name: 'Howler Monkey', traits: {} },
  { name: 'Tamandua', traits: {} },
  { name: 'Golden Lion Tamarin', traits: {} },
  { name: 'Marmoset', traits: {} },
  { name: 'Hoatzin', traits: {} },
  { name: 'Frilled Lizard', traits: {} },
  { name: 'Komodo Dragon', traits: {} },
  { name: 'Sand Cat', traits: {} },
  { name: 'Snow Leopard', traits: {} },
  { name: 'Arctic Fox', traits: {} },
  { name: 'Pika', traits: {} },
  { name: 'Gerbil', traits: {} },
  { name: 'Kudu', traits: {} },
  { name: 'Weasel', traits: {} },
  { name: 'Ermine', traits: {} },
  { name: 'Mink', traits: {} },
  { name: 'Otter', traits: {} },
  { name: 'Peafowl', traits: {} },
  { name: 'Puffin', traits: {} },
  { name: 'Numbat', traits: {} },
  { name: 'Wombat', traits: {} },
  { name: 'Tree Kangaroo', traits: {} },
  { name: 'Quoll', traits: {} },
  { name: 'Cuttlefish', traits: {} },
  { name: 'Sea Otter', traits: {} },
  { name: 'Sea Turtle', traits: {} },
  { name: 'Starfish', traits: {} },
  { name: 'Crown-of-Thorns Starfish', traits: {} },
  { name: 'Blue Jay', traits: {} },
  { name: 'Caracal', traits: {} },
  { name: 'Echidna', traits: {} },
  { name: 'Gharial', traits: {} },
  { name: 'Mudskipper', traits: {} },
  { name: 'Orchid Mantis', traits: {} },
  { name: 'Velvet Worm', traits: {} },
  { name: 'Rock Hyrax', traits: {} },
  { name: 'Shoebill Stork', traits: {} },
  { name: 'Indian Star Tortoise', traits: {} },
  { name: 'Galapagos Tortoise', traits: {} },
  { name: 'Leafy Sea Dragon', traits: {} },
  { name: 'Fairy Penguin', traits: {} },
  { name: 'Dingo', traits: {} },
  { name: 'Clouded Leopard', traits: {} },
  { name: 'Spider Monkey', traits: {} },
  { name: 'Pallas’s Cat', traits: {} },
  { name: 'Pink Fairy Armadillo', traits: {} },
  { name: 'Japanese Spider Crab', traits: {} },
  { name: 'Atlantic Puffin', traits: {} },
  { name: 'Hummingbird', traits: {} },
  { name: 'Black Swan', traits: {} },
  { name: 'Ocelot', traits: {} },
  { name: 'Tapir', traits: {} },
  { name: 'Civet Cat', traits: {} },
  { name: 'Golden Snub-Nosed Monkey', traits: {} },
  { name: 'Draco Lizard', traits: {} },
  { name: 'Ribbon Eel', traits: {} },
  { name: 'Leaf Tailed Gecko', traits: {} },
  { name: 'Rainbow Lorikeet', traits: {} },
  { name: 'African Wild Dog', traits: {} },
  { name: 'Slow Loris', traits: {} },
  { name: 'Tarsier', traits: {} },
  { name: 'Indian Pangolin', traits: {} },
  { name: 'Springhare', traits: {} },
  { name: 'Spotted Hyena', traits: {} },
]

// Derived name list for compatibility
export const animalList: string[] = animalDataList.map((a) => a.name)

// Random selection by name
export function randomAnimal(): string {
  return animalList[Math.floor(Math.random() * animalList.length)]
}

// Optional: random full metadata
export function randomAnimalData(): AnimalData {
  return animalDataList[Math.floor(Math.random() * animalDataList.length)]
}
