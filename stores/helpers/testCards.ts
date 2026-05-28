// /stores/helpers/testCards.ts
import type {
  BuilderCard,
  BuilderSplash,
  BuilderStatEntry,
} from '@/stores/helpers/builderCards'
import type { BuilderRewardOption } from '@/stores/helpers/builderCards'

export type BuilderTestSheet = {
  name: string
  genre: string
  mood: string
  description: string
  weirdList: string
  artPrompt: string
  imagePath: string | null
  artImageId: number | null
  stats: BuilderStatEntry[]
  rewards: Record<string, BuilderRewardOption>
  isPublic: boolean
  isMature: boolean
}

export const BUILDER_TEST_SPLASH: BuilderSplash = {
  title: 'Builder Test Lab',
  subtitle: 'A harmless little proving ground for reusable builder chaos.',
  description:
    'This does not touch Adventure. It exists only to test the abstract builder flow before we let it near the nice furniture.',
  imagePath: '/images/stage/utility/splash.webp',
  startLabel: 'Begin the Experiment',
  randomLabel: 'Randomize the Gremlin',
}

export function defaultBuilderTestStats(): BuilderStatEntry[] {
  return [
    { key: 'spark', name: 'Spark', display: '✨', value: 0 },
    { key: 'nerve', name: 'Nerve', display: '⚡', value: 0 },
    { key: 'wit', name: 'Wit', display: '🧠', value: 0 },
    { key: 'style', name: 'Style', display: '🎭', value: 0 },
    { key: 'luck', name: 'Luck', display: '🍀', value: 0 },
    { key: 'weird', name: 'Weird', display: '🌀', value: 0 },
  ]
}

export function defaultBuilderTestSheet(): BuilderTestSheet {
  return {
    name: '',
    genre: '',
    mood: '',
    description: '',
    weirdList: '',
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    stats: defaultBuilderTestStats(),
    rewards: {},
    isPublic: true,
    isMature: false,
  }
}

export const BUILDER_TEST_REWARDS: BuilderRewardOption[] = [
  {
    id: 'pocket-thunder',
    label: 'Pocket Thunder',
    rarity: 'COMMON',
    description: 'Once per scene, make a tiny dramatic noise that makes everyone briefly reconsider their choices.',
  },
  {
    id: 'bureaucratic-immunity',
    label: 'Bureaucratic Immunity',
    rarity: 'UNCOMMON',
    description: 'Ignore one boring consequence by producing a form nobody wants to read.',
  },
  {
    id: 'haunted-confidence',
    label: 'Haunted Confidence',
    rarity: 'RARE',
    description: 'Act with total certainty while a ghost provides terrible but enthusiastic encouragement.',
  },
]

