// stores/helpers/pitchCards.ts
//
// Card definitions for the Pitch Builder.
// A pitch is a seed — one sentence that grows into everything else.
// Can be a generic art prompt driver (ARTPITCH) or a location/scenario
// seed for story experiences (DREAM).

// ── Types ──────────────────────────────────────────────────────────────────

export type PitchInputType = 'preset' | 'text' | 'icon' | 'art'

export type PitchChoice = {
  value: string
  label: string
  subtext?: string
  image?: string
  opensCustom?: boolean
  opensList?: boolean
  listOptions?: string[]
}

export type PitchStep = {
  key: string
  title: string
  narrative: string
  inputType: PitchInputType
  field?: string
  choices?: PitchChoice[]
  placeholder?: string
  inputLabel?: string
  maxLength?: number
  optional?: boolean
  needsLLM?: boolean
}

export type PitchCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish: string
  deckImage: string
  heroImage: string
  tagline: string
  narrative: string
  required?: boolean
  restoresFields: string[]
  unlockCondition?: 'always' | 'coreComplete'
  steps: PitchStep[]
}

// ── Cards ──────────────────────────────────────────────────────────────────

export const PITCH_CARDS: PitchCard[] = [
  // ── Type ─────────────────────────────────────────────────────────────────
  {
    key: 'type',
    label: 'Type',
    title: 'What kind of seed',
    icon: 'kind-icon:layers',
    flourish: '◈',
    deckImage: '/images/pitch/thumb/type.png',
    heroImage: '/images/pitch/hero/type.png',
    tagline: 'A pitch is a seed. First: what grows from it.',
    narrative:
      'Every pitch is a beginning. The question is what it begins. An art pitch generates images — it is a visual concept, a mood, a subject. A dream pitch is a place — a location with atmosphere, with possibility, with things that could happen there. Both start the same way: one good sentence.',
    required: true,
    restoresFields: ['PitchType'],
    steps: [
      {
        key: 'pitchType',
        title: 'Pitch Type',
        narrative:
          'What does this pitch seed? Art pitches become images. Dream pitches become locations — places a story could happen, spaces an adventure could inhabit.',
        inputType: 'preset',
        field: 'PitchType',
        choices: [
          {
            value: 'ARTPITCH',
            label: 'Art Pitch',
            subtext:
              'A visual concept. A subject, mood, or scene that drives image generation. Could be anything from "bioluminescent deep ocean" to "retired supervillain at a farmer\'s market."',
            image: '/images/pitch/type/artpitch.png',
          },
          {
            value: 'DREAM',
            label: 'Dream',
            subtext:
              'A location seed. A place with atmosphere and possibility — the kind of space where something interesting is always about to happen.',
            image: '/images/pitch/type/dream.png',
          },
        ],
      },
    ],
  },

  // ── Pitch ─────────────────────────────────────────────────────────────────
  {
    key: 'pitch',
    label: 'Pitch',
    title: 'The one sentence',
    icon: 'kind-icon:edit',
    flourish: '✍',
    deckImage: '/images/pitch/thumb/pitch.png',
    heroImage: '/images/pitch/hero/pitch.png',
    tagline: 'Say the thing. One sentence. Go.',
    narrative:
      'This is the pitch. It can be broad — "nature" — or specific — "tardigrades in space". It can be a vibe, a subject, a scenario, a relationship, a question without an answer. The only rule: it should be the kind of sentence that makes someone else immediately start having ideas.',
    required: true,
    restoresFields: ['title', 'pitch'],
    steps: [
      {
        key: 'pitchText',
        title: 'The Pitch',
        narrative:
          "One sentence. Could be three words or thirty. Should be the kind of thing you'd say across a table when you wanted someone to lean forward. Title and pitch will be the same — this is the thing.",
        inputType: 'text',
        field: 'pitch',
        placeholder:
          'Tardigrades in space. A library that rearranges itself. The last lighthouse keeper who was also a god...',
        inputLabel: 'Pitch',
        maxLength: 256,
        needsLLM: true,
      },
    ],
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  {
    key: 'icon',
    label: 'Icon',
    title: 'The symbol',
    icon: 'kind-icon:grid',
    flourish: '✦',
    deckImage: '/images/pitch/thumb/icon.png',
    heroImage: '/images/pitch/hero/icon.png',
    tagline: 'Optional. A small visual anchor for the pitch.',
    narrative:
      'An icon is not the pitch. It is the symbol the pitch carries — a small visual handle that makes it findable in a list, recognisable at a glance. Browse the icon gallery and pick the one that feels right. Or skip it — the pitch knows what it is.',
    required: false,
    restoresFields: ['icon'],
    steps: [
      {
        key: 'pitchIcon',
        title: 'Choose an Icon',
        narrative:
          'Pick a symbol for this pitch. Anything that captures it — literally, abstractly, obliquely. The icon is for navigation, not definition.',
        inputType: 'icon',
        field: 'icon',
        optional: true,
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
    deckImage: '/images/pitch/thumb/art.png',
    heroImage: '/images/pitch/hero/art.png',
    tagline: 'Optional. Give the pitch a face.',
    narrative:
      "A pitch can live as text. But an image makes it real in a different way — gives it a face that others can see before they've read a word. Build the art prompt, generate the image, and the pitch becomes a thing with a presence.",
    required: false,
    restoresFields: ['artPrompt', 'highlightImage', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'pitchArt',
        title: 'Build the Image',
        narrative:
          "Use the pitch text and type to build an image that represents this idea. The art prompt can be refined before generating. The image becomes the pitch's cover.",
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
