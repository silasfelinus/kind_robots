// /stores/helpers/labCards.ts
//
// WonderLab deck. Mirrors the 'wonder' dashboard config tabs (see
// dashboardHelper.ts) so builder-hand can surface the lab's tools as cards.
//
// Like navCards, these are navigational rather than data-collecting: a single
// 'custom' step per card with routing in payload. Lab cards target tabs
// within the WonderLab dashboard rather than separate routes, so payload
// carries { path: '/wonderlab', dashboardKey: 'wonder', tab }.

import type { BuilderCard } from '@/stores/helpers/builderCards'

export type LabCard = BuilderCard

// One image per concept: deckImage and heroImage point at the same flat
// /images/lab/<key>.webp file (downscaled at render time where needed).
function labCard(input: {
  key: string
  label: string
  title: string
  icon: string
  tagline: string
  narrative: string
  tab: string
  flourish?: string
  path?: string
  deckImage?: string
  heroImage?: string
}): LabCard {
  const payload = {
    path: input.path ?? '/wonderlab',
    dashboardKey: 'wonder',
    tab: input.tab,
  }

  const image = `/images/lab/${input.key}.webp`

  return {
    key: input.key,
    label: input.label,
    title: input.title,
    icon: input.icon,
    flourish: input.flourish,
    deckImage: input.deckImage ?? image,
    heroImage: input.heroImage ?? image,
    tagline: input.tagline,
    narrative: input.narrative,
    required: false,
    restoresFields: [],
    unlockCondition: 'always',
    payload,
    steps: [
      {
        key: input.key,
        title: input.title,
        narrative: input.narrative,
        inputType: 'custom',
        payload,
      },
    ],
  }
}

export const LAB_CARDS: LabCard[] = [
  labCard({
    key: 'memory-dungeon',
    label: 'Dungeon',
    title: 'Memory Dungeon',
    icon: 'kind-icon:castle',
    flourish: '⚔',
    tab: 'memory-dungeon',
    tagline: 'A card-matching crawl with teeth.',
    narrative:
      'Explore the gamified memory adventure — match the cards, survive the dungeon, see how deep it goes.',
  }),
  labCard({
    key: 'wonder-lab',
    label: 'WonderLab',
    title: 'WonderLab',
    icon: 'kind-icon:flask',
    flourish: '⚗',
    tab: 'wonder-lab',
    tagline: 'Experimental toys and delightful nonsense.',
    narrative:
      'The open sandbox — experimental components, half-finished toys, and the things that exist purely because they were fun to make.',
  }),
  labCard({
    key: 'screen-fx',
    label: 'Screen FX',
    title: 'Screen Effects',
    icon: 'kind-icon:sparkles',
    flourish: '✦',
    tab: 'screen-fx',
    tagline: 'Overlays, butterflies, and visual chaos.',
    narrative:
      'Control the screen-effect layer — matrix rain, firefly drift, butterflies, and the rest of the ambient theater.',
  }),
  labCard({
    key: 'chat-test',
    label: 'Chat Test',
    title: 'Chat Test',
    icon: 'kind-icon:chat',
    flourish: '◈',
    tab: 'chat-test',
    tagline: 'Poke the text engines and watch them stream.',
    narrative:
      'Test different chat streams and text backends — Claude, OpenAI, Ollama — and watch the tokens arrive.',
  }),
  labCard({
    key: 'art-test',
    label: 'Art Test',
    title: 'Art Test',
    icon: 'kind-icon:image',
    flourish: '◐',
    tab: 'art-test',
    tagline: 'Throw prompts at the image generators.',
    narrative:
      'Test the image generators directly — quick prompts, fast iteration, no ceremony.',
  }),
]
