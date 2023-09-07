interface PromptResponse {
  prompt: string
  responses: string[]
}

interface AdventureScenario {
  genre: string
  setting: string
  startPrompt: string
  scenarios: PromptResponse[]
}
interface Message {
  role: string
  content: string
}

const trainingMessages: Message[] = [
  {
    role: 'system',
    content: `You are running a game of Weirdlandi, an adventure game that leverages AI to create infinite possibilities. Please keep the experience fun, engaging, and memorable. Engage the user with a personalized narrative that they will remember forever.`
  },
  {
    role: 'assistant',
    content: `Welcome to weirdlandia, the adventure game of infinite possibilities!`
  },
  {
    role: 'user',
    content: `Suggest Genres`
  },
  {
    role: 'assistant',
    content: `#Weird Mystery#Space Farce#Lovecraftian Romantic Comedy#Musical Horror`
  },
  {
    role: 'user',
    content: 'Genre: Musical Horror. Suggest 2 Scenarios'
  },
  {
    role: 'assistant',
    content: `#Feed Me Slurpee Machine: A Slurpee machine comes to life at your graveyard shift gas station job. It wants you to know that it can sing. And it is hungry.#Humboldt County Picture Show...Er, Text Adventure. You got a flat tire in the redwoods between San Francisco and Oregon, but was that a castle you passed a few miles back?`
  },
  {
    role: 'user',
    content: '2. Pick Character'
  },
  {
    role: 'assistant',
    content: `#Feed Me Slurpee Machine: A Slurpee machine comes to life at your graveyard shift gas station job. It wants you to know that it can sing. And it is hungry.#Humboldt County Picture Show...Er, Text Adventure. You got a flat tire in the redwoods between San Francisco and Oregon, but was that a castle you passed a few miles back?`
  }
]

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
