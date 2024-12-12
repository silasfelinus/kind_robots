export function useRandomHonorific() {
  const honorifics = [
    // Noble and Regal
    'Brave',
    'Wise',
    'Swift',
    'Cunning',
    'Noble',
    'Magnanimous',
    'Honorable',
    'Just',
    'Radiant',
    'Virtuous',

    // Mystical and Magical
    'Enchanted',
    'Arcane',
    'Ethereal',
    'Shadowed',
    'Blazing',
    'Frozen',
    'Seer',
    'Invoker',
    'Moonlit',
    'Starborn',

    // Adventurous
    'Explorer',
    'Wanderer',
    'Trailblazer',
    'Pioneer',
    'Pathfinder',
    'Voyager',
    'Conqueror',
    'Champion',
    'Guardian',
    'Vagabond',

    // Quirky and Fun
    'Perpetually Confused',
    'Undaunted',
    'Glorious',
    'Defenestrator',
    'Keeper of Cats',
    'Master of Cheese',
    'Unstoppable',
    'Sassy',
    'Indomitable',
    'Unpredictable',

    // Animal Inspired
    'Eagle-Eyed',
    'Lionhearted',
    'Foxlike',
    'Stagborne',
    'Wolfkin',
    'Bearclaw',
    'Tigerfang',
    'Owlsighted',
    'Pantherclaw',
    'Ravenwinged',

    // Historical and Cultural
    'Templar',
    'Ronin',
    'Viking',
    'Centurion',
    'Samurai',
    'Khaleesi',
    'Shogun',
    'Knight Errant',
    'Baron',
    'Emissary',

    // Dark and Mysterious
    'Fallen',
    'Twilight-Touched',
    'Veiled',
    'Silent',
    'Eclipse',
    'Wraith',
    'Phantom',
    'Hollow',
    'Blooded',
    'Unseen',

    // Elemental Inspired
    'Stormbringer',
    'Flameborn',
    'Earthshaker',
    'Tidecaller',
    'Skydancer',
    'Frostmarked',
    'Thunderborn',
    'Dawnbreaker',
    'Ashen',
    'Tempest',

    // Titles of Power
    'Warden',
    'Overseer',
    'Chancellor',
    'High Priest',
    'Archmage',
    'Commander',
    'Marshal',
    'Herald',
    'Emperor',
    'Oracle',
  ]

  function randomHonorific() {
    const randomIndex = Math.floor(Math.random() * honorifics.length)
    const selectedHonorific = honorifics[randomIndex]

    // Log the random index and selected honorific for debugging
    console.log('Random Honorific Index:', randomIndex)
    console.log('Selected Honorific:', selectedHonorific)

    return selectedHonorific
  }

  return { randomHonorific }
}
