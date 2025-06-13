// stores/utils/randomItem.ts

const useRandomItem = [
  // Practical Items
  'Leather satchel',
  'Pocket watch',
  'Compass',
  'Rope (50ft)',
  'Lantern',
  'Canteen of water',
  'Notebook and pen',
  'Magnifying glass',
  'Set of lockpicks',
  'Steel dagger',

  // Whimsical
  'Bag of glitter',
  'Rainbow umbrella',
  'Unicorn plushie',
  'Box of mystery keys',
  'Bubble-blowing pipe',
  'Enchanted snow globe',
  'Singing teapot',
  'Pair of mismatched socks',
  'Tiny bonsai tree',
  'Jar of fireflies',

  // Fantasy
  'Potion of healing',
  'Dragon scale shield',
  'Ring of invisibility',
  'Crystal orb',
  'Spellbook of illusions',
  'Golden chalice',
  'Phoenix feather quill',
  'Magic carpet',
  'Sword of light',
  'Bag of holding',

  // Tech/Sci-Fi
  'Holo projector',
  'Plasma wrench',
  'Anti-gravity boots',
  'Neural uplink chip',
  'Data crystal',
  'Energy blade',
  'Portable force field',
  'Nano repair kit',
  'Quantum compass',
  'EMP grenade',

  // Food Items
  'Bag of trail mix',
  'Golden apple',
  'Mystery-flavored jellybeans',
  'Box of donuts (half-eaten)',
  'Bottle of honey mead',
  'Spicy chili pepper',
  'Carton of alien milk',
  'Slice of glowing blue cake',
  'Endless bag of popcorn',
  'Chocolate dragon egg',

  // Quirky Items
  'Rubber chicken',
  'Inflatable castle',
  'Deck of cursed cards',
  'Pair of x-ray glasses',
  'Glow-in-the-dark yo-yo',
  'Bag of counterfeit coins',
  'Wind-up robot',
  'Talking skull',
  'Treasure map (missing pieces)',
  'Squeaky hammer',

  // Historical
  'Ancient scroll',
  'Roman coin',
  'Samurai helmet',
  'Viking drinking horn',
  'Renaissance painting',
  'Pirate flag',
  'Victorian cameo brooch',
  'Knights templar ring',
  'Wooden telescope',
  'Pharaoh’s amulet',

  // Nature-Inspired
  'Jar of moonlight',
  'Seed pouch',
  'Carved walking stick',
  'Antique fishing rod',
  'Stone arrowhead',
  'Feather quill pen',
  'Pressed flower book',
  'Chunk of amber',
  'Driftwood sculpture',
  'Moss-covered rock',

  // Miscellaneous
  'Bag of marbles',
  'Golden kazoo',
  'Clockwork mouse',
  'Crystal dice set',
  'Box of forgotten letters',
  'Pair of fuzzy earmuffs',
  'Weathered treasure chest',
  'Lucky rabbit’s foot',
  'Tiny mechanical bird',
  'Miniature cannon',
]

// 🎯 A generic utility for choosing random elements from any array
export function randomItem<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

// 🎒 A random inventory item from your curated list
export function getRandomInventoryItem(): string {
  return randomItem(inventoryItems)
}

// 🍱 For multiple items:
export function getRandomInventory(count = 1): string[] {
  const set = new Set<string>()
  while (set.size < count) {
    set.add(getRandomInventoryItem())
  }
  return Array.from(set)
}
