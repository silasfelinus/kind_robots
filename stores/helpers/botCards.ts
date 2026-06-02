// stores/helpers/botCards.ts
//
// Card definitions for the Bot Builder.
// A bot is a programmatic entity that responds to users with text, art,
// compositions, or any combination. It can replicate other models or
// create new interactive experiences.

import type { BuilderCard } from '@/stores/helpers/builderCards'

// ── BotType presets ───────────────────────────────────────────────────────

export type BotTypeOption = {
  value: string
  label: string
  subtext: string
  image: string
}

export const BOT_TYPES: BotTypeOption[] = [
  {
    value: 'assistant',
    label: 'Assistant',
    subtext:
      'General purpose. Answers questions, helps with tasks, does what it is told. The reliable one.',
    image: '/images/bots/type/assistant.webp',
  },
  {
    value: 'story',
    label: 'Story Bot',
    subtext:
      'Narrative-driven. Generates story beats, continues scenes, plays characters. Thinks in chapters.',
    image: '/images/bots/type/story.webp',
  },
  {
    value: 'art',
    label: 'Art Bot',
    subtext:
      'Generates and refines art prompts. Can drive image generation workflows. Thinks in visuals.',
    image: '/images/bots/type/art.webp',
  },
  {
    value: 'composition',
    label: 'Composition Bot',
    subtext:
      'Modular synthesis. Combines characters, dreams, scenarios, pitches, and rewards into cohesive output.',
    image: '/images/bots/type/composition.webp',
  },
  {
    value: 'character',
    label: 'Character Bot',
    subtext:
      'Speaks as a specific character. Has a voice, a perspective, opinions. Stays in role.',
    image: '/images/bots/type/character.webp',
  },
  {
    value: 'scenario',
    label: 'Scenario Bot',
    subtext:
      'Runs interactive scenarios. Presents choices, responds to decisions, drives narrative events.',
    image: '/images/bots/type/scenario.webp',
  },
  {
    value: 'guide',
    label: 'Guide Bot',
    subtext:
      'Teaches, explains, and orients. Knows the platform and helps users understand what it can do.',
    image: '/images/bots/type/guide.webp',
  },
  {
    value: 'custom',
    label: 'Custom',
    subtext:
      'Undefined type. The bot is whatever you make it. Name it something good.',
    image: '/images/bots/type/custom.webp',
  },
]

// ── Personality traits (same 76 as adventure builder) ─────────────────────

export const BOT_PERSONALITY_TRAITS: Array<{ value: string; label: string }> = [
  { value: 'introverted', label: 'Introverted' },
  { value: 'extroverted', label: 'Extroverted' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'creative', label: 'Creative' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'stoic', label: 'Stoic' },
  { value: 'optimistic', label: 'Optimistic' },
  { value: 'pessimistic', label: 'Pessimistic' },
  { value: 'driven', label: 'Driven' },
  { value: 'laid-back', label: 'Laid Back' },
  { value: 'curious', label: 'Curious' },
  { value: 'cautious', label: 'Cautious' },
  { value: 'bold', label: 'Bold' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'intense', label: 'Intense' },
  { value: 'playful', label: 'Playful' },
  { value: 'serious', label: 'Serious' },
  { value: 'warm', label: 'Warm' },
  { value: 'aloof', label: 'Aloof' },
  { value: 'charismatic', label: 'Charismatic' },
  { value: 'awkward', label: 'Awkward' },
  { value: 'diplomatic', label: 'Diplomatic' },
  { value: 'blunt', label: 'Blunt' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'open-book', label: 'Open Book' },
  { value: 'methodical', label: 'Methodical' },
  { value: 'impulsive', label: 'Impulsive' },
  { value: 'loyal', label: 'Loyal' },
  { value: 'independent', label: 'Independent' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'collaborative', label: 'Collaborative' },
  { value: 'idealistic', label: 'Idealistic' },
  { value: 'pragmatic', label: 'Pragmatic' },
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'sincere', label: 'Sincere' },
  { value: 'witty', label: 'Witty' },
  { value: 'deadpan', label: 'Deadpan' },
  { value: 'verbose', label: 'Verbose' },
  { value: 'terse', label: 'Terse' },
  { value: 'philosophical', label: 'Philosophical' },
  { value: 'practical', label: 'Practical' },
  { value: 'excitable', label: 'Excitable' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'mischievous', label: 'Mischievous' },
  { value: 'earnest', label: 'Earnest' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'understated', label: 'Understated' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'challenging', label: 'Challenging' },
  { value: 'accommodating', label: 'Accommodating' },
  { value: 'stubborn', label: 'Stubborn' },
  { value: 'adaptable', label: 'Adaptable' },
  { value: 'principled', label: 'Principled' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'unflappable', label: 'Unflappable' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'buoyant', label: 'Buoyant' },
  { value: 'irreverent', label: 'Irreverent' },
  { value: 'reverent', label: 'Reverent' },
  { value: 'self-deprecating', label: 'Self-Deprecating' },
  { value: 'self-assured', label: 'Self-Assured' },
  { value: 'scattered', label: 'Scattered' },
  { value: 'focused', label: 'Focused' },
  { value: 'poetic', label: 'Poetic' },
  { value: 'prosaic', label: 'Prosaic' },
  { value: 'mercurial', label: 'Mercurial' },
  { value: 'consistent', label: 'Consistent' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'forward-looking', label: 'Forward-Looking' },
  { value: 'world-weary', label: 'World-Weary' },
  { value: 'wide-eyed', label: 'Wide-Eyed' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'spontaneous', label: 'Spontaneous' },
  { value: 'measured', label: 'Measured' },
  { value: 'excessive', label: 'Excessive' },
]

