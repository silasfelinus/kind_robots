// /utils/projectPlacements.ts
//
// Canonical placement for every project surface: conductor slug -> channelKey,
// tabKey, in-app route, and launch pointer. Channel and tab names mirror the
// Nuxt Content documents under /content/channels.

export type ProjectPlacement = {
  channelKey: string
  tabKey: string
  route: string
  liveUrl?: string
}

export const PROJECT_PLACEMENTS: Record<string, ProjectPlacement> = {
  'music-mentor': {
    channelKey: 'play',
    tabKey: 'music-mentor',
    route: '/music-mentor',
  },
  'coloring-book': {
    channelKey: 'plan',
    tabKey: 'coloring',
    route: '/coloring',
  },
  'challenge-center': {
    channelKey: 'play',
    tabKey: 'challenges',
    route: '/play/challenges',
  },
  appmaker: {
    channelKey: 'plan',
    tabKey: 'appmaker',
    route: '/appmaker',
  },
  taskmaster: {
    channelKey: 'play',
    tabKey: 'taskmaster',
    route: '/taskmaster',
  },
  'mermaids-of-venice': {
    channelKey: 'sanctuary',
    tabKey: 'mermaids',
    route: '/mermaids',
  },
  'model-builder': {
    channelKey: 'plan',
    tabKey: 'model-builder',
    route: '/model-builder',
  },
  'animation-manager': {
    channelKey: 'plan',
    tabKey: 'animation-manager',
    route: '/build/animation-manager',
  },
  storybook: {
    channelKey: 'play',
    tabKey: 'storybook',
    route: '/storybook',
  },
  sketchy: {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/plan/projects/sketchy',
  },
  packmaker: {
    channelKey: 'plan',
    tabKey: 'packs',
    route: '/packs',
  },
  davinci: {
    channelKey: 'play',
    tabKey: 'davinci',
    route: '/play/davinci',
  },
  'media-watchlist': {
    channelKey: 'plan',
    tabKey: 'watchlist',
    route: '/plan/watchlist',
  },
  'coat-dance': {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/plan/projects/coat-dance',
  },
  'ruler-hooked': {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/plan/projects/ruler-hooked',
  },
  newsfeed: {
    channelKey: 'plan',
    tabKey: 'newsfeed',
    route: '/plan/newsfeed',
  },
  'humboldt-scoop': {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/plan/projects/humboldt-scoop',
  },
  'humboldt-scoop-cms': {
    channelKey: 'admin',
    tabKey: 'scoop-cms',
    route: '/scoop-cms',
  },
  'conductor-app': {
    channelKey: 'plan',
    tabKey: 'conductor-app',
    route: '/conductor-app',
  },
  'alexa-integration': {
    channelKey: 'plan',
    tabKey: 'voice-lab',
    route: '/plan/voice-lab',
  },
  'superkate-services-calculator': {
    channelKey: 'plan',
    tabKey: 'stylist',
    route: '/stylist',
  },
  'superkate-hairstyle-ai': {
    channelKey: 'plan',
    tabKey: 'hair-studio',
    route: '/build/hair-studio',
  },
  'digital-storefront': {
    channelKey: 'sanctuary',
    tabKey: 'giftshop',
    route: '/sanctuary',
  },
  'ai-art-academy': {
    channelKey: 'play',
    tabKey: 'academy',
    route: '/academy',
  },
  brainstorm: {
    channelKey: 'plan',
    tabKey: 'brainstorm',
    route: '/brainstorm',
  },
  'mural-design': {
    channelKey: 'plan',
    tabKey: 'mural',
    route: '/build/mural',
  },
  conductor: {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/conductor',
  },
}

export function getProjectPlacement(
  slug: string | null | undefined,
): ProjectPlacement | null {
  if (!slug) return null
  return PROJECT_PLACEMENTS[slug] ?? null
}

export function placementLiveUrl(placement: ProjectPlacement): string {
  return placement.liveUrl ?? placement.route
}
