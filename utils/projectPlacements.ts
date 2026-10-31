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
  'every-villain-tactics': {
    channelKey: 'admin',
    tabKey: 'every-villain-tactics',
    route: '/admin/every-villain-tactics',
  },
  hybridizer: {
    channelKey: 'arcade',
    tabKey: 'hybridizer',
    route: '/play/hybridizer',
  },
  'slime-city': {
    channelKey: 'arcade',
    tabKey: 'slime-city',
    route: '/play/slime-city',
  },
  'kind-sliding-tile-gallery': {
    channelKey: 'arcade',
    tabKey: 'sliding-tile-gallery',
    route: '/play/sliding-tile-gallery',
  },
  'music-mentor': {
    channelKey: 'admin',
    tabKey: 'daily-pitches',
    route: '/music-mentor',
  },
  'mandarin-tutor': {
    channelKey: 'projects',
    tabKey: 'mandarin',
    route: '/play/mandarin',
  },
  'coloring-book': {
    channelKey: 'admin',
    tabKey: 'coloring',
    route: '/coloring',
  },
  'challenge-center': {
    channelKey: 'admin',
    tabKey: 'challenges',
    route: '/play/challenges',
  },
  appmaker: {
    channelKey: 'admin',
    tabKey: 'appmaker',
    route: '/appmaker',
  },
  // Absorbed into Storybook on 2026-09-14 as its `taskmaster` MODE, so it shares
  // Storybook's placement rather than keeping a tab of its own -- the same
  // treatment davinci got below. The tab documents content/taskmaster.md and
  // content/channels/plan/taskmaster.md are gone, and this map is CI-checked
  // against the channel documents that actually exist. The slug stays because
  // the projects board still needs somewhere to send a reader who clicks it.
  taskmaster: {
    channelKey: 'projects',
    tabKey: 'storybook',
    route: '/storybook',
  },
  'mermaids-of-venice': {
    channelKey: 'admin',
    tabKey: 'mermaids',
    route: '/mermaids',
  },
  'model-builder': {
    channelKey: 'projects',
    tabKey: 'model-builder',
    route: '/model-builder',
  },
  'animation-manager': {
    channelKey: 'home',
    tabKey: 'account',
    route: '/build/animation-manager',
  },
  'scene-animator': {
    channelKey: 'admin',
    tabKey: 'scene-animator',
    route: '/admin/scene-animator',
  },
  // The Music Videos workbench now lives within Video Studio, not as a
  // separate channel tab. Public viewing stays open; producing remains admin-only.
  'music-video': {
    channelKey: 'projects',
    tabKey: 'video-generator',
    route: '/play/video-generator?studio=music',
  },
  storybook: {
    channelKey: 'projects',
    tabKey: 'storybook',
    route: '/storybook',
  },
  sketchy: {
    channelKey: 'projects',
    tabKey: 'projects',
    route: '/plan/projects/sketchy',
  },
  // Merged into Storybook on 2026-09-09 as its `life` shape, so it shares
  // Storybook's placement rather than keeping a tab of its own: the tab
  // document content/channels/plan/davinci.md is gone, and this map is
  // CI-checked against the channel documents that actually exist. The conductor
  // project survives for the 1,024-ending art-coverage work, which is why the
  // slug is still here at all -- the projects board needs somewhere to send a
  // reader who clicks it.
  davinci: {
    channelKey: 'projects',
    tabKey: 'storybook',
    route: '/storybook',
  },
  // Projects channel (Silas, 2026-10-06; it began the same day as "Fun"): the
  // public home for everything that isn't Storybook or admin-gated, including
  // the largely AI-created games. Approved daily-pitch projects join it once
  // they have something playable.
  cthulhuquarium: {
    channelKey: 'arcade',
    tabKey: 'aquarium',
    route: '/play/aquarium',
  },
  // Kind Robots Arcade (Silas, 2026-10-06): classic cabinets, leaderboards,
  // original games riffing on golden-age favourites.
  // The existing /play/memory page remains Memory Dungeon's game surface.
  // Conductor's high-priority RPG evolution shares this route and Play tab;
  // no duplicate dashboard or new channel should be created.
  'memory-dungeon': {
    channelKey: 'arcade',
    tabKey: 'experiments',
    route: '/play/memory',
  },
  'kr-arcade': {
    channelKey: 'arcade',
    tabKey: 'arcade',
    route: '/play/arcade',
  },
  'save-the-plumber': {
    channelKey: 'arcade',
    tabKey: 'save-the-plumber',
    route: '/play/save-the-plumber',
  },
  'emperor-of-dust': {
    channelKey: 'arcade',
    tabKey: 'emperor-of-dust',
    route: '/play/emperor-of-dust',
  },
  'crystal-street': {
    channelKey: 'arcade',
    tabKey: 'crystal-street',
    route: '/play/crystal-street',
  },
  'comet-city-academy': {
    channelKey: 'arcade',
    tabKey: 'comet-city-academy',
    route: '/play/comet-city-academy',
  },
  'game-of-captains': {
    channelKey: 'arcade',
    tabKey: 'game-of-captains',
    route: '/play/game-of-captains',
  },
  'rainbow-bullet-hell-space-princess': {
    channelKey: 'arcade',
    tabKey: 'rainbow-bullet-hell-space-princess',
    route: '/play/rainbow-bullet-hell-space-princess',
  },
  'weird-humboldt': {
    channelKey: 'arcade',
    tabKey: 'ecotone',
    route: '/play/ecotone',
  },
  'zuzu-shifting-lands': {
    channelKey: 'arcade',
    tabKey: 'zuzu-shifting-lands',
    route: '/play/zuzu-shifting-lands',
  },
  'zuzu-pinball': {
    channelKey: 'arcade',
    tabKey: 'zuzu-pinball',
    route: '/play/zuzu-pinball',
  },
  'zuzu-gamebook': {
    channelKey: 'arcade',
    tabKey: 'zuzu-gamebook',
    route: '/play/zuzu-gamebook',
  },
  'zuzu-lair': {
    channelKey: 'admin',
    tabKey: 'zuzu-lair',
    route: '/admin/zuzu-lair',
  },
  // Out of Admin on 2026-10-11 (Silas: "If it's ready for prime time, it can
  // move to the Play and out of admin"), after the t-024 balance pass.
  'zuzu-showdown': {
    channelKey: 'arcade',
    tabKey: 'zuzu-showdown',
    route: '/play/zuzu-showdown',
  },
  'media-watchlist': {
    channelKey: 'admin',
    tabKey: 'watchlist',
    route: '/plan/watchlist',
  },
  'coat-dance': {
    channelKey: 'projects',
    tabKey: 'projects',
    route: '/plan/projects/coat-dance',
  },
  // Silas, 2026-10-24: promote the playable game from Admin into Play.
  // Older Admin/project URLs are compatibility redirects to the same saves.
  'ruler-hooked': {
    channelKey: 'arcade',
    tabKey: 'ruler-hooked',
    route: '/play/ruler-hooked',
  },
  'tzaddik-gallery': {
    channelKey: 'admin',
    tabKey: 'tzaddik-gallery',
    route: '/tzaddik-gallery',
  },
  'evolve-rebel-button': {
    channelKey: 'projects',
    tabKey: 'button',
    route: '/button',
  },
  newsfeed: {
    channelKey: 'home',
    tabKey: 'newsfeed',
    route: '/plan/newsfeed',
  },
  'humboldt-scoop': {
    channelKey: 'projects',
    tabKey: 'projects',
    route: '/plan/projects/humboldt-scoop',
  },
  'conductor-app': {
    channelKey: 'admin',
    tabKey: 'conductor-app',
    route: '/conductor-app',
  },
  'alexa-integration': {
    channelKey: 'admin',
    tabKey: 'voice-lab',
    route: '/plan/voice-lab',
  },
  'superkate-services-calculator': {
    channelKey: 'projects',
    tabKey: 'stylist',
    route: '/stylist',
  },
  'superkate-hairstyle-ai': {
    channelKey: 'admin',
    tabKey: 'hair-studio',
    route: '/build/hair-studio',
  },
  'digital-storefront': {
    channelKey: 'home',
    tabKey: 'giftshop',
    route: '/sanctuary',
  },
  'ai-art-academy': {
    channelKey: 'admin',
    tabKey: 'academy',
    route: '/academy',
  },
  brainstorm: {
    channelKey: 'admin',
    tabKey: 'brainstorm',
    route: '/brainstorm',
  },
  conductor: {
    channelKey: 'projects',
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
