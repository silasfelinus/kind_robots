// /utils/seeds/facetBotTypeArtwork.ts

export type BotTypeArtworkTarget = {
  value: string
  label: string
  path: string
  prompt: string
}

export const BOT_TYPE_ARTWORK_TARGETS: BotTypeArtworkTarget[] = [
  {
    value: 'assistant',
    label: 'Assistant',
    path: '/images/bots/type/assistant.webp',
    prompt:
      'Illustrated Bot Type card for a dependable general assistant, approachable robot helping organize several useful tasks, crisp modern western animation, no text.',
  },
  {
    value: 'story',
    label: 'Story Bot',
    path: '/images/bots/type/story.webp',
    prompt:
      'Illustrated Bot Type card for an interactive storyteller, expressive robot opening a living book as scenes emerge around it, no text.',
  },
  {
    value: 'art',
    label: 'Art Bot',
    path: '/images/bots/type/art.webp',
    prompt:
      'Illustrated Bot Type card for an art-generation bot, creative machine shaping color and imagery from a luminous prompt workspace, no text.',
  },
  {
    value: 'character',
    label: 'Character Bot',
    path: '/images/bots/type/character.webp',
    prompt:
      'Illustrated Bot Type card for a role-playing character bot, distinctive expressive persona stepping from a theatrical frame, no text.',
  },
  {
    value: 'scenario',
    label: 'Scenario Bot',
    path: '/images/bots/type/scenario.webp',
    prompt:
      'Illustrated Bot Type card for an interactive scenario runner, robot presenting branching doors and consequential choices, readable composition, no text.',
  },
  {
    value: 'guide',
    label: 'Guide Bot',
    path: '/images/bots/type/guide.webp',
    prompt:
      'Illustrated Bot Type card for a teaching and orientation guide, warm robot illuminating a map through an unfamiliar creative workspace, no text.',
  },
  {
    value: 'custom',
    label: 'Custom',
    path: '/images/bots/type/custom.webp',
    prompt:
      'Illustrated Bot Type card for a custom undefined bot, modular robot assembling its own unusual tools and identity, inventive and open-ended, no text.',
  },
]

export const BOT_TYPE_ARTWORK_PATHS = new Set(
  BOT_TYPE_ARTWORK_TARGETS.map((target) => target.path),
)
