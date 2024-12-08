export function useRandomCharacterData() {
  function generateRandomCharacter() {
    return {
      name: randomName(),
      honorific: randomHonorific(),
      class: randomClass(),
      genre: randomGenre(),
      backstory: randomBackstory(),
      inventory: randomInventory(),
      quirks: randomQuirks(),
      skills: randomSkills(),
      ...generateDefaultStats(), // Include stats as flat fields
    }
  }

  // Add your random generators for each field here
  function randomName() {
    const names = ['Ava', 'Liam', 'Noah', 'Sophia', 'Emma', 'Mason', 'Isabella', 'Ethan']
    return names[Math.floor(Math.random() * names.length)]
  }
  function randomHonorific() {
    const honorifics = ['The Brave', 'The Wise', 'The Swift', 'The Cunning']
    return honorifics[Math.floor(Math.random() * honorifics.length)]
  }
  function randomClass() {
    const classes = ['Warrior', 'Mage', 'Rogue', 'Cleric']
    return classes[Math.floor(Math.random() * classes.length)]
  }
  function randomGenre() {
    const genres = ['Fantasy', 'Sci-Fi', 'Steampunk', 'Post-Apocalyptic']
    return genres[Math.floor(Math.random() * genres.length)]
  }
  function randomBackstory() {
    const backstories = [
      'Orphaned at a young age and raised by wolves.',
      'Trained in the arcane arts in a distant land.',
      'A former thief seeking redemption.',
      'The lone survivor of a village destroyed by war.',
    ]
    return backstories[Math.floor(Math.random() * backstories.length)]
  }
  function randomInventory() {
    return 'Sword, Shield, Healing Potion'
  }
  function randomQuirks() {
    return 'Always speaks in riddles, has an uncanny sense of direction.'
  }
  function randomSkills() {
    return 'Expert swordsmanship, master of stealth, proficient in alchemy.'
  }

  // Generate default stats as flat fields
  function generateDefaultStats() {
    return {
      statName1: 'Luck',
      statName2: 'Swol',
      statName3: 'Wits',
      statName4: 'Fortitude',
      statName5: 'Rizz',
      statName6: 'Empathy',
    }
  }

  return { generateRandomCharacter }
}
