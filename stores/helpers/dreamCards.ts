// stores/helpers/dreamCards.ts
//
// Card definitions for the Dream Builder.
// A Dream is a location, vibe, mood, or space — somewhere a story can happen.
// Could be a physical place, a psychological state, an atmospheric condition,
// or something harder to categorise.
import type {
  BuilderCard,
  BuilderChoice,
  BuilderStep,
} from '@/stores/helpers/builderCards'

export type DreamCard = BuilderCard
export type DreamChoice = BuilderChoice
export type DreamStep = BuilderStep

// ── Atmosphere categories ──────────────────────────────────────────────────
// Used as an optional vibe tag — not stored directly but informs the LLM
// and helps users navigate the gallery. Written into description/vibeTag.

export type AtmosphereTag = {
  key: string
  label: string
  subtext: string
  image?: string
}

export const ATMOSPHERE_TAGS: AtmosphereTag[] = [
  // Physical — natural
  {
    key: 'forest',
    label: 'Forest',
    subtext: 'Something lives here that was here before you.',
  },
  { key: 'ocean', label: 'Ocean', subtext: 'The horizon goes all the way.' },
  {
    key: 'mountain',
    label: 'Mountain',
    subtext: 'The air is different up here. So is the thinking.',
  },
  {
    key: 'cave',
    label: 'Cave / Depth',
    subtext: 'Dark in the way that means old.',
  },
  {
    key: 'desert',
    label: 'Desert',
    subtext: 'The silence is not empty. It is very full of nothing.',
  },
  {
    key: 'wetland',
    label: 'Wetland / Bog',
    subtext: 'Alive in ways that are difficult to categorise.',
  },
  {
    key: 'sky',
    label: 'Sky / Aerial',
    subtext: 'The ground is a rumour from here.',
  },
  {
    key: 'underground',
    label: 'Underground',
    subtext: 'Built, dug, or worn into being. Possibly all three.',
  },
  // Physical — built
  {
    key: 'city',
    label: 'City',
    subtext: 'Everyone here wants something and most of them are moving.',
  },
  {
    key: 'village',
    label: 'Village',
    subtext:
      'Small enough that everyone knows. Too small for that to be comfortable.',
  },
  {
    key: 'ruin',
    label: 'Ruin',
    subtext: 'Was something. Still is, technically.',
  },
  {
    key: 'interior',
    label: 'Interior',
    subtext:
      'A room, a building, a place with a roof and opinions about who enters.',
  },
  {
    key: 'tavern',
    label: 'Tavern / Refuge',
    subtext: 'The place people come to after the thing that happened.',
  },
  {
    key: 'archive',
    label: 'Archive / Library',
    subtext: 'Answers live here. So do questions nobody thought to ask yet.',
  },
  {
    key: 'workshop',
    label: 'Workshop / Forge',
    subtext: 'Something is always being made or unmade here.',
  },
  {
    key: 'transit',
    label: 'Transit / Road',
    subtext: 'The point is the moving. The destination is just punctuation.',
  },
  // Atmospheric / abstract
  {
    key: 'liminal',
    label: 'Liminal',
    subtext: 'Between. Not here yet. No longer there. Fluorescent.',
  },
  {
    key: 'cozy',
    label: 'Cozy',
    subtext: 'Something outside. Tea inside. The ratio is correct.',
  },
  {
    key: 'threatening',
    label: 'Threatening',
    subtext: 'Not dangerous, exactly. But aware of you.',
  },
  {
    key: 'ancient',
    label: 'Ancient',
    subtext: 'Has been here longer than the concept of being here.',
  },
  {
    key: 'abandoned',
    label: 'Abandoned',
    subtext: 'Left, not empty. The things that were left are still here.',
  },
  {
    key: 'sacred',
    label: 'Sacred',
    subtext: 'Something agreed this place matters. The agreement held.',
  },
  {
    key: 'eldritch',
    label: 'Eldritch',
    subtext: 'The geometry is advisory. The angles are having a conversation.',
  },
  {
    key: 'dreamlike',
    label: 'Dreamlike',
    subtext: "Internally consistent in a way that doesn't survive scrutiny.",
  },
  {
    key: 'domestic',
    label: 'Domestic',
    subtext: 'Ordinary, which turns out to be its own kind of strange.',
  },
  {
    key: 'industrial',
    label: 'Industrial',
    subtext: 'Built for a purpose. The purpose is ongoing or was.',
  },
  {
    key: 'festive',
    label: 'Festive',
    subtext:
      'Something is being celebrated. The celebrating may be compulsory.',
  },
  {
    key: 'nautical',
    label: 'Nautical',
    subtext: 'The water is present in some capacity and has strong opinions.',
  },
  {
    key: 'cosmic',
    label: 'Cosmic',
    subtext:
      'Scale has broken down. Everything is either very large or very far away.',
  },
  {
    key: 'infernal',
    label: 'Infernal',
    subtext: 'Hot in a way that implies intent.',
  },
  {
    key: 'celestial',
    label: 'Celestial',
    subtext: 'The light here comes from somewhere that has not been named.',
  },
  {
    key: 'temporal',
    label: 'Temporal / Unstuck',
    subtext: 'Time works here, but inconsistently.',
  },
]

