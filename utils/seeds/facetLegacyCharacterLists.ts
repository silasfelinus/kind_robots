// /utils/seeds/facetLegacyCharacterLists.ts
//
// Deterministic migration snapshots used only to fill gaps in the canonical
// Facet catalog. Runtime selection must use Facets rather than these arrays.

export const legacyFacetClassList = [
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
] as const

export const legacyFacetGenreList = [
  // Classic Genres
  'Fantasy',
  'Sci-Fi',
  'Steampunk',
  'Post-Apocalyptic',
  'Cyberpunk',
  'Space Opera',
  'Mystery',
  'Thriller',
  'Romance',
  'Western',

  // Modern and Niche Genres
  'Urban Fantasy',
  'Superhero',
  'Horror Comedy',
  'Dark Academia',
  'Dieselpunk',
  'Eco-Fiction',
  'Cli-Fi (Climate Fiction)',
  'Alternate History',
  'Time Travel',
  'Retro-Futurism',

  // Whimsical and Fun
  'Fairy Tale',
  'Magical Realism',
  'Absurdist Comedy',
  'Pirate Adventure',
  'Dreamlike Surrealism',
  'Monster Romance',
  'Cartoon Noir',
  'Whimsical Stew',
  'Space Pirates',
  'Mythpunk',

  // Dark and Gritty
  'Grimdark Fantasy',
  'Gothic Horror',
  'Noir Thriller',
  'Post-Human Dystopia',
  'Lovecraftian Horror',
  'Vampire Gothic',
  'Dystopian Romance',
  'Psychological Horror',
  'Cosmic Horror',
  'Crime Noir',

  // Sci-Fi Subgenres
  'Hard Science Fiction',
  'Biopunk',
  'Nanopunk',
  'Solarpunk',
  'Astrobiological Adventure',
  'AI Utopia',
  'Martian Colonization',
  'First Contact',
  'Alien Invasion',
  'Techno-Thriller',

  // Fantasy Subgenres
  'High Fantasy',
  'Low Fantasy',
  'Sword and Sorcery',
  'Epic Fantasy',
  'Heroic Fantasy',
  'Gaslamp Fantasy',
  'Dark Fairy Tale',
  'Weird Fantasy',
  'Cozy Fantasy',
  'Medieval Fantasy',

  // Experimental and Mixed Genres
  'Science Fantasy',
  'Historical Fantasy',
  'Horror Fantasy',
  'Science Romance',
  'Mystery Sci-Fi',
  'Fantasy Noir',
  'Musical Adventure',
  'Epistolary Fiction',
  'Interactive Fiction',
  'Metafiction',

  // Cultural and Regional
  'Afrofuturism',
  'Asian Fantasy',
  'Celtic Mythology',
  'Indigenous Futurism',
  'Nordic Noir',
  'Latin American Magical Realism',
  'Eastern European Folklore',
  'Oceanic Mythology',
  'African Mythpunk',
  'Arabian Nights Redux',
] as const
