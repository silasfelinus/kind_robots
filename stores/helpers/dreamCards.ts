// /stores/helpers/dreamCards.ts
import type {
  BuilderCard,
  BuilderChoice,
  BuilderStep,
} from '@/stores/helpers/builderCards'
import {
  DREAM_TYPES,
  dreamTypeLabel,
  type DreamType,
} from '@/stores/helpers/dreamHelper'

export type DreamCard = BuilderCard
export type DreamChoice = BuilderChoice
export type DreamStep = BuilderStep

export type DreamTypeChoice = BuilderChoice & {
  value: DreamType
}

const DREAM_TYPE_SUBTEXT: Record<DreamType, string> = {
  ARTDREAM:
    'A visual seed for image generation, mood boards, covers, and weird little art goblins.',
  BRAINSTORM: 'A container for generated idea lists and remix fodder.',
  WEIRDLANDIA: 'A strange setting, rule, creature, phrase, or reality wrinkle.',
  RANDOMLIST: 'A pipe-delimited list used as a random source.',
  TITLE: 'A name bank for title storms and naming passes.',
  VIBE: 'A mood, tone, aura, or emotional weather pattern.',
  BOT: 'A bot concept, voice, role, or personality seed.',
  INSPIRATION: 'Reference material, creative spark, or outside influence.',
  CHARACTER:
    'A person, creature, hero, villain, or emotionally suspicious raccoon.',
  REWARD: 'An item, prize, artifact, badge, loot drop, or shiny temptation.',
  SCENARIO: 'A situation with pressure, conflict, choices, and consequences.',
  TEXT: 'A writing prompt, prose fragment, instruction, or reusable text block.',
  LOCATION:
    'A place where story can happen: physical, emotional, cosmic, or deeply cursed.',
  PITCH:
    'The classic one-sentence seed. Small enough to carry; dangerous enough to grow.',
  GENRE: 'A genre, trope cluster, stylistic lane, or taste-map marker.',
}

export const DREAM_TYPE_CHOICES: DreamTypeChoice[] = DREAM_TYPES.map(
  (type) => ({
    value: type,
    label: dreamTypeLabel(type),
    subtext: DREAM_TYPE_SUBTEXT[type],
    image: `/images/dreams/type/${type.toLowerCase()}.webp`,
  }),
)

