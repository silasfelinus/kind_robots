// /stores/helpers/tutorialCards.ts
//
// LEGACY AND STANDALONE TUTORIAL EXCEPTIONS ONLY.
//
// Every current channel destination gets its help from content/channels
// metadata: the channel `tutorial` overview and sections in index.md, and the
// page `tutorial` on each tab. The workspace sheet resolves those from the
// route first. This file is consulted only when a route belongs to no channel
// the viewer can see, so it may describe a public standalone page and nothing
// else. A route that is also a channel tab route does not belong here --
// verifyTutorialChannelResolver.ts fails if one is added.
//
// The old footer-era channels (Stories, Dreams, Characters, Rewards, Bots, Art,
// Builder, Orientation, Your Account, Games, Conductor, Challenges, Mermaids,
// WonderLab) were retired on 2026-10-14 once their destinations had authored
// page help in content metadata (kind_robots#3379).

export const TUTORIAL_IMAGE_BASE = '/images/tutorials'
export const TUTORIAL_IMAGE_EXTENSION = 'webp'

export function getTutorialImagePath(
  channelKey: string,
  sectionKey: string,
): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/${sectionKey}.${TUTORIAL_IMAGE_EXTENSION}`
}

export function getTutorialHeroPath(channelKey: string): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/hero.${TUTORIAL_IMAGE_EXTENSION}`
}

export type TutorialChannelKey = 'humboldt-scoop' | 'sketchy'

export type TutorialSection = {
  key: string
  title: string
  body: string
  image: string
  underConstruction?: boolean
}

export type TutorialChannel = {
  key: TutorialChannelKey
  title: string
  hero?: string
  overview: string
  tagline?: string
  earnings?: string
  underConstruction?: boolean
  sections: TutorialSection[]
}

export const tutorialChannels = {
  'humboldt-scoop': {
    key: 'humboldt-scoop',
    title: 'The Humboldt Scoop',
    hero: getTutorialImagePath('humboldt-scoop', 'humboldt-scoop'),
    tagline: 'A cleaner yard, without the dirty work.',
    overview:
      'The Humboldt Scoop is a real-world pet-waste removal service run out of Humboldt County. This page is its home base inside Kind Robots — meet the service and the story, then jump to the real site to see pricing and book a route.',
    sections: [
      {
        key: 'humboldt-scoop',
        title: 'Local & dependable',
        body: 'Weekly, bi-weekly, monthly, and one-time cleanup plans serving Eureka, Arcata, and McKinleyville (with Trinidad, Cutten, Freshwater, and Blue Lake by request). Flat honest pricing, cancel anytime, no long-term contract.',
        image: getTutorialImagePath('humboldt-scoop', 'humboldt-scoop'),
      },
    ],
  },

  sketchy: {
    key: 'sketchy',
    title: 'Sketchy',
    hero: getTutorialImagePath('wonder', 'sketchy'),
    tagline: 'Show up, fill the page, get a little better.',
    overview:
      'Sketchy is a planned drawing-habit studio: a tier-appropriate assignment, a timer, and kind critique that turns "I can\'t draw" into a stack of finished pages.',
    underConstruction: true,
    sections: [
      {
        key: 'sketchy',
        title: 'Preview an assignment',
        body: 'Pick Beginner, Intermediate or Advanced to see a sample drawing prompt, its time window, and the dimensions a critique would score. The assignment engine and AI critique are still in development, so nothing is submitted yet.',
        image: getTutorialImagePath('wonder', 'sketchy'),
        underConstruction: true,
      },
    ],
  },
} as const satisfies Record<TutorialChannelKey, TutorialChannel>

export const tutorialChannelKeys = Object.keys(
  tutorialChannels,
) as TutorialChannelKey[]

export const legacyTutorialRouteMap = {
  'humboldt-scoop': '/plan/projects/humboldt-scoop',
  sketchy: '/plan/projects/sketchy',
} as const satisfies Record<TutorialChannelKey, string | readonly string[]>

export function isTutorialChannelKey(
  value: string,
): value is TutorialChannelKey {
  return value in tutorialChannels
}

export function getTutorialChannel(key: TutorialChannelKey): TutorialChannel {
  return tutorialChannels[key]
}

export function getTutorialHero(key: TutorialChannelKey): string {
  return getTutorialChannel(key).hero ?? getTutorialHeroPath(key)
}

export function getTutorialSections(
  key: TutorialChannelKey,
): TutorialSection[] {
  return [...tutorialChannels[key].sections]
}

/**
 * The legacy fallback for a route no visible content channel resolves.
 *
 * Callers must try the modern channel location first; this is never the normal
 * resolver for a current channel destination.
 */
export function resolveLegacyTutorialChannel(
  path: string,
  routeMap: Partial<
    Record<string, string | readonly string[]>
  > = legacyTutorialRouteMap,
  keys: readonly string[] = tutorialChannelKeys,
): string | null {
  let cleanPath = path || ''
  const queryIndex = cleanPath.indexOf('?')
  if (queryIndex !== -1) cleanPath = cleanPath.slice(0, queryIndex)
  const hashIndex = cleanPath.indexOf('#')
  if (hashIndex !== -1) cleanPath = cleanPath.slice(0, hashIndex)

  let bestKey: string | null = null
  let bestLen = -1

  for (const key of keys) {
    const routes = routeMap[key]
    if (!routes) continue
    const routeList = Array.isArray(routes) ? routes : [routes]

    for (const route of routeList) {
      if (!route) continue
      if (cleanPath === route) return key

      const isPrefix = route !== '/' && cleanPath.startsWith(`${route}/`)

      if (isPrefix && route.length > bestLen) {
        bestKey = key
        bestLen = route.length
      }
    }
  }

  return bestKey
}
