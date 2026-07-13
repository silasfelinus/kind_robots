// /utils/projectPlacements.ts
//
// Canonical placement for every project surface: conductor slug -> the channel
// (dashboardKey), tab (dashboardTab), the in-app route, and the launch pointer.
// This is the single source of truth used to backfill the Project DB rows
// (channelKey / tabKey / liveUrl) via POST /api/projects/apply-placements, and it
// mirrors the tabs registered in stores/helpers/dashboardHelper.ts.
//
// liveUrl is the internal Kind Robots route by default (so the Conductor "Open
// Project" action lands on the styled page). Bridge projects still expose their
// external app from their own page.

export type ProjectPlacement = {
  /** dashboardKey / Project.channelKey */
  channelKey: string
  /** dashboardTab / Project.tabKey */
  tabKey: string
  /** In-app route the page lives at (also the default liveUrl). */
  route: string
  /** Explicit launch pointer when it differs from `route` (e.g. external app). */
  liveUrl?: string
}

export const PROJECT_PLACEMENTS: Record<string, ProjectPlacement> = {
  // Flagship + newly stitched surfaces
  'coloring-book': { channelKey: 'art', tabKey: 'coloring', route: '/coloring' },
  'challenge-center': {
    channelKey: 'wonder',
    tabKey: 'challenges',
    route: '/challenges',
  },
  wishmaster: {
    channelKey: 'conductor',
    tabKey: 'wishmaster',
    route: '/wishmaster',
  },
  appmaker: { channelKey: 'conductor', tabKey: 'appmaker', route: '/appmaker' },
  serendipity: {
    channelKey: 'scenario',
    tabKey: 'serendipity',
    route: '/serendipity',
  },
  'mermaids-of-venice': {
    channelKey: 'giftshop',
    tabKey: 'mermaids',
    route: '/mermaids',
  },
  'model-builder': {
    channelKey: 'builder',
    tabKey: 'model-builder',
    route: '/model-builder',
  },
  storymaker: {
    channelKey: 'scenario',
    tabKey: 'storymaker',
    route: '/storymaker',
  },
  sketchy: { channelKey: 'academy', tabKey: 'sketchy', route: '/sketchy' },
  packmaker: { channelKey: 'builder', tabKey: 'packs', route: '/packs' },
  davinci: { channelKey: 'wonder', tabKey: 'davinci', route: '/davinci' },
  'media-watchlist': {
    channelKey: 'wonder',
    tabKey: 'watchlist',
    route: '/watchlist',
  },
  'coat-dance': { channelKey: 'art', tabKey: 'coat-dance', route: '/coat-dance' },
  'ruler-hooked': {
    channelKey: 'wonder',
    tabKey: 'ruler-hooked',
    route: '/ruler-hooked',
  },
  newsfeed: { channelKey: 'wonder', tabKey: 'newsfeed', route: '/newsfeed' },
  'humboldt-scoop': {
    channelKey: 'wonder',
    tabKey: 'humboldt-scoop',
    route: '/humboldt-scoop',
  },
  'humboldt-scoop-cms': {
    channelKey: 'conductor',
    tabKey: 'scoop-cms',
    route: '/scoop-cms',
  },
  'conductor-app': {
    channelKey: 'conductor',
    tabKey: 'conductor-app',
    route: '/conductor-app',
  },
  'alexa-integration': {
    channelKey: 'wonder',
    tabKey: 'voice-lab',
    route: '/voice-lab',
  },

  // Already-complete surfaces (recorded so their DB rows carry placement too)
  'superkate-services-calculator': {
    channelKey: 'art',
    tabKey: 'stylist',
    route: '/stylist',
  },
  'superkate-hairstyle-ai': {
    channelKey: 'art',
    tabKey: 'stylist',
    route: '/stylist',
  },
  'digital-storefront': {
    channelKey: 'giftshop',
    tabKey: 'giftshop',
    route: '/sanctuary',
  },
  'ai-art-academy': {
    channelKey: 'academy',
    tabKey: 'timeline',
    route: '/academy',
  },
  brainstorm: {
    channelKey: 'brainstorm',
    tabKey: 'brainstorm',
    route: '/brainstorm',
  },
  'mural-design': { channelKey: 'wonder', tabKey: 'mural', route: '/mural' },
  conductor: {
    channelKey: 'conductor',
    tabKey: 'conductor',
    route: '/conductor',
  },
}

/** Resolve a placement by conductor slug (or project slug), if one exists. */
export function getProjectPlacement(
  slug: string | null | undefined,
): ProjectPlacement | null {
  if (!slug) return null
  return PROJECT_PLACEMENTS[slug] ?? null
}

/** The launch pointer for a placement: explicit liveUrl, else the route. */
export function placementLiveUrl(placement: ProjectPlacement): string {
  return placement.liveUrl ?? placement.route
}
