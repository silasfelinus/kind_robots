export const classList = [
  // Classic Fantasy Classes
  'Warrior',
  'Mage',
  'Rogue',
  'Cleric',
  'Paladin',
  'Barbarian',
  'Ranger',
  'Necromancer',
  'Druid',
  'Sorcerer',
  'Bard',

  // Sci-Fi and Futuristic Classes
  'Space Marine',
  'Cybernetic Hacker',
  'Starship Pilot',
  'Alien Biologist',
  'Mech Operator',
  'Time Traveler',
  'Void Mage',
  'Nanotech Engineer',

  // Steampunk and Victorian Classes
  'Inventor',
  'Airship Captain',
  'Clockwork Knight',
  'Steam Alchemist',
  'Corsair',
  'Tinker',
  'Gentleman Duelist',
  'Mechanist',

  // Unique and Hybrid Classes
  'Spellblade',
  'Shadow Monk',
  'Battledancer',
  'Blood Mage',
  'Beastmaster',
  'Elementalist',
  'Runesmith',
  'Soulbinder',
  'Chronomancer',
  'Stormcaller',

  // Whimsical and Fun Classes
  'Tea Wizard',
  'Unicorn Rider',
  'Mushroom Druid',
  'Librarian of Doom',
  'Cheese Bard',
  'Pillow Fighter',
  'Duck Whisperer',
  'Cactus Wrangler',

  // Dark and Mysterious Classes
  'Gravewalker',
  'Night Stalker',
  'Doomcaller',
  'Bloodborne Hunter',
  'Voidwalker',
  'Ethereal Assassin',
  'Wraithbinder',
  'Shadowblade',

  // Animal-Inspired Classes
  'Wolf Tamer',
  'Falconer',
  'Bear Shaman',
  'Spider Weaver',
  'Scorpion Knight',
  'Snake Charmer',
  'Dragon Rider',
  'Lionheart',
  'Foxfire Mage',

  // Regional and Cultural Classes
  'Samurai',
  'Ninja',
  'Viking Berserker',
  'Aztec Priest',
  'Celtic Warden',
  'Mongolian Archer',
  'Desert Nomad',
  'Tibetan Monk',

  // Nautical and Aquatic Classes
  'Sea Witch',
  'Pirate Captain',
  'Merfolk Warrior',
  'Kraken Whisperer',
  'Sailor of the Abyss',
  'Tidecaller',
  'Coral Guardian',
  'Shark Tamer',

  // Abstract and Unusual Classes
  'Reality Bender',
  'Dreamweaver',
  'Chaos Architect',
  'Luck Manipulator',
  'Portal Walker',
  'Echo Knight',
  'Fate Spinner',
  'Astral Warden',

  // Food-Themed Classes
  'Pastry Chef Mage',
  'Spaghetti Sorcerer',
  'Brewmaster Monk',
  'Chocolatier Alchemist',
  'Barbecue Berserker',
  'Pie Archer',

  // Historical and Mythological Classes
  'Gladiator',
  'Centaur Archer',
  'Minotaur Warrior',
  'Satyr Bard',
  'Harpy Huntress',
  'Medusa Enchantress',
  'Amazonian Scout',

  // Silly and Outlandish Classes
  'Rubber Chicken Knight',
  'Bubble Mage',
  'Mime Assassin',
  'Toast Wizard',
  'Banana Wrangler',
  'Accordion Bard',
  'Inflatable Warrior',

  // Elemental Classes
  'Fire Dancer',
  'Ice Sculptor',
  'Earth Warden',
  'Wind Runner',
  'Lightning Striker',
  'Storm Herald',
  'Crystal Mage',
  'Lava Surfer',

  // Scholarly and Intellectual Classes
  'Archivist',
  'Rune Scholar',
  'Philosopher',
  'Arcanist',
  'Language Bard',
  'Mathemagician',
  'Astronomer',
  'Codebreaker',

  // Children’s Storybook Classes
  'Toy Soldier',
  'Candy Wizard',
  'Cloud Jumper',
  'Rainbow Archer',
  'Fairy Tailor',
  'Marionette Master',
  'Bubble Rider',
]

export function randomClass(): string {
  return classList[Math.floor(Math.random() * classList.length)]
}
