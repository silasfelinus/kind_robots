type Genre = 'Fantasy' | 'Sci-Fi' | 'Mystery' | 'Horror'
type Setting = 'Medieval' | 'Space' | 'Modern City' | 'Haunted Mansion'

interface Character {
  name: string
  stats: {
    strength: number
    agility: number
    intelligence: number
  }
  backstory: string
  magicItem: string
  specialSkill: string
}

interface PromptResponse {
  prompt: string
  responses: string[]
}

interface AdventureScenario {
  genre: Genre
  setting: Setting
  startPrompt: string
  scenarios: PromptResponse[]
}

const trainingData: AdventureScenario[] = [
  {
    genre: 'Fantasy',
    setting: 'Medieval',
    startPrompt:
      'You find yourself in a bustling medieval town square, surrounded by merchants peddling their wares.',
    scenarios: [
      {
        prompt: 'A mysterious stranger beckons you over. Do you:',
        responses: [
          'Approach the stranger with caution.',
          'Ignore them and continue browsing.',
          'Confront them and ask their intentions.',
          'Stealthily watch them from a distance.'
        ]
      },
      {
        prompt: 'You discover the stranger is a mage. They offer you a potion. Do you:',
        responses: [
          'Politely decline.',
          'Accept the potion and drink it immediately.',
          'Take the potion for later.',
          "Ask them about the potion's effects."
        ]
      }
      // ... Add more scenarios as needed
    ]
  }
  // ... Add more adventure scenarios for different genres and settings
]

export { trainingData, AdventureScenario, PromptResponse, Character }
