// funnyNameGenerator.ts

const presetNames = [
  'Spike', 'Lawrence', 'Tiffany', 'Grognar', 'Grover', 'Lemmon', 'Penelope', 'Princess Buzzsaw',
  'Madame Fifi', 'Amanpreet', 'Mitch', 'Curly', 'Bozo', 'Serendipity', 'AMI', 'Teddy',
  'Lemonade', 'Tinkerblaze', 'Aaaaaagh'
]

// Track used names to avoid duplication
const usedNames = new Set<string>()

// Fallback generator using adjectives and animals
const adjectives = ['Silly', 'Happy', 'Wiggly', 'Fluffy', 'Dizzy', 'Lazy', 'Spunky', 'Sparky']
const animals = ['Panda', 'Koala', 'Unicorn', 'Dolphin', 'Tiger', 'Sloth', 'Dragon', 'Phoenix']

// Function to generate a new funny name (fallback when preset names are exhausted)
const generateNewFunnyName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adjective} ${animal} ${Date.now()}`
}

// Function to generate a funny name
export const generateFunnyName = (): string => {
  // Filter out names that have already been used
  const availableNames = presetNames.filter(name => !usedNames.has(name))

  if (availableNames.length > 0) {
    // Select a random available name
    const name = availableNames[Math.floor(Math.random() * availableNames.length)]
    usedNames.add(name)
    return name
  }

  // If no preset names are left, generate a new one
  const newName = generateNewFunnyName()
  usedNames.add(newName)
  return newName
}
