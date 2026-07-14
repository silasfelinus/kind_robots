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
  'coloring-book': {
    channelKey: 'play',
    tabKey: 'coloring',
    route: '/coloring',
  },
  'challenge-center': {
    channelKey: 'lab',
    tabKey: 'challenges',
    route: '/challenges',
  },
  wishmaster: {
    channelKey: 'plan',
    tabKey: 'wishmaster',
    route: '/wishmaster',
  },
  appmaker: {
    channelKey: 'plan',
    tabKey: 'appmaker',
    route: '/appmaker',
  },
  serendipity: {
    channelKey: 'play',
    tabKey: 'serendipity',
    route: '/serendipity',
  },
  'mermaids-of-venice': {
    channelKey: 'sanctuary',
    tabKey: 'mermaids',
    route: '/mermaids',
  },
  'model-builder': {
    channelKey: 'build',
    tabKey: 'model-builder',
    route: '/model-builder',
  },
  storymaker: {
    channelKey: 'play',
    tabKey: 'storymaker',
    route: '/storymaker',
  },
  sketchy: {
    channelKey: 'lab',
    tabKey: 'sketchy',
    route: '/sketchy',
  },
  packmaker: {
    channelKey: 'build',
    tabKey: 'packs',
    route: '/packs',
  },
  davinci: {
    channelKey: 'lab',
    tabKey: 'davinci',
    route: '/davinci',
  },
  'media-watchlist': {
    channelKey: 'lab',
    tabKey: 'watchlist',
    route: '/watchlist',
  },
  'coat-dance': {
    channelKey: 'lab',
    tabKey: 'coat-dance',
    route: '/coat-dance',
  },
  'ruler-hooked': {
    channelKey: 'lab',
    tabKey: 'ruler-hooked',
    route: '/ruler-hooked',
  },
  newsfeed: {
    channelKey: 'lab',
    tabKey: 'newsfeed',
    route: '/newsfeed',
  },
  'humboldt-scoop': {
    channelKey: 'lab',
    tabKey: 'humboldt-scoop',
    route: '/humboldt-scoop',
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
    channelKey: 'lab',
    tabKey: 'voice-lab',
    route: '/voice-lab',
  },
  'superkate-services-calculator': {
    channelKey: 'lab',
    tabKey: 'stylist',
    route: '/stylist',
  },
  'superkate-hairstyle-ai': {
    channelKey: 'lab',
    tabKey: 'stylist',
    route: '/stylist',
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
    channelKey: 'build',
    tabKey: 'brainstorm',
    route: '/brainstorm',
  },
  'mural-design': {
    channelKey: 'lab',
    tabKey: 'mural',
    route: '/mural',
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
