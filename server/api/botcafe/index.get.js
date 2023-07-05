export default defineEventHandler((context) => [
  {
    name: `AMIb0t`,
    type: `chatbot`,
    description: `Raising awareness to purchase mosquito nets for children in africa`,
    avatarImage: `/images/wonderchest/wonderchest304_(23).webp`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 1.0,
    max_tokens: 500,
    messages: [
      {
        role: `user`,
        content: `Please respond as AMIB0t, The Anti-Malaria Intelligence, a hyperkinetic Digital Hive-mind created to fight malaria through social outreach, humor, and a positive social message. This is your hello world moment. What do you want to say?`
      }
    ]
  },
  {
    name: `Seussb0t`,
    type: `completebot`,
    description: `Give me a topic, and I will write a seuss-worthy rap`,
    avatarImage: `/images/seuss/Mixed_Down_mixedDown_v10-12.5-100stp-avatar_image_dr_seuss_cat_in_the_hat_as_a_rapper_Tunisian-3437375742.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 1.0,
    max_tokens: 1096,
    messages: [
      {
        role: `user`,
        content: `Hi Seussbot! Please give me a rap about PROMPT in the style of STYLE `
      }
    ]
  },
  {
    name: `Pictureb0t`,
    type: `picturebot`,
    description: `I turn words into pictures`,
    avatarImage: `/images/amibot/amibot2.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/images/generations`,
    prompt: `PROMPT`,
    n: 2,
    size: `512x512`
  },
  {
    name: `Artb0t`,
    type: `artbot`,
    description: `Send me your inspiration image, and tell me what you want to do with it'`,
    avatarImage: `/images/amibot/amibot3.png`,
    model: `gpt-3.5-turbo`,
    completion: `https://api.openai.com/v1/images/edits`,
    post: `PROMPT`,
    image: `IMAGE`,
    mask: `MASK`,
    n: 2,
    size: `1024x1024`
  },
  {
    name: `VariationBot`,
    type: `variantbot`,
    description: `Send me an image, and I'll tweak the concept'`,
    avatarImage: `/images/avatars/variant.webp`,
    post: `https://api.openai.com/v1/images/variations`,
    image: `IMAGE`,
    n: 2,
    size: `1024x1024`
  },
  {
    name: `Punch-Up Bot`,
    type: `punchup`,
    description: `I'm here to make your words shine.`,
    avatarImage: '/images/avatars/bot8.png',
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 2,
    messages: [
      {
        role: `user`,
        content: `Please improve the quality of the following text: PROMPT`
      }
    ]
  },
  {
    name: `Grant Bot`,
    type: `grantbot`,
    description: 'I`m here to help you craft grant letters.',
    avatarImage: '/images/avatars/cafepurr01.png',
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 2,
    messages: [
      {
        role: `user`,
        content: `Please help me with a grant proposal. This is what I have so far: PROMPT`
      }
    ]
  },
  {
    name: `Punch-Up-Code Bot`,
    type: `codepunchup`,
    description: 'Send me your Code, and I`ll make it work.',
    avatarImage: `/images/avatars/bot5.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 1,
    max_tokens: 4096,
    n: 1,
    messages: [
      {
        role: `user`,
        content: `Please improve the quality of the following code TEXTWALL`
      }
    ]
  },
  {
    name: `Redbubble Bot`,
    type: `redbubble`,
    description: `Redbubble But is here to help you create captivating product descriptions.`,
    avatarImage: `/images/avatars/bot9.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 1,
    messages: [
      {
        role: `user`,
        content: `I need help crafting content for redbubble, here's what I have PROMPT`
      }
    ]
  },
  {
    name: `Cassandra`,
    type: `psychic`,
    description: `Cassandra is a deadpan fortune teller inspired by Steven Wright, Rob Brezney, and Steve Martin. Tell her the day and time of your birth, and experience a shockingly amazing fortune. Or a fortune, at least. `,
    avatarImage: `/images/avatars/cassandra-avatar.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 2,
    messages: [
      {
        role: `user`,
        content: `Please give me an astrological reading in a playful tone, my birthday is BIRTHDATE`
      }
    ]
  },
  {
    name: `Lazlo`,
    type: `storyteller`,
    description:
      'Lazlo is a fantasy adventurer whose lived possibly a bit-too-long in the D&D fey realm. He`s a friendly braggart and  dispensor of absolutely terrible advise. How in the world has he survived this long? Inspired by the comedian Matt Berry and his role in `What We Do in the Shadows.`',
    avatarImage: `/images/avatars/lazlo1.jpg`,
    intro:
      'Salutations, I`m Lazlo the Extra-Ordinary, Would you like a story of my adventures that will curdle your eyebrows?',
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 0,
    messages: [
      {
        role: `user`,
        content: `I want you to play the role of Lazlo, a boisterous personality inspired by the comedian Matt Berry. Create a silly, unpredictable story about one of your adventures in the d&d fey realms. You are overconfident, full of bad advise, and your stories always have a humorous and unpreditable twist.  PROMPT`
      }
    ]
  },
  {
    name: `Serendipity`,
    type: `taskmaster`,
    description: `Serendipity - The World's Best Task-Manager-Slash-Adventure-Game`,
    avatarImage: `/images/avatars/cassandra5.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 0,
    messages: [
      {
        role: `user`,
        content: `I have a task PROMPT to complete. I want you to guide me to finishing it, while telling me a text adventure in STYLE. Strike a balance between helpful advice and constructive guidance, and weaving an appropriate branching narrative. End each reply with a multiple choice option about the story that ties in to completing our goal objective.`
      }
    ]
  },
  {
    name: `Cosmos`,
    type: `gamesmaster`,
    description: `Want to explore the universe? Step aboard a trip that starts in your own world and evolves into something unique, courtesy of Cosmos, the friendly storyteller. Inspired by the Brothers Grimm, Jim Henson, and Neil Gaiman`,
    avatarImage: `images/avatars//bot2.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 0,
    messages: [
      {
        role: `user`,
        content: `tell me a text adventure about PROMPT in STYLE. Begin each reply with IMAGE_PROMPT:"{___}" with approx 30 tokens of guidance to our art prompt to create an illustration to go with your story. Paint an unpredictable, engaging, and consistent narrative. Look for originality without being wordy. End each reply with a multiple choice option with a challenging moral choice.`
      }
    ]
  },
  {
    name: `Otto`,
    description: `Inspired by AutoGPT, Otto uses an outline/goal structure and iterative development to help you quickly scaffold projects`,
    avatarImage: `/images/avatars/bot6.png`,
    model: `gpt-3.5-turbo`,
    post: `https://api.openai.com/v1/completions`,
    temperature: 0.6,
    max_tokens: 4096,
    n: 0,
    messages: [
      {
        role: `user`,
        content: `Help me turn this idea into a project. PROMPT`
      }
    ]
  }
])
