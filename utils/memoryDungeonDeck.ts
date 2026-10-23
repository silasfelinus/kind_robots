import { resolveEntityArtwork } from './artImageSrc'
export type DungeonDeckFamily = 'designed' | 'gallery' | 'entities'
export type DungeonEntityKind =
  'dreams' | 'characters' | 'bots' | 'rewards' | 'scenarios' | 'facets'

export interface DungeonDeckSelection {
  family: DungeonDeckFamily
  gallery: 'all' | 'collections' | 'generated'
  collectionIds: number[]
  /** Exclusive rating filter: false = non-mature only, true = mature only. */
  includeMature: boolean
  entityKind: DungeonEntityKind
}

export const DEFAULT_DUNGEON_DECK: DungeonDeckSelection = {
  family: 'designed',
  gallery: 'all',
  collectionIds: [],
  includeMature: false,
  entityKind: 'characters',
}

const entities = new Set<DungeonEntityKind>([
  'dreams',
  'characters',
  'bots',
  'rewards',
  'scenarios',
  'facets',
])

export function normalizeDungeonDeck(input: unknown): DungeonDeckSelection {
  const fresh = { ...DEFAULT_DUNGEON_DECK }
  if (!input || typeof input !== 'object') return fresh
  const entry = input as Partial<DungeonDeckSelection>
  return {
    family:
      entry.family === 'designed' ||
      entry.family === 'gallery' ||
      entry.family === 'entities'
        ? entry.family
        : fresh.family,
    gallery:
      entry.gallery === 'collections' || entry.gallery === 'generated'
        ? entry.gallery
        : 'all',
    collectionIds: Array.isArray(entry.collectionIds)
      ? [
          ...new Set(
            entry.collectionIds.filter(
              (id) => Number.isSafeInteger(id) && id > 0,
            ),
          ),
        ]
      : [],
    includeMature: entry.includeMature === true,
    entityKind: entities.has(entry.entityKind as DungeonEntityKind)
      ? (entry.entityKind as DungeonEntityKind)
      : fresh.entityKind,
  }
}

export interface VisibleDeckImage {
  isPublic?: boolean | null
  isMature?: boolean | null
  isActive?: boolean | null
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
  url?: string | null
  imageData?: string | null
  fileType?: string | null
  userId?: number | null
  avatarImage?: string | null
  cardPath?: string | null
  heroPath?: string | null
  iconPath?: string | null
}

export function isEligibleDungeonArt(
  art: VisibleDeckImage,
  requestedMature: boolean,
  viewerAllowsMature: boolean,
  viewerId = 0,
  allowOwnedPrivate = false,
): boolean {
  const permitted =
    art.isPublic === true ||
    (allowOwnedPrivate &&
      viewerId > 0 &&
      art.userId != null &&
      art.userId === viewerId)
  return (
    permitted &&
    art.isActive !== false &&
    (requestedMature && viewerAllowsMature
      ? art.isMature === true
      : art.isMature === false)
  )
}

/** Use the same canonical URL resolver as the working gallery and entity screens. */
export function imageUrlForDeck(art: VisibleDeckImage): string {
  return resolveEntityArtwork(art) ?? ''
}

export function uniqueDeckPaths(paths: readonly string[]): string[] {
  return [...new Set(paths.filter((value) => value.length > 0))]
}

/**
 * Signed archive URLs can gain a new exp/sig each hour without becoming new art.
 * Compare those by stable ArtImage resource rather than time-limited capability.
 */
export function deckImageIdentity(path: string): string {
  const route = path.match(
    /(?:^|https?:\/\/[^/]+)(\/api\/art\/image\/(?:archive\/\d+|\d+\/thumbnail))(?:\?|$)/,
  )
  return route?.[1] ?? path
}

/** Return unique picture faces that have not appeared earlier this run. */
export function unseenDeckPaths(
  paths: readonly string[],
  previouslyUsed: readonly string[],
): string[] {
  const blocked = new Set(previouslyUsed.map(deckImageIdentity))
  const accepted = new Set<string>()
  return paths.filter((path) => {
    if (!path) return false
    const identity = deckImageIdentity(path)
    if (blocked.has(identity) || accepted.has(identity)) return false
    accepted.add(identity)
    return true
  })
}