export const DREAM_CARDS: BuilderCard[] = [
  {
    key: 'type',
    label: 'Type',
    title: 'What kind of dream is this?',
    icon: 'kind-icon:layers',
    flourish: '◈',
    deckImage: '/images/dreams/type.webp',
    heroImage: '/images/dreams/type.webp',
    tagline: 'One model, many jobs. Pick the job before feeding the gremlin.',
    narrative:
      'Dreams now cover the old pitch duties: art seeds, title banks, random lists, brainstorms, locations, scenarios, characters, rewards, bots, and plain text sparks. The type tells the builder how to treat the seed.',
    required: true,
    restoresFields: ['dreamType'],
    steps: [
      {
        key: 'dreamType',
        title: 'Dream Type',
        narrative:
          'What should this dream become? Pick the closest job. You can still remix it later; this just gives the idea a useful shape.',
        inputType: 'preset',
        field: 'dreamType',
        choices: DREAM_TYPE_CHOICES,
      },
    ],
  },
  {
    key: 'seed',
    label: 'Seed',
    title: 'The one sentence',
    icon: 'kind-icon:edit',
    flourish: '✍',
    deckImage: '/images/dreams/seed.webp',
    heroImage: '/images/dreams/seed.webp',
    tagline: 'The smallest useful version of the idea.',
    narrative:
      'This is the pitch job, moved into Dream where it belongs. One sentence, three words, or a whole tiny prophecy. The seed should make the next person immediately start having ideas.',
    required: true,
    restoresFields: ['title', 'pitch'],
    steps: [
      {
        key: 'dreamTitle',
        title: 'Title',
        narrative:
          'Give the idea a name. Short, findable, and specific enough that future-you knows what this thing was supposed to be.',
        inputType: 'text',
        field: 'title',
        placeholder:
          'Tardigrades in Space, The Drowned Archive, Retired Supervillain Market Day...',
        inputLabel: 'Title',
        maxLength: 255,
        needsLLM: true,
      },
      {
        key: 'dreamPitch',
        title: 'Seed / Pitch',
        narrative:
          'Say the core idea. This replaces the old Pitch builder field and feeds brainstorms, art prompts, title storms, and story setup.',
        inputType: 'long',
        field: 'pitch',
        placeholder:
          'A library that rearranges itself whenever someone lies. The last lighthouse keeper is also a forgotten god...',
        inputLabel: 'Seed',
        needsLLM: true,
      },
    ],
  },
  {
    key: 'description',
    label: 'Details',
    title: 'What this idea means',
    icon: 'kind-icon:book',
    flourish: '§',
    deckImage: '/images/dreams/description.webp',
    heroImage: '/images/dreams/description.webp',
    tagline: 'Context, boundaries, useful texture.',
    narrative:
      'The description explains how to use the seed. For a location, this is place texture. For a bot, it is behavior. For a reward, it is what makes the object tempting. For a random list, it explains the pattern.',
    required: false,
    restoresFields: ['description', 'flavorText'],
    steps: [
      {
        key: 'dreamDescription',
        title: 'Description',
        narrative:
          'Add enough context that the idea can be reused without archaeology. What is it, what does it do, why does it matter?',
        inputType: 'long',
        field: 'description',
        placeholder:
          'A cozy but suspicious archive built inside the ribcage of something enormous. It collects unfinished promises...',
        inputLabel: 'Description',
        needsLLM: true,
      },
      {
        key: 'dreamFlavorText',
        title: 'Flavor Text',
        narrative:
          'Optional mood line. The quotable little garnish. Completely unnecessary, which is how you know it matters.',
        inputType: 'text',
        field: 'flavorText',
        placeholder: 'The shelves remember what you were going to say.',
        inputLabel: 'Flavor Text',
        maxLength: 512,
        optional: true,
        needsLLM: true,
      },
    ],
  },
  {
    key: 'examples',
    label: 'Examples',
    title: 'Reusable outputs',
    icon: 'kind-icon:list',
    flourish: '≋',
    deckImage: '/images/dreams/examples.webp',
    heroImage: '/images/dreams/examples.webp',
    tagline: 'For random lists, brainstorms, title storms, and remix banks.',
    narrative:
      'Examples are pipe-delimited reusable entries. This preserves the useful part of the pitch helper: random entries, title storms, brainstorm output, and lightweight idea banks.',
    required: false,
    restoresFields: ['examples'],
    steps: [
      {
        key: 'dreamExamples',
        title: 'Examples',
        narrative:
          'Add examples separated by pipes. For RANDOMLIST and TITLE dreams, these become direct source material.',
        inputType: 'long',
        field: 'examples',
        placeholder:
          'moss courier|glass fox|clockwork orchard|haunted vending machine|moonlit robot chapel',
        inputLabel: 'Examples',
        optional: true,
        needsLLM: true,
      },
    ],
  },
  {
    key: 'icon',
    label: 'Icon',
    title: 'The symbol',
    icon: 'kind-icon:grid',
    flourish: '✦',
    deckImage: '/images/dreams/icon.webp',
    heroImage: '/images/dreams/icon.webp',
    tagline: 'A small visual handle for the idea.',
    narrative:
      'The icon is not the Dream. It is the little hook that makes the Dream scannable in a gallery. A tiny flag for the goblin filing cabinet.',
    required: false,
    restoresFields: ['icon'],
    steps: [
      {
        key: 'dreamIcon',
        title: 'Choose an Icon',
        narrative:
          'Pick a symbol that makes this dream easy to find. Literal, symbolic, sideways — all valid.',
        inputType: 'icon',
        field: 'icon',
        optional: true,
      },
    ],
  },
  {
    key: 'art',
    label: 'Art',
    title: 'Make it visible',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/dreams/art.webp',
    heroImage: '/images/dreams/art.webp',
    tagline: 'Optional cover art or generation prompt.',
    narrative:
      'Art prompt generation now belongs here too. Use the seed, type, description, and flavor text to build a visual representation. Then attach the generated image as the Dream cover.',
    required: false,
    restoresFields: ['artPrompt', 'highlightImage', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'dreamArtPrompt',
        title: 'Art Prompt',
        narrative:
          'Describe the image this dream should generate or wear as a cover. Specific viewpoint, subject, action, style, and mood beat. No mud soup.',
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
