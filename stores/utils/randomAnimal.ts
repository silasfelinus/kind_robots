// /stores/utils/randomAnimal.ts

export type AnimalData = {
  name: string
  icon?: string
  imageId?: string
  description?: string
  title?: string
}

export const animalList = [
  'Sloth',
  'Water Bear',
  'Flamingo',
  'Raccoon',
  'Platypus',
  'Pangolin',
  'Axolotl',
  'Narwhal',
  'Red Panda',
  'Kiwi Bird',
  'Hedgehog',
  'Manatee',
  'Capybara',
  'Quokka',
  'Elephant Shrew',
  'Okapi',
  'Aardvark',
  'Dugong',
  'Sea Cucumber',
  'Pufferfish',
  'Blobfish',
  'Octopus',
  'Mongoose',
  'Lynx',
  'Fennec Fox',
  'Chinchilla',
  'Cockatoo',
  'Cassowary',
  'Blue-Footed Booby',
  'Emu',
  'Armadillo',
  'Toucan',
  'Tarantula',
  'Bearded Dragon',
  'Iguana',
  'Sugar Glider',
  'Wallaby',
  'Koala',
  'Opossum',
  'Wolverine',
  'Tasmanian Devil',
  'Meerkat',
  'Kinkajou',
  'Millillillillipede',
  'Yak',
  'Alpaca',
  'Llama',
  'Oryx',
  'Binturong',
  'Harpy Eagle',
  'Kingfisher',
  'Loon',
  'Seahorse',
  'Glowworm',
  'Firefly',
  'Praying Mantis',
  'Stick Insect',
  'Hermit Crab',
  'Leafcutter Ant',
  'Giant Clam',
  'Horseshoe Crab',
  'Sea Dragon',
  'Moon Jellyfish',
  'Peacock',
  'Albatross',
  'Hammerhead Shark',
  'Goblin Shark',
  'Manta Ray',
  'Stingray',
  'Dolphin',
  'Orca',
  'Beluga Whale',
  'Honey Badger',
  'Civet',
  'Skunk',
  'Zebra',
  'Giant Anteater',
  'Proboscis Monkey',
  'Mandrill',
  'Howler Monkey',
  'Tamandua',
  'Golden Lion Tamarin',
  'Marmoset',
  'Hoatzin',
  'Frilled Lizard',
  'Komodo Dragon',
  'Sand Cat',
  'Snow Leopard',
  'Arctic Fox',
  'Pika',
  'Gerbil',
  'Kudu',
  'Weasel',
  'Ermine',
  'Mink',
  'Otter',
  'Peafowl',
  'Puffin',
  'Numbat',
  'Wombat',
  'Tree Kangaroo',
  'Quoll',
  'Cuttlefish',
  'Sea Otter',
  'Sea Turtle',
  'Starfish',
  'Crown-of-Thorns Starfish',
  'Axolotl',
  'Blue Jay',
  'Caracal',
  'Echidna',
  'Cassowary',
  'Gharial',
  'Mudskipper',
  'Pangolin',
  'Orchid Mantis',
  'Velvet Worm',
  'Rock Hyrax',
  'Shoebill Stork',
  'Indian Star Tortoise',
  'Galapagos Tortoise',
  'Leafy Sea Dragon',
  'Fairy Penguin',
  'Dingo',
  'Clouded Leopard',
  'Spider Monkey',
  'Pallas’s Cat',
  'Pink Fairy Armadillo',
  'Japanese Spider Crab',
  'Atlantic Puffin',
  'Hummingbird',
  'Black Swan',
  'Ocelot',
  'Tapir',
  'Civet Cat',
  'Golden Snub-Nosed Monkey',
  'Draco Lizard',
  'Ribbon Eel',
  'Leaf Tailed Gecko',
  'Rainbow Lorikeet',
  'African Wild Dog',
  'Slow Loris',
  'Tarsier',
  'Indian Pangolin',
  'Springhare',
  'Spotted Hyena',
]

export function randomAnimal(): string {
  return animalList[Math.floor(Math.random() * animalList.length)]
}