// ── Access mode options ─────────────────────────────────────────────────────

export const ACCESS_MODES: BuilderChoice[] = [
  {
    value: 'OPEN',
    label: 'Open',
    subtext: 'Anyone can enter. The door is always unlocked.',
    image: '/images/dreams/access/open.webp',
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    subtext: 'Only you. The space is yours alone.',
    image: '/images/dreams/access/private.webp',
  },
  {
    value: 'CODE',
    label: 'Code',
    subtext: 'Anyone with the code can enter. The door has a specific answer.',
    image: '/images/dreams/access/code.webp',
  },
]

// ── Cards ──────────────────────────────────────────────────────────────────

export const DREAM_CARDS: BuilderCard[] = [
  // ── Atmosphere ────────────────────────────────────────────────────────────
  {
    key: 'atmosphere',
    label: 'Atmosphere',
    title: 'The quality of the space',
    icon: 'kind-icon:cloud',
    flourish: '◌',
    deckImage: '/images/dreams/atmosphere.webp',
    heroImage: '/images/dreams/atmosphere.webp',
    tagline: "What kind of place is this. Even if it isn't a place.",
    narrative:
      'A Dream can be a forest, a city, a feeling, a specific quality of light at a certain time of day. The atmosphere is the first thing — the category the space belongs to before it has a name. Choose the one that fits. This shapes everything that follows.',
    required: true,
    restoresFields: ['vibeTag'],
    steps: [
      {
        key: 'atmosphere',
        title: 'Atmosphere',
        narrative:
          'What kind of space is this? Physical location, abstract mood, or somewhere between — pick the category that fits most closely. It will inform the name, description, and vibe.',
        inputType: 'preset',
        field: 'vibeTag',
        choices: (
          ATMOSPHERE_TAGS.map(
            (tag): BuilderChoice => ({
              value: tag.key,
              label: tag.label,
              subtext: tag.subtext,
              image: `/images/dreams/atmosphere/${tag.key}.webp`,
            }),
          ) as BuilderChoice[]
        ).concat([
          {
            value: '',
            label: 'Something else',
            subtext:
              'A state, a concept, a temperature, a structural condition...',
            opensCustom: true,
          },
        ]),
      },
    ],
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  {
    key: 'title',
    label: 'Title',
    title: 'What it is called',
    icon: 'kind-icon:edit',
    flourish: '✒',
    deckImage: '/images/dreams/title.webp',
    heroImage: '/images/dreams/title.webp',
    tagline: 'The name. Short. The kind others repeat.',
    narrative:
      "A good dream name tells you what kind of thing it is before you know anything else about it. 'The Drowned Archive' is different from 'The Archive' in ways that matter immediately. Name it like it already exists somewhere, waiting.",
    required: true,
    restoresFields: ['title'],
    steps: [
      {
        key: 'dreamTitle',
        title: 'Title',
        narrative:
          'What is this place called? Two to five words is usually right. Specific enough to be recognisable, resonant enough to be remembered.',
        inputType: 'text',
        field: 'title',
        placeholder:
          "The Drowned Archive, Widow's Peak Station, The Room That Waits...",
        inputLabel: 'Title',
        maxLength: 255,
        needsLLM: true,
      },
    ],
  },

  // ── Description ───────────────────────────────────────────────────────────
  {
    key: 'description',
    label: 'Description',
    title: 'What it is',
    icon: 'kind-icon:book',
    flourish: '§',
    deckImage: '/images/dreams/description.webp',
    heroImage: '/images/dreams/description.webp',
    tagline: 'The baseline. What it is when nothing is happening.',
    narrative:
      'The description is the permanent version of this place — what it is before anything happens in it, what it returns to when the visitors have left. Atmosphere, history, defining features. What someone would write in a guidebook if the guidebook were honest.',
    required: true,
    restoresFields: ['description'],
    steps: [
      {
        key: 'dreamDescription',
        title: 'Description',
        narrative:
          'Describe this place as it exists when undisturbed. What does it look like, feel like, smell like? What is its history in the space between its walls or edges? What does it want?',
        inputType: 'long',
        field: 'description',
        placeholder:
          'A library built inside the ribcage of something enormous and long dead. The shelves are bones. The books are real...',
        inputLabel: 'Description',
        needsLLM: true,
      },
    ],
  },

  // ── Current Vibe ──────────────────────────────────────────────────────────
  {
    key: 'vibe',
    label: 'Vibe',
    title: 'Right now',
    icon: 'kind-icon:wave',
    flourish: '〜',
    deckImage: '/images/dreams/vibe.webp',
    heroImage: '/images/dreams/vibe.webp',
    tagline: 'The mood in this moment. Can change between sessions.',
    narrative:
      "The current vibe is the space's mood right now — not its permanent character, but its current condition. A forest can be peaceful or menacing depending on the season, the weather, what recently happened there. The vibe changes. The description doesn't.",
    required: false,
    restoresFields: ['currentVibe'],
    steps: [
      {
        key: 'currentVibe',
        title: 'Current Vibe',
        narrative:
          "What is the atmosphere of this space right now? This might be a weather state, a recent event's emotional residue, a seasonal quality, or a feeling that's settled into the walls. One or two sentences — something that sets the tone for a session.",
        inputType: 'long',
        field: 'currentVibe',
        placeholder:
          "Something is different today. The usual sounds are absent. The light comes from a direction it didn't yesterday...",
        inputLabel: 'Current Vibe',
        needsLLM: true,
      },
    ],
  },

  // ── Prompt ────────────────────────────────────────────────────────────────
  {
    key: 'prompt',
    label: 'Prompt',
    title: 'What happens here',
    icon: 'kind-icon:bolt',
    flourish: '⚡',
    deckImage: '/images/dreams/prompt.webp',
    heroImage: '/images/dreams/prompt.webp',
    tagline: 'Optional. The inciting detail. What visitors encounter.',
    narrative:
      'The current prompt is the active element — the thing that is happening when someone arrives. Not the place itself, but the event, the condition, the thing that makes this particular visit interesting. It is what the space is doing right now.',
    required: false,
    restoresFields: ['currentPrompt'],
    steps: [
      {
        key: 'currentPrompt',
        title: 'Current Prompt',
        narrative:
          'What is this space currently presenting to anyone who enters? A discovery, a situation, an encounter, an unanswered question. One to three sentences. The thing that makes a session start here rather than anywhere else.',
        inputType: 'long',
        field: 'currentPrompt',
        placeholder:
          "There is a door here that wasn't here yesterday. It is made of the same material as everything else, which suggests it was always here...",
        inputLabel: 'Current Prompt',
        needsLLM: true,
      },
    ],
  },

  // ── Access ────────────────────────────────────────────────────────────────
  {
    key: 'access',
    label: 'Access',
    title: 'Who can enter',
    icon: 'kind-icon:lock',
    flourish: '⊘',
    deckImage: '/images/dreams/access.webp',
    heroImage: '/images/dreams/access.webp',
    tagline: 'Optional. Open to all, private, or code-locked.',
    narrative:
      'Access determines who can enter this dream space. Open means anyone. Private means only you. Code means anyone who knows the word.',
    required: false,
    restoresFields: ['accessMode', 'privacyCode'],
    steps: [
      {
        key: 'accessMode',
        title: 'Access Mode',
        narrative: 'How open is this space to others?',
        inputType: 'preset',
        field: 'accessMode',
        optional: true,
        choices: ACCESS_MODES,
      },
      {
        key: 'privacyCode',
        title: 'Access Code',
        narrative:
          'If code-locked, choose the word or phrase that opens the door. Keep it short and memorable.',
        inputType: 'text',
        field: 'privacyCode',
        optional: true,
        placeholder: 'whisper, old forest, the second moon...',
        inputLabel: 'Access Code',
        maxLength: 255,
      },
    ],
  },

  // ── Art ───────────────────────────────────────────────────────────────────
  {
    key: 'art',
    label: 'Art',
    title: 'Make it visible',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/dreams/art.webp',
    heroImage: '/images/dreams/art.webp',
    tagline: 'Optional. Give the space a face.',
    narrative:
      "An image makes a dream real in a way description alone doesn't. Build the art prompt from the title, atmosphere, and description. Generate the image. The dream becomes a place someone can picture before they've read a word.",
    required: false,
    restoresFields: ['artPrompt', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'dreamArt',
        title: 'Build the Image',
        narrative:
          'Use the title, atmosphere, and description to build an image that captures this space. Location art, atmospheric illustration, sense of place. Refine the prompt, then generate.',
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