export const BUILDER_TEST_CARDS: BuilderCard[] = [
  {
    key: 'identity',
    label: 'Identity',
    title: 'Name the specimen',
    icon: 'kind-icon:signature',
    flourish: '✒',
    deckImage: '/images/adventure/thumb/name.webp',
    heroImage: '/images/adventure/hero/name.webp',
    tagline: 'The clipboard demands a name.',
    narrative:
      'Every test subject needs a label. Otherwise the lab notes become emotionally complicated.',
    required: true,
    restoresFields: ['name'],
    steps: [
      {
        key: 'name',
        title: 'Test Subject Name',
        narrative:
          'Give this experimental builder creature a name. Something charming, alarming, or legally ambiguous.',
        inputType: 'text',
        field: 'name',
        inputLabel: 'Name',
        placeholder: 'Professor Buttoncrime, Unit Soup, The Mild Omen...',
        generatorKey: 'givenName',
        suggestInstruction:
          'Generate a funny, vivid name for a test subject in a whimsical builder UI.',
      },
    ],
  },
  {
    key: 'genre',
    label: 'Genre',
    title: 'Pick the operating genre',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    deckImage: '/images/adventure/thumb/role.webp',
    heroImage: '/images/adventure/hero/role.webp',
    tagline: 'A genre is just gravity with better lighting.',
    narrative:
      'Choose the genre-field this tiny test creature lives inside. Science insists this matters.',
    required: true,
    restoresFields: ['genre'],
    steps: [
      {
        key: 'genre',
        title: 'Genre Field',
        narrative:
          'Select a genre. This checks preset cards, custom values, list expansion, and the whole card-grid situation.',
        inputType: 'preset',
        field: 'genre',
        choices: [
          {
            value: 'Cozy Goblinpunk',
            label: 'Cozy Goblinpunk',
            subtext: 'Tea, tools, questionable wiring.',
            image: '/images/adventure/genre/cozy.webp',
          },
          {
            value: 'Bureaucratic Fantasy',
            label: 'Bureaucratic Fantasy',
            subtext: 'The dragon requires three signatures.',
            image: '/images/adventure/genre/fantasy.webp',
          },
          {
            value: 'Cosmic Comedy',
            label: 'Cosmic Comedy',
            subtext: 'The void has timing.',
            image: '/images/adventure/genre/cosmic.webp',
          },
          {
            value: '',
            label: 'More genres',
            subtext: 'A list drawer test wearing a genre hat.',
            opensList: true,
            listOptions: [
              'Municipal Necromancy',
              'Haunted Office Drama',
              'Goblin Shark Tank',
              'Tender Apocalypse',
              'Noir With One Wrong Lamp',
            ],
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Custom input test. Extremely official.',
            opensCustom: true,
          },
        ],
      },
    ],
  },
  {
    key: 'mood',
    label: 'Mood',
    title: 'Select the emotional weather',
    icon: 'kind-icon:heart',
    flourish: '☁',
    deckImage: '/images/adventure/thumb/personality.webp',
    heroImage: '/images/adventure/hero/personality.webp',
    tagline: 'The vibes have entered evidence.',
    narrative:
      'Mood tells the interface what kind of nonsense to expect. Very scientific. Lab coat pending.',
    required: true,
    restoresFields: ['mood'],
    steps: [
      {
        key: 'mood',
        title: 'Mood',
        narrative:
          'Pick multiple moods. This tests multi-select values without threatening the real character builder.',
        inputType: 'preset',
        field: 'mood',
        multiSelect: true,
        choices: [
          {
            value: 'curious',
            label: 'Curious',
            subtext: 'Wants to open the box. Already has scissors.',
          },
          {
            value: 'dramatic',
            label: 'Dramatic',
            subtext: 'Every button is a monologue opportunity.',
          },
          {
            value: 'suspicious',
            label: 'Suspicious',
            subtext: 'The dropdown knows too much.',
          },
          {
            value: 'optimistic',
            label: 'Optimistic',
            subtext: 'The build will pass. Adorable.',
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'A mood only a custom text field could love.',
            opensCustom: true,
          },
        ],
      },
    ],
  },
  {
    key: 'description',
    label: 'Description',
    title: 'Describe the little problem',
    icon: 'kind-icon:story',
    flourish: '§',
    deckImage: '/images/adventure/thumb/background.webp',
    heroImage: '/images/adventure/hero/background.webp',
    tagline: 'A paragraph enters. A feature emerges.',
    narrative:
      'This checks the long text path and LLM suggest flow without poking Adventure in the ribs.',
    required: true,
    restoresFields: ['description'],
    steps: [
      {
        key: 'description',
        title: 'Description',
        narrative:
          'Write a short description of this test creature. Hit suggest to verify the generic suggest route.',
        inputType: 'long',
        field: 'description',
        inputLabel: 'Description',
        placeholder:
          'A tiny UI gremlin wearing a lab badge, muttering about reactive state...',
        needsLLM: true,
        suggestInstruction:
          'Write a vivid, funny 2 to 4 sentence description for a fake test model used to validate a reusable builder UI.',
      },
    ],
  },
  {
    key: 'weird-list',
    label: 'List',
    title: 'Add a suspicious list',
    icon: 'kind-icon:list',
    flourish: '☷',
    deckImage: '/images/adventure/thumb/origin.webp',
    heroImage: '/images/adventure/hero/origin.webp',
    tagline: 'Lists are where gremlins organize their crimes.',
    narrative:
      'This tests list input behavior without pretending we are ready for advanced relation pickers yet.',
    required: false,
    restoresFields: ['weirdList'],
    steps: [
      {
        key: 'weirdList',
        title: 'Weird List',
        narrative:
          'Pick or write a list item. This is mostly here to make sure list input survives first contact.',
        inputType: 'list',
        field: 'weirdList',
        inputLabel: 'List Item',
        placeholder: 'A tiny screwdriver, a cursed receipt, three beans...',
        listOptions: [
          'Cursed receipt',
          'Tiny screwdriver',
          'Emergency glitter',
          'Mysterious bean',
          'Backup moustache',
        ],
      },
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    title: 'Assign fake numbers',
    icon: 'kind-icon:activity',
    flourish: '♛',
    deckImage: '/images/adventure/thumb/stats.webp',
    heroImage: '/images/adventure/hero/stats.webp',
    tagline: 'Six numbers. Zero accountability.',
    narrative:
      'Stats are abstract. The compiler is unimpressed but listening.',
    required: true,
    restoresFields: ['stats'],
    steps: [
      {
        key: 'stats',
        title: 'Stats',
        narrative:
          'Assign 1 through 6 to each test stat. This proves the generic stat input works outside Adventure.',
        inputType: 'stats',
      },
    ],
  },
  {
    key: 'reward',
    label: 'Reward',
    title: 'Choose a test reward',
    icon: 'kind-icon:gift',
    flourish: '✦',
    deckImage: '/images/adventure/thumb/common-skill.webp',
    heroImage: '/images/adventure/hero/common-skill.webp',
    tagline: 'A reward, but emotionally noncommittal.',
    narrative:
      'This checks reward slot behavior in the generic builder store.',
    required: true,
    rewardSlotKey: 'test-reward',
    restoresFields: ['test-reward'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'testReward',
        title: 'Test Reward',
        narrative:
          'Pick one reward. If this works, reward-shaped models become much less annoying.',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'visibility',
    label: 'Visibility',
    title: 'Public or mysterious',
    icon: 'kind-icon:eye',
    flourish: '◉',
    deckImage: '/images/adventure/thumb/identity.webp',
    heroImage: '/images/adventure/hero/identity.webp',
    tagline: 'Privacy settings, but make them theatrical.',
    narrative:
      'This checks boolean sheet fields and the visibility input.',
    required: false,
    restoresFields: ['isPublic', 'isMature'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'visibility',
        title: 'Visibility',
        narrative:
          'Choose whether this test creature is public and whether it should be treated as mature content.',
        inputType: 'visibility',
      },
    ],
  },
  {
    key: 'art',
    label: 'Art',
    title: 'Portrait prompt',
    icon: 'kind-icon:art',
    flourish: '✺',
    deckImage: '/images/adventure/thumb/art.webp',
    heroImage: '/images/adventure/hero/art.webp',
    tagline: 'The test subject demands a portrait.',
    narrative:
      'This verifies generic art prompt updates without touching the Adventure art flow.',
    required: true,
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'art',
        title: 'Art Prompt',
        narrative:
          'Generate or edit a visual prompt. This is still only the generic builder flow, not image generation itself.',
        inputType: 'art',
        field: 'artPrompt',
        needsLLM: true,
        suggestInstruction:
          'Write a vivid AI image prompt for a whimsical UI test creature. Mention strong silhouette, playful expression, and readable fantasy UI styling.',
      },
    ],
  },
]