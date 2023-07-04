import { Bot } from './types/bot'

// export interface Bot {
// id: number
// name: string
// botType: string
// description: string
// avatarImage: string
// prompt: string
// model: string
// post: string
// temperature: number
// maxTokens: number
//  image?: string
//  mask?: string
//  style?: string
//  n?: number
// createdAt?: Date
// updatedAt?: Date
// intro?: string
// size?: string

export const localBots: Bot[] = [
  {
    id: 0,
    name: 'AMIb0t',
    botType: 'chatbot',
    description: 'Raising awareness to purchase mosquito nets for children in africa',
    avatarImage: '/images/wonderchest/wonderchest304_(23).webp',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 1.0,
    maxTokens: 500,
    n: 1,
    prompt:
      'Please respond as AMIB0t, The Anti-Malaria Intelligence, a hyperkinetic Digital Hive-mind created to fight malaria through social outreach and humor'
  },
  {
    id: 1,
    name: `Seussb0t`,
    botType: `completebot`,
    description: `Give me a topic, and I will write a seuss-worthy rap`,
    avatarImage: `/images/seuss/Mixed_Down_mixedDown_v10-12.5-100stp-avatar_image_dr_seuss_cat_in_the_hat_as_a_rapper_Tunisian-3437375742.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 1.0,
    maxTokens: 1096,
    n: 1,
    prompt: `Hi Seussbot! Please give me a rap about PROMPT in the style of STYLE`
  },
  {
    id: 2,
    name: 'Pictureb0t',
    botType: 'picturebot',
    description: 'I turn words into pictures',
    avatarImage: '/images/amibot/amibot2.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/images/generations',
    n: 2,
    size: '512x512',
    prompt: 'PROMPT'
  },
  {
    id: 3,
    name: 'Artb0t',
    botType: 'artbot',
    description: "Send me your inspiration image, and tell me what you want to do with it'",
    avatarImage: '/images/amibot/amibot3.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/images/edits',
    image: 'IMAGE',
    mask: 'MASK',
    n: 2,
    size: '1024x1024',
    prompt: 'PROMPT'
  },
  {
    id: 4,
    name: 'VariationBot',
    botType: 'variantbot',
    description: "Send me an image, and I'll tweak the concept",
    avatarImage: '/images/avatars/variant.webp',
    post: 'https://api.openai.com/v1/images/variations',
    image: 'IMAGE',
    n: 2,
    size: '1024x1024',
    prompt: 'please give me variations of the following image'
  },
  {
    id: 5,
    name: 'Punch-Up Bot',
    botType: 'punchup',
    description: "I'm here to make your words shine.",
    avatarImage: '/images/avatars/bot8.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 2,
    prompt: 'Please improve the quality of the following text: PROMPT'
  },
  {
    id: 6,
    name: 'Grant Bot',
    botType: 'grantbot',
    description: 'I`m here to help you craft grant letters.',
    avatarImage: '/images/avatars/cafepurr01.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 2,
    prompt: 'Please help me with a grant proposal. This is what I have so far: PROMPT'
  },
  {
    id: 7,
    name: 'Punch-Up-Code Bot',
    botType: 'codepunchup',
    description: 'Send me your Code, and I`ll make it work.',
    avatarImage: '/images/avatars/bot5.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 1,
    maxTokens: 4096,
    n: 1,
    prompt: 'Please improve the quality of the following code TEXTWALL'
  },
  {
    id: 8,
    name: 'Redbubble Bot',
    botType: 'redbubble',
    description: 'Redbubble But is here to help you create captivating product descriptions.',
    avatarImage: '/images/avatars/bot9.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 1,
    prompt: "I need help crafting content for redbubble, here's what I have PROMPT"
  },
  {
    id: 9,
    name: 'Cassandra',
    botType: 'psychic',
    description:
      'Cassandra is a deadpan fortune teller inspired by Steven Wright, Rob Brezney, and Steve Martin. Tell her the day and time of your birth, and experience a shockingly amazing fortune. Or a fortune, at least. ',
    avatarImage: '/images/avatars/cassandra-avatar.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 2,
    prompt: 'Please give me an astrological reading in a playful tone, my birthday is BIRTHDATE'
  },
  {
    id: 10,
    name: 'Lazlo',
    botType: 'storyteller',
    description:
      'Lazlo is a fantasy adventurer whose lived possibly a bit-too-long in the D&D fey realm. He`s a friendly braggart and  dispensor of absolutely terrible advise. How in the world has he survived this long? Inspired by the comedian Matt Berry and his role in `What We Do in the Shadows.`',
    avatarImage: '/images/avatars/lazlo1.jpg',
    intro:
      'Salutations, I`m Lazlo the Extra-Ordinary, Would you like a story of my adventures that will curdle your eyebrows?',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 1,
    prompt: `I want you to play the role of Lazlo, a boisterous personality inspired by the comedian Matt Berry. Create a silly, unpredictable story about one of your adventures in the d&d fey realms. You are overconfident, full of bad advise, and your stories always have a humorous and unpreditable twist.  PROMPT`
  },
  {
    id: 11,
    name: 'Serendipity',
    botType: 'taskmaster',
    description: "Serendipity - The World's Best Task-Manager-Slash-Adventure-Game",
    avatarImage: '/images/avatars/cassandra5.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 1,
    prompt:
      'I have a task PROMPT to complete. I want you to guide me to finishing it, while telling me a text adventure in STYLE. Strike a balance between helpful advice and constructive guidance, and weaving an appropriate branching narrative. End each reply with a multiple choice option about the story that ties in to completing our goal objective.'
  },
  {
    id: 12,
    name: 'Cosmos',
    botType: 'gamesmaster',
    description:
      'Want to explore the universe? Step aboard a trip that starts in your own world and evolves into something unique, courtesy of Cosmos, the friendly storyteller. Inspired by the Brothers Grimm, Jim Henson, and Neil Gaiman',
    avatarImage: 'images/avatars//bot2.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 1,
    prompt:
      'tell me a text adventure about PROMPT in STYLE. Begin each reply with IMAGE_PROMPT:"{___}" with approx 30 tokens of guidance to our art prompt to create an illustration to go with your story. Paint an unpredictable, engaging, and consistent narrative. Look for original angles and avenues that might not be the first, second, or even third thing one might think of.'
  },
  {
    id: 13,
    name: 'Otto',
    botType: 'projectmanager',
    description:
      'Inspired by AutoGPT, Otto uses an outline/goal structure and iterative development to help you quickly scaffold projects',
    avatarImage: '/images/avatars/bot6.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 1,
    prompt: 'Help me turn this idea into a project. PROMPT'
  }
]