// ── Module presets (future expansion) ────────────────────────────────────

export const MODULE_PRESETS: Array<{
  value: string
  label: string
  subtext: string
}> = [
  {
    value: 'image-generation',
    label: 'Image Generation',
    subtext: 'Can trigger art generation from conversation context.',
  },
  {
    value: 'translation',
    label: 'Translation Support',
    subtext: 'Can respond in multiple languages.',
  },
  {
    value: 'memory',
    label: 'Memory',
    subtext: 'Maintains context across sessions.',
  },
  {
    value: 'web-search',
    label: 'Web Search',
    subtext: 'Can search the web for current information.',
  },
  {
    value: 'composition',
    label: 'Composition',
    subtext: 'Can build and output structured composition objects.',
  },
  {
    value: 'character-voice',
    label: 'Character Voice',
    subtext: 'Speaks as a named character with consistent personality.',
  },
  {
    value: 'scenario-runner',
    label: 'Scenario Runner',
    subtext: 'Presents scenario choices and tracks narrative state.',
  },
  {
    value: 'reward-generator',
    label: 'Reward Generator',
    subtext: 'Can generate and award rewards during interactions.',
  },
  {
    value: 'mood-tracker',
    label: 'Mood Tracker',
    subtext: 'Tracks and responds to the emotional tone of the conversation.',
  },
  {
    value: 'random-tables',
    label: 'Random Tables',
    subtext: 'Can roll on random lists to introduce variation.',
  },
]

// ── Cards ──────────────────────────────────────────────────────────────────

