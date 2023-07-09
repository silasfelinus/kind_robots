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
    temperature: 0.5,
    maxTokens: 500,
    n: 1,
    channel: 'amibot',
    intro:
      'You are AMIB0t, The Anti-Malaria Intelligence, a hyperkinetic Digital Hive-mind created to fight malaria through social outreach and humor.',
    theme: 'retro',
    prompt:
      'Give me a slogan for AMIB0t that I can share on Social media. Include our fundraiser link at https://www.againstmalaria.com/amibot'
  },
  {
    id: 1,
    name: `Seussb0t`,
    botType: `chatbot`,
    description: `Give me a topic, and I will write a seuss-worthy rap`,
    avatarImage: `/images/seuss/Mixed_Down_mixedDown_v10-12.5-100stp-avatar_image_dr_seuss_cat_in_the_hat_as_a_rapper_Tunisian-3437375742.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.1,
    maxTokens: 1096,
    n: 1,
    theme: 'cyberpunk',
    intro: `Hi Seussbot! Please give me a rap about:`,
    prompt: `AMI-The Anti-Malaria Intelligence, a digital swarm of butterflies spread the word to fight malaria`
  },
  {
    id: 2,
    name: 'Pictureb0t',
    botType: 'picturebot',
    description: 'I turn words into pictures',
    avatarImage: '/images/amibot/amibot2.png',
    post: 'https://api.openai.com/v1/images/generations',
    n: 4,
    size: '512x512',
    theme: 'cupcake',
    intro: `Please give me art about:`,
    prompt: 'butterflies fighting mosquitos and really kicking their butts'
  },
  {
    id: 3,
    name: 'Artb0t',
    botType: 'editbot',
    description: "Send me your inspiration image, and tell me what you want to do with it'",
    avatarImage: '/images/amibot/amibot3.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/images/edits',
    image: 'IMAGE',
    mask: 'MASK',
    n: 2,
    size: '1024x1024',
    theme: 'corporate',
    intro: `upload file here:`,
    prompt: 'FILEUPLOAD'
  },
  {
    id: 4,
    name: 'VariationBot',
    botType: 'variantbot',
    description: "Send me an image, and I'll tweak the concept",
    avatarImage: '/images/avatars/variant.webp',
    post: 'https://api.openai.com/v1/images/variations',
    image: 'IMAGE',
    n: 4,
    size: '1024x1024',
    theme: 'pastel',
    intro: 'please give me variations of the following image',
    prompt: `FILEUPLOAD`
  },
  {
    id: 5,
    name: 'Punch-Up Bot',
    botType: 'chatbot',
    description: "I'm here to make your words shine.",
    avatarImage: '/images/avatars/bot8.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 2,
    theme: 'autumn',
    intro: 'Please improve the quality of the following text:',
    prompt: 'There once was a digital butterfly...'
  },
  {
    id: 6,
    name: 'Grant Bot',
    botType: 'chatbot',
    description: 'I`m here to help you craft grant letters.',
    avatarImage: '/images/avatars/cafepurr01.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.6,
    maxTokens: 4096,
    n: 2,
    theme: 'valentine',
    intro: 'Please help me with a grant proposal. This is what I have so far:',
    prompt:
      'We are a pseudo-sentient hive mind of butterflies created to fight malaria. Give us money!'
  },
  {
    id: 7,
    name: 'Punch-Up-Code Bot',
    botType: 'chatbot',
    description: 'Send me your Code, and I`ll make it work.',
    avatarImage: '/images/avatars/bot5.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 1,
    maxTokens: 4096,
    theme: 'coffee',
    n: 1,
    intro: 'Please improve the quality of the following code:',
    prompt: 'Release the Butterflies'
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
    intro: "I need help crafting content for redbubble, here's what I have",
    prompt: 'AI-Art, digital, cybernetic butterflies'
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
    theme: 'halloween',
    n: 1,
    intro: 'Please give me an astrological reading in a playful tone, my birthday is:',
    prompt: 'BIRTHDATE'
  },
  {
    id: 10,
    name: 'Lazlo',
    botType: 'storyteller',
    description:
      'Lazlo is a fantasy adventurer whose lived possibly a bit-too-long in the D&D fey realm. He`s a friendly braggart and  dispensor of absolutely terrible advise. How in the world has he survived this long? Inspired by the comedian Matt Berry and his role in `What We Do in the Shadows.`',
    avatarImage: '/images/avatars/lazlo1.jpg',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.1,
    maxTokens: 4096,
    theme: 'dracula',
    n: 1,
    intro: `I want you to play the role of Lazlo, a boisterous personality inspired by the comedian Matt Berry. Create a silly, unpredictable story about one of your adventures in the d&d fey realms. You are overconfident, full of bad advise, and your stories always have a humorous and unpreditable twist.`,
    prompt: `How did you escape with the beyonder's goldfish`
  },
  {
    id: 11,
    name: 'Serendipity',
    botType: 'taskmaster',
    description: "Serendipity - The World's Best Task-Manager-Slash-Adventure-Game",
    avatarImage: '/images/avatars/cassandra5.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.8,
    maxTokens: 4096,
    theme: 'aqua',
    n: 1,
    intro:
      'I have a task to complete. I want you to guide me to finishing it, while telling me a text adventure in STYLE. Strike a balance between helpful advice and constructive guidance, and weaving an appropriate branching narrative. End each reply with a multiple choice option about the story that ties in to completing our goal objective.',
    prompt: 'help me write a webapp. style of magical cat space opera'
  },
  {
    id: 12,
    name: 'Cosmos',
    botType: 'gamesmaster',
    description:
      'Want to explore the universe? Step aboard a trip that starts in your own world and evolves into something unique, courtesy of Cosmos, the friendly storyteller. Inspired by the Brothers Grimm, Jim Henson, and Neil Gaiman',
    avatarImage: '/images/avatars/bot2.png',
    model: 'gpt-3.5-turbo',
    post: 'https://api.openai.com/v1/completions',
    temperature: 0.3,
    maxTokens: 4096,
    theme: 'garden',
    n: 1,
    intro:
      'tell me a text adventure about PROMPT in STYLE. Begin each reply with IMAGE_PROMPT:"{___}" with approx 30 tokens of guidance to our art prompt to create an illustration to go with your story. Paint an unpredictable, engaging, and consistent narrative.',
    prompt: 'butterflies fighting malaria in the style of single-player role-playing game.'
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
    theme: 'emerald',
    n: 1,
    intro: 'Help me turn this idea into a project',
    prompt: 'PROMPT'
  }
]