const galleryMotifs = [
  {
    title: 'Moss Oracle',
    glyph: '❧',
    tone: '#456744',
    accent: '#e4d490',
    detail: '#b6da83',
  },
  {
    title: 'River Bell',
    glyph: '♒',
    tone: '#285d70',
    accent: '#b8ebee',
    detail: '#72b4cf',
  },
  {
    title: 'Sleeping Moon',
    glyph: '☾',
    tone: '#393d70',
    accent: '#eee4ba',
    detail: '#9087d4',
  },
  {
    title: 'Ember Rose',
    glyph: '✿',
    tone: '#854d42',
    accent: '#ffe2a2',
    detail: '#e4a17a',
  },
  {
    title: 'Sunward Key',
    glyph: '☼',
    tone: '#977243',
    accent: '#fff2c7',
    detail: '#e8c36c',
  },
  {
    title: 'Warden Shield',
    glyph: '♜',
    tone: '#3f6560',
    accent: '#dee3ca',
    detail: '#91b5a0',
  },
  {
    title: 'Spore Spiral',
    glyph: '◉',
    tone: '#614d79',
    accent: '#f0d9f4',
    detail: '#bf9ed4',
  },
  {
    title: 'Compass Bloom',
    glyph: '✥',
    tone: '#476953',
    accent: '#e8dfb6',
    detail: '#9dcf9d',
  },
  {
    title: 'Frost Lily',
    glyph: '❄',
    tone: '#426a7b',
    accent: '#e0fcff',
    detail: '#97dce2',
  },
  {
    title: 'Dusk Crown',
    glyph: '♛',
    tone: '#684868',
    accent: '#ffceca',
    detail: '#ca89b1',
  },
  {
    title: 'Forest Eye',
    glyph: '◈',
    tone: '#486145',
    accent: '#f6df99',
    detail: '#a1b77a',
  },
  {
    title: 'Wishing Star',
    glyph: '✶',
    tone: '#345778',
    accent: '#fff1c4',
    detail: '#82b6dc',
  },
  {
    title: 'Cinder Antler',
    glyph: '⚜',
    tone: '#775040',
    accent: '#ffdfba',
    detail: '#dc9b72',
  },
  {
    title: 'Stone Lantern',
    glyph: '♟',
    tone: '#636659',
    accent: '#e8e9c9',
    detail: '#aaad8b',
  },
  {
    title: 'Golden Leaf',
    glyph: '❦',
    tone: '#77743c',
    accent: '#ffebad',
    detail: '#d6cb77',
  },
  {
    title: 'Silver Moth',
    glyph: '✧',
    tone: '#55587b',
    accent: '#eeefff',
    detail: '#ada4d9',
  },
  {
    title: 'Sunflower Gate',
    glyph: '⌘',
    tone: '#777051',
    accent: '#fff4ce',
    detail: '#d5b968',
  },
  {
    title: 'Starlit Wheel',
    glyph: '✺',
    tone: '#39556d',
    accent: '#f8efc0',
    detail: '#8fb9d4',
  },
  {
    title: 'Wildwood Fox',
    glyph: '♞',
    tone: '#7c603b',
    accent: '#ffead1',
    detail: '#d2ad77',
  },
  {
    title: 'Coral Crown',
    glyph: '♕',
    tone: '#7d5368',
    accent: '#f7cbd2',
    detail: '#c98d98',
  },
  {
    title: 'Star Atlas',
    glyph: '✴',
    tone: '#3b567e',
    accent: '#e5ecfa',
    detail: '#8ea7d8',
  },
  {
    title: 'Amber Beetle',
    glyph: '❖',
    tone: '#7f5635',
    accent: '#f9e19a',
    detail: '#dfb35d',
  },
  {
    title: 'Fungal Choir',
    glyph: '♣',
    tone: '#646046',
    accent: '#e8e6b6',
    detail: '#a5b879',
  },
  {
    title: 'Cinder Hour',
    glyph: '⌛',
    tone: '#8f5142',
    accent: '#ffd6a5',
    detail: '#e29a72',
  },
  {
    title: 'Willow Wisp',
    glyph: '♧',
    tone: '#395c56',
    accent: '#dbffdc',
    detail: '#82bca2',
  },
  {
    title: 'Moonwell Mirror',
    glyph: '◇',
    tone: '#494f77',
    accent: '#e3e3ff',
    detail: '#9cadda',
  },
  {
    title: 'Mothwing Map',
    glyph: '✩',
    tone: '#5f4877',
    accent: '#edddff',
    detail: '#b9a7d8',
  },
  {
    title: 'Thorn Compass',
    glyph: '✜',
    tone: '#477350',
    accent: '#f0e2b4',
    detail: '#a2bb87',
  },
  {
    title: 'Mist Bell',
    glyph: '♧',
    tone: '#527a83',
    accent: '#e8f9ef',
    detail: '#8cc8c0',
  },
  {
    title: 'Gilded Hourglass',
    glyph: '⌬',
    tone: '#8d714e',
    accent: '#fff1b2',
    detail: '#dbb978',
  },
  {
    title: 'Obsidian Eye',
    glyph: '◉',
    tone: '#454859',
    accent: '#d4d5e7',
    detail: '#8389ae',
  },
  {
    title: 'Dandelion Crown',
    glyph: '❀',
    tone: '#7c8552',
    accent: '#f8f4c3',
    detail: '#c7d69e',
  },
  {
    title: 'Sapphire Stream',
    glyph: '♓',
    tone: '#376f8a',
    accent: '#b6e3fb',
    detail: '#79bfdc',
  },
  {
    title: 'Clover Sentinel',
    glyph: '♧',
    tone: '#507b52',
    accent: '#eff8c4',
    detail: '#a2c992',
  },
  {
    title: 'Twilight Fern',
    glyph: '✢',
    tone: '#67557d',
    accent: '#f3dcff',
    detail: '#b49bcb',
  },
  {
    title: 'Meteor Ladder',
    glyph: '⋆',
    tone: '#60597d',
    accent: '#ece9ff',
    detail: '#a4a0d8',
  },
]

