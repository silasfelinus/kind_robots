export interface ModuleInfo {
  description: string;
  example: string;
}

export interface ModuleData {
  [name: string]: ModuleInfo;
}

export const moduleData: ModuleData = {
  ART: {
    description: 'a collection of comma separated phrases and/or [Wildcards] for an art prompt.',
    example: '#ART Modeling shot, [ANIMAL], [PLACE], style of [ARTIST]',
  },
  SLOGAN: {
    description: 'a short phrase for sharing on social media',
    example: '#SLOGAN "Unleash Creativity, Embrace Innovation"',
  },
  CODE: {
    description: 'formatted code',
    example: '#CODE "function helloWorld() { console.log(\'Hello, world!\'); }"',
  },
  POEM: {
    description: 'new line separated rhyming phrases',
    example: '#POEM Roses are red,\nViolets are blue,\nPoems are sweet,\nAnd so are you.',
  },
  LIMERICK: {
    description: 'A Five Line Limerick separated by new lines',
    example:
      '#LIMERICK There once was a man from the coast,\nWho truly adored his French toast,\nHe ate with delight,\nMorning, noon, and night,\nThat crispy and buttery most!',
  },
  CHOICE: {
    description: 'A multiple choice decision with numbered options',
    example: '#CHOICE Choose your favorite color:\n1. Red\n2. Blue\n3. Green',
  },
  PROMPT: {
    description: 'A single phrase to prompt another NLP modeller',
    example: '#PROMPT Describe the weather today.',
  },
  REWARD: {
    description: 'A quest reward',
    example: '#REWARD USERNAME',
  },
  BOT: {
    description: 'information to create a new bot',
    example: '#BOT name: WeatherBot, function: Provide weather updates',
  },
  SOCIAL: {
    description: 'a message formatted for social media sharing',
    example: '#SOCIAL Join us for our next big event! #InnovationConference',
  },
  PING: {
    description: 'An AI-prompted notification to alert the designer',
    example: '#PING New user feedback is available. Please review.',
  },
  STATUS: {
    description: 'A message that will be passed as a status message',
    example: '#STATUS System is up and running.',
  },
  REDBUBLE: {
    description: 'formatted for Redbubble',
    example: '#REDBUBLE DesignName: CoolCat, Category: Animals',
  },
  BRAINSTORM: {
    description: 'A list of ideas separated by new lines',
    example: '#BRAINSTORM Idea 1: Solar-powered car,\nIdea 2: Vertical farming',
  },
  BABEL: {
    description: 'A single phrase translated into multiple languages',
    example: '#BABEL English: Hello World, French: Bonjour le monde',
  },
  COMPONENT: {
    description: 'A request to load the named component on the chat page',
    example: '#COMPONENT[Butterfly]',
  },
  URL: {
    description: 'A URL',
    example: '#URL https://www.example.com',
  },
  CHAT: {
    description: 'a simple, short chat message',
    example: '#CHAT Hi, how can I help you today?',
  },
  MARKDOWN: {
    description: 'a longer message decorated with markdown',
    example: `#MARKDOWN 🦋We're fluttering into the future!`,
  },
  ALEXA: {
    description: 'a message to be forwarded to Alexa',
    example: '#ALEXA Turn off the living room lights.',
  },
};