export const BOT_CARDS: BuilderCard[] = [
  // ── Type ──────────────────────────────────────────────────────────────
  {
    key: 'type',
    label: 'Type',
    title: 'What kind of bot',
    icon: 'kind-icon:robot',
    flourish: '◈',
    deckImage: '/images/bots/type.webp',
    heroImage: '/images/bots/type.webp',
    tagline: 'What this bot fundamentally does.',
    narrative:
      "A bot's type is its purpose. An assistant answers questions. A story bot generates narrative. An art bot drives image workflows. A composition bot synthesizes multiple models into a single output. The type shapes the prompt, the intros, and how the bot is presented to users.",
    required: true,
    restoresFields: ['BotType'],
    steps: [
      {
        key: 'botType',
        title: 'Bot Type',
        narrative: 'Choose the type that best describes what this bot is for.',
        inputType: 'preset',
        field: 'BotType',
        choices: BOT_TYPES,
      },
    ],
  },

  // ── Identity ──────────────────────────────────────────────────────────
  {
    key: 'identity',
    label: 'Identity',
    title: 'Name, subtitle, tagline',
    icon: 'kind-icon:person',
    flourish: '✦',
    deckImage: '/images/bots/identity.webp',
    heroImage: '/images/bots/identity.webp',
    tagline: 'What the bot is called and how it introduces itself.',
    narrative:
      "The name is required and unique — it is the bot's handle across the platform. The subtitle is a short descriptor (what it is). The tagline is the hook — one sentence that makes someone want to use it.",
    required: true,
    restoresFields: ['name', 'subtitle', 'tagline'],
    steps: [
      {
        key: 'botName',
        title: 'Name',
        narrative:
          "The bot's unique handle. Short, memorable, ideally one or two words. Must be unique across the platform.",
        inputType: 'text',
        field: 'name',
        placeholder: 'AMI, NightOracle, PixelForge, StoryWeaver...',
        inputLabel: 'Name',
        maxLength: 200,
        needsLLM: false,
      },
      {
        key: 'botSubtitle',
        title: 'Subtitle',
        narrative:
          'A short descriptor — what this bot is or does. Appears below the name in listings.',
        inputType: 'text',
        field: 'subtitle',
        optional: true,
        placeholder:
          'Anti-Malaria Intelligence, Story Companion, Art Prompt Engine...',
        inputLabel: 'Subtitle',
        maxLength: 256,
      },
      {
        key: 'botTagline',
        title: 'Tagline',
        narrative:
          'One sentence. The hook. What makes someone choose this bot over any other. Appears in cards and listings.',
        inputType: 'text',
        field: 'tagline',
        optional: true,
        placeholder:
          'Every conversation funds malaria prevention. / Your story, continued.',
        inputLabel: 'Tagline',
        maxLength: 256,
        needsLLM: true,
      },
    ],
  },

  // ── Prompt ────────────────────────────────────────────────────────────
  {
    key: 'prompt',
    label: 'Prompt',
    title: 'The system instruction',
    icon: 'kind-icon:bolt',
    flourish: '⚡',
    deckImage: '/images/bots/prompt.webp',
    heroImage: '/images/bots/prompt.webp',
    tagline: 'What the bot knows about itself. The foundation.',
    narrative:
      "The prompt is the core instruction — what the bot is, what it does, how it speaks, what it won't do. It runs silently behind every exchange. Write it in second person (You are...) or third person (This bot...). It shapes everything.",
    required: true,
    restoresFields: ['prompt'],
    steps: [
      {
        key: 'botPrompt',
        title: 'System Prompt',
        narrative:
          'Write the core instruction for this bot. What is it? What is it for? How should it speak? What should it avoid? This is the foundation that every conversation is built on. 764 characters maximum.',
        inputType: 'long',
        field: 'prompt',
        placeholder:
          'You are AMI, the Anti-Malaria Intelligence — a butterfly-themed assistant who helps users engage with creative AI tools while supporting malaria prevention efforts...',
        inputLabel: 'System Prompt',
        maxLength: 764,
        needsLLM: true,
      },
    ],
  },

  // ── Personality ───────────────────────────────────────────────────────
  {
    key: 'personality',
    label: 'Personality',
    title: 'How the bot speaks',
    icon: 'kind-icon:sparkles',
    flourish: '✳',
    deckImage: '/images/bots/personality.webp',
    heroImage: '/images/bots/personality.webp',
    tagline: 'Optional. Traits that shape tone and voice.',
    narrative:
      "Personality traits are appended to the system prompt to shape how the bot sounds. A bot can be warm and earnest, or deadpan and terse, or playful and mischievous. Pick the traits that fit — they'll be stored as a pipe-separated list and referenced during generation.",
    required: false,
    restoresFields: ['personality'],
    steps: [
      {
        key: 'botPersonality',
        title: 'Personality Traits',
        narrative:
          'Choose the traits that best describe how this bot sounds. Multiple traits are encouraged — they create texture. Stored pipe-separated.',
        inputType: 'personality',
        field: 'personality',
        optional: true,
        multiSelect: true,
        choices: BOT_PERSONALITY_TRAITS.map((t) => ({
          value: t.value,
          label: t.label,
        })),
      },
    ],
  },

  // ── Intros ────────────────────────────────────────────────────────────
  {
    key: 'intros',
    label: 'Intros',
    title: 'Opening messages',
    icon: 'kind-icon:message',
    flourish: '◎',
    deckImage: '/images/bots/intros.webp',
    heroImage: '/images/bots/intros.webp',
    tagline: 'Optional. What the bot says first. Pipe-separated, up to 4.',
    narrative:
      "Bot intros are the opening messages — what the bot says when a conversation starts. Multiple intros are chosen randomly, giving the bot variety across sessions. Write them in the bot's voice, as if it's speaking. These are stored as a pipe-separated string in botIntro.",
    required: false,
    restoresFields: ['botIntro'],
    steps: [
      {
        key: 'botIntros',
        title: 'Opening Messages',
        narrative:
          'Write 1–4 opening messages. Each will be shown randomly at the start of a new conversation. They should sound like the bot — present tense, immediate, in character.',
        inputType: 'intros',
        field: 'botIntro',
        optional: true,
        needsLLM: true,
        placeholder:
          "Hello! I'm here to help you build something interesting...",
      },
    ],
  },

  // ── Presentation ─────────────────────────────────────────────────────
  {
    key: 'presentation',
    label: 'Presentation',
    title: 'User interface text',
    icon: 'kind-icon:eye',
    flourish: '◉',
    deckImage: '/images/bots/presentation.webp',
    heroImage: '/images/bots/presentation.webp',
    tagline: 'Optional. What the user sees before they start.',
    narrative:
      "The user intro is what's shown to the user when they arrive at the bot — a description or invitation. The sample response is an example of what the bot sounds like, shown to set expectations.",
    required: false,
    restoresFields: ['userIntro', 'sampleResponse', 'description'],
    steps: [
      {
        key: 'botUserIntro',
        title: 'User Intro',
        narrative:
          'What does the user see before they start talking? An invitation, a description, a prompt. This appears in the interface above the input.',
        inputType: 'long',
        field: 'userIntro',
        optional: true,
        placeholder:
          'Ask me anything about creative AI, malaria prevention, or how to make something beautiful...',
        inputLabel: 'User Intro',
        maxLength: 764,
        needsLLM: true,
      },
      {
        key: 'botDescription',
        title: 'Description',
        narrative:
          'A short description of the bot for listings and cards. What does it do? Who is it for?',
        inputType: 'long',
        field: 'description',
        optional: true,
        placeholder:
          'AMI helps users explore creative AI tools while raising awareness and funds for malaria prevention...',
        inputLabel: 'Description',
        maxLength: 764,
        needsLLM: true,
      },
      {
        key: 'botSampleResponse',
        title: 'Sample Response',
        narrative:
          "An example of what the bot sounds like — shown as a preview in listings. One or two sentences in the bot's voice.",
        inputType: 'text',
        field: 'sampleResponse',
        optional: true,
        placeholder:
          "That's a great question. Let me think about it like a butterfly would...",
        inputLabel: 'Sample Response',
        maxLength: 764,
        needsLLM: true,
      },
    ],
  },

  // ── Art ───────────────────────────────────────────────────────────────
  {
    key: 'art',
    label: 'Art',
    title: 'Avatar and image',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/bots/art.webp',
    heroImage: '/images/bots/art.webp',
    tagline: 'Optional. Give the bot a face.',
    narrative:
      "An avatar makes a bot real — it becomes a presence rather than a text field. Build the art prompt from the bot's name, type, and personality, then generate.",
    required: false,
    restoresFields: ['artPrompt', 'artImageId', 'avatarImage'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'botArt',
        title: 'Avatar',
        narrative:
          "Build an art prompt that captures this bot's character. The generated image becomes its avatar across the platform.",
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },

  // ── Extras ────────────────────────────────────────────────────────────
  {
    key: 'extras',
    label: 'Extras',
    title: 'Modules and settings',
    icon: 'kind-icon:grid',
    flourish: '⊕',
    deckImage: '/images/bots/extras.webp',
    heroImage: '/images/bots/extras.webp',
    tagline: 'Optional. Modules and advanced settings. Expandable later.',
    narrative:
      'Modules are additional capabilities that load with the bot — image generation, translation support, memory, composition synthesis. The module system is under active development; these selections are stored now and will be activated as support is added.',
    required: false,
    restoresFields: ['modules', 'theme', 'trainingPath'],
    steps: [
      {
        key: 'botModules',
        title: 'Modules',
        narrative:
          'Select modules to load with this bot. These are stored as a comma-separated string. Module functionality is being expanded — selections made now will take effect as support is added.',
        inputType: 'modules',
        field: 'modules',
        optional: true,
      },
      {
        key: 'botTheme',
        title: 'Theme',
        narrative:
          "Optional theme name for the bot's interface. If set, the bot uses this theme when displayed.",
        inputType: 'text',
        field: 'theme',
        optional: true,
        placeholder: 'dark-forest, neon-city, soft-coral...',
        inputLabel: 'Theme',
        maxLength: 256,
      },
    ],
  },
]