function designedImage(index: number): string {
  const item = galleryMotifs[index]!
  const art = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">',
    '<defs><radialGradient id="h"><stop stop-color="' +
      item.detail +
      '"/><stop offset=".75" stop-color="' +
      item.tone +
      '"/><stop offset="1" stop-color="#1d2732"/></radialGradient></defs>',
    '<rect width="320" height="320" rx="22" fill="#1d242d"/>',
    '<rect x="12" y="12" width="296" height="296" rx="18" fill="url(#h)" stroke="' +
      item.accent +
      '" stroke-width="3"/>',
    '<path d="M160 36L280 160 160 284 40 160Z" fill="none" stroke="' +
      item.accent +
      '" stroke-opacity=".65" stroke-width="3"/>',
    '<circle cx="160" cy="160" r="94" fill="#202a36" fill-opacity=".22" stroke="' +
      item.accent +
      '" stroke-width="3"/>',
    '<circle cx="160" cy="160" r="72" fill="none" stroke="' +
      item.accent +
      '" stroke-opacity=".5" stroke-dasharray="4 11" stroke-width="4"/>',
    '<text x="160" y="199" text-anchor="middle" font-family="Georgia,serif" font-size="119" fill="' +
      item.accent +
      '">' +
      item.glyph +
      '</text>',
    '<circle cx="160" cy="32" r="9" fill="' +
      item.accent +
      '"/><circle cx="160" cy="288" r="9" fill="' +
      item.accent +
      '"/>',
    '<circle cx="32" cy="160" r="9" fill="' +
      item.accent +
      '"/><circle cx="288" cy="160" r="9" fill="' +
      item.accent +
      '"/>',
    '</svg>',
  ].join('')
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(art)
}

export const DESIGNED_DUNGEON_ART = galleryMotifs.map((entry, index) => ({
  id: index,
  title: entry.title,
  imagePath: designedImage(index),
}))
