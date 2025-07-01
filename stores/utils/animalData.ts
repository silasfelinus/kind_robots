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
    texture?: 'scaly' | 'furry' | 'smooth' | 'spiky' | 'armored' | 'crystalline' | 'undefined'
    bodyType?: 'quadruped' | 'biped' | 'serpentine' | 'winged' | 'tentacled' | 'crustacean' | 'amorphous' | 'other'
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
  description: 'A slow-moving, tree-dwelling mammal with long claws and shaggy fur.',
  wikiUrl: 'https://en.wikipedia.org/wiki/Sloth',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Bradypus_variegatus_from_Costa_Rica.jpg',
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
{
  name: 'Water Bear',
  scientificName: 'Hypsibius dujardini',
  category: 'real',
  icon: '🧸',
  description: 'A microscopic, water-dwelling invertebrate with eight stubby legs and extreme resilience.',
  wikiUrl: 'https://en.wikipedia.org/wiki/Tardigrade',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Hys_dujardini_1.jpg',
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

  { name: 'Flamingo' },
  { name: 'Raccoon' },
  { name: 'Platypus' },
  { name: 'Pangolin' },
  {
  name: 'Axolotl',
  scientificName: 'Ambystoma mexicanum',
  category: 'real',
  icon: '🦎',
  description: 'A smiling aquatic salamander with feathery gills that never grows up.',
  wikiUrl: 'https://en.wikipedia.org/wiki/Axolotl',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Ambystoma_mexicanum_02.jpg',
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

  { name: 'Narwhal' },
  { name: 'Red Panda' },
  { name: 'Kiwi Bird' },
  { name: 'Hedgehog' },
  { name: 'Manatee' },
  { name: 'Capybara' },
  { name: 'Quokka' },
  { name: 'Elephant Shrew' },
  { name: 'Okapi' },
  { name: 'Aardvark' },
  { name: 'Dugong' },
  { name: 'Sea Cucumber' },
  { name: 'Pufferfish' },
  { name: 'Blobfish' },
  { name: 'Octopus' },
  { name: 'Mongoose' },
  { name: 'Lynx' },
  { name: 'Fennec Fox' },
  { name: 'Chinchilla' },
  { name: 'Cockatoo' },
  { name: 'Cassowary' },
  { name: 'Blue-Footed Booby' },
  { name: 'Emu' },
  { name: 'Armadillo' },
  { name: 'Toucan' },
  { name: 'Tarantula' },
  { name: 'Bearded Dragon' },
  { name: 'Iguana' },
  { name: 'Sugar Glider' },
  { name: 'Wallaby' },
  { name: 'Koala' },
  { name: 'Opossum' },
  { name: 'Wolverine' },
  { name: 'Tasmanian Devil' },
  { name: 'Meerkat' },
  { name: 'Kinkajou' },
  { name: 'Millillillillipede' },
  { name: 'Yak' },
  { name: 'Alpaca' },
  { name: 'Llama' },
  { name: 'Oryx' },
  { name: 'Binturong' },
  { name: 'Harpy Eagle' },
  { name: 'Kingfisher' },
  { name: 'Loon' },
  { name: 'Seahorse' },
  { name: 'Glowworm' },
  { name: 'Firefly' },
  { name: 'Praying Mantis' },
  { name: 'Stick Insect' },
  { name: 'Hermit Crab' },
  { name: 'Leafcutter Ant' },
  { name: 'Giant Clam' },
  { name: 'Horseshoe Crab' },
  { name: 'Sea Dragon' },
  { name: 'Moon Jellyfish' },
  { name: 'Peacock' },
  { name: 'Albatross' },
  { name: 'Hammerhead Shark' },
  { name: 'Goblin Shark' },
  { name: 'Manta Ray' },
  { name: 'Stingray' },
  { name: 'Dolphin' },
  { name: 'Orca' },
  { name: 'Beluga Whale' },
  { name: 'Honey Badger' },
  { name: 'Civet' },
  { name: 'Skunk' },
  { name: 'Zebra' },
  { name: 'Giant Anteater' },
  { name: 'Proboscis Monkey' },
  { name: 'Mandrill' },
  { name: 'Howler Monkey' },
  { name: 'Tamandua' },
  { name: 'Golden Lion Tamarin' },
  { name: 'Marmoset' },
  { name: 'Hoatzin' },
  { name: 'Frilled Lizard' },
  { name: 'Komodo Dragon' },
  { name: 'Sand Cat' },
  { name: 'Snow Leopard' },
  { name: 'Arctic Fox' },
  { name: 'Pika' },
  { name: 'Gerbil' },
  { name: 'Kudu' },
  { name: 'Weasel' },
  { name: 'Ermine' },
  { name: 'Mink' },
  { name: 'Otter' },
  { name: 'Peafowl' },
  { name: 'Puffin' },
  { name: 'Numbat' },
  { name: 'Wombat' },
  { name: 'Tree Kangaroo' },
  { name: 'Quoll' },
  { name: 'Cuttlefish' },
  { name: 'Sea Otter' },
  { name: 'Sea Turtle' },
  { name: 'Starfish' },
  { name: 'Crown-of-Thorns Starfish' },
  { name: 'Blue Jay' },
  { name: 'Caracal' },
  { name: 'Echidna' },
  { name: 'Gharial' },
  { name: 'Mudskipper' },
  { name: 'Orchid Mantis' },
  { name: 'Velvet Worm' },
  { name: 'Rock Hyrax' },
  { name: 'Shoebill Stork' },
  { name: 'Indian Star Tortoise' },
  { name: 'Galapagos Tortoise' },
  { name: 'Leafy Sea Dragon' },
  { name: 'Fairy Penguin' },
  { name: 'Dingo' },
  { name: 'Clouded Leopard' },
  { name: 'Spider Monkey' },
  { name: 'Pallas’s Cat' },
  { name: 'Pink Fairy Armadillo' },
  { name: 'Japanese Spider Crab' },
  { name: 'Atlantic Puffin' },
  { name: 'Hummingbird' },
  { name: 'Black Swan' },
  { name: 'Ocelot' },
  { name: 'Tapir' },
  { name: 'Civet Cat' },
  { name: 'Golden Snub-Nosed Monkey' },
  { name: 'Draco Lizard' },
  { name: 'Ribbon Eel' },
  { name: 'Leaf Tailed Gecko' },
  { name: 'Rainbow Lorikeet' },
  { name: 'African Wild Dog' },
  { name: 'Slow Loris' },
  { name: 'Tarsier' },
  { name: 'Indian Pangolin' },
  { name: 'Springhare' },
  { name: 'Spotted Hyena' },
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
