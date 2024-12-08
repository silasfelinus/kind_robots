export function useRandomCharacterData() {
  const randomFromArray = <T>(array: T[]): T =>
    array[Math.floor(Math.random() * array.length)]

  const randomText = (length: number): string =>
    Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')

  return {
    generateRandomCharacter: () => ({
      name: randomFromArray([
        'Eldrin', 'Kaela', 'Thorin', 'Morgana', 'Rhaegar', 'Saria',
      ]),
      honorific: randomFromArray([
        'Adventurer', 'Slayer', 'Explorer', 'Scholar', 'Warrior', 'Champion',
      ]),
      class: randomFromArray([
        'Wizard', 'Rogue', 'Paladin', 'Druid', 'Warlock', 'Bard',
      ]),
      genre: randomFromArray([
        'Fantasy', 'Sci-Fi', 'Steampunk', 'Post-Apocalypse', 'Cyberpunk',
      ]),
      backstory: `Born in ${randomFromArray([
        'a small village',
        'the bustling city',
        'the wilderness',
        'a mysterious academy',
      ])}, ${randomFromArray([
        'their destiny was shaped by tragedy',
        'they trained to become a hero',
        'they uncovered ancient secrets',
        'they sought revenge for their family',
      ])}.`,
      inventory: randomFromArray([
        'A mystical staff, a bag of gold, and an enchanted ring',
        'A sword, a shield, and a health potion',
        'A set of tools, a map, and a mysterious artifact',
      ]),
      quirks: randomFromArray([
        'Hates the sound of whistling',
        'Always speaks in rhymes',
        'Carries a pet mouse everywhere',
      ]),
      skills: randomFromArray([
        'Master of disguise and stealth',
        'Proficient in ancient languages',
        'Skilled in combat and survival',
      ]),
      
    }),
  }
}
