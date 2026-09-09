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
    channelKey: 'plan',
    tabKey: 'music-mentor',
    route: '/music-mentor',
  },
  'mandarin-tutor': {
    channelKey: 'plan',
    tabKey: 'mandarin',
    route: '/play/mandarin',
  },
  'coloring-book': {
    channelKey: 'plan',
    tabKey: 'coloring',
    route: '/coloring',
  },
  'challenge-center': {
    channelKey: 'plan',
    tabKey: 'challenges',
    route: '/play/challenges',
  },
  appmaker: {
    channelKey: 'plan',
    tabKey: 'appmaker',
    route: '/appmaker',
  },
  taskmaster: {
    channelKey: 'plan',
    tabKey: 'taskmaster',
    route: '/taskmaster',
  },
  'mermaids-of-venice': {
    channelKey: 'plan',
    tabKey: 'mermaids',
    route: '/mermaids',
  },
  'model-builder': {
    channelKey: 'plan',
    tabKey: 'model-builder',
    route: '/model-builder',
  },
  'animation-manager': {
    channelKey: 'admin',
    tabKey: 'animation-manager',
    route: '/build/animation-manager',
  },
  'scene-animator': {
    channelKey: 'admin',
    tabKey: 'scene-animator',
    route: '/admin/scene-animator',
  },
  storybook: {
    channelKey: 'plan',
    tabKey: 'storybook',
    route: '/storybook',
  },
  sketchy: {
    channelKey: 'plan',
    tabKey: 'projects',
    route: '/plan/projects/sketchy',
  },
  packmaker: {
    channelKey: 'admin',
    tabKey: 'packs',
    route: '/packs',
  },
  // Merged into Storybook on 2026-09-09 as its `life` shape, so it shares
  // Storybook's placement rather than keeping a tab of its own: the tab
  // document content/channels/plan/davinci.md is gone, and this map is
  // CI-checked against the channel documents that actually exist. The conductor
  // project survives for the 1,024-ending art-coverage work, which is why the
  // slug is still here at all -- the projects board needs somewhere to send a
  // reader who clicks it.
  davinci: {
    channelKey: 'plan',
    tabKey: 'storybook',
    route: '/storybook',
  },
  cthulhuquarium: {
    channelKey: 'plan',
    tabKey: 'aquarium',
    route: '/play/aquarium',
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
    tabKey: 'ruler-hooked',
    route: '/plan/projects/ruler-hooked',
  },
  newsfeed: {
    channelKey: 'home',
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
    channelKey: 'home',
    tabKey: 'giftshop',
    route: '/sanctuary',
  },
  'ai-art-academy': {
    channelKey: 'plan',
    tabKey: 'academy',
    route: '/academy',
  },
  brainstorm: {
    channelKey: 'plan',
    tabKey: 'brainstorm',
    route: '/brainstorm',
  },
  'mural-design': {
    channelKey: 'admin',
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
