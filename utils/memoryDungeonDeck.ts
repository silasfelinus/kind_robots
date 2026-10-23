export type DungeonDeckFamily = 'designed' | 'gallery' | 'entities'
export type DungeonEntityKind =
  'dreams' | 'characters' | 'bots' | 'rewards' | 'scenarios' | 'facets'

export interface DungeonDeckSelection {
  family: DungeonDeckFamily
  gallery: 'all' | 'collections'
  collectionIds: number[]
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
    gallery: entry.gallery === 'collections' ? 'collections' : 'all',
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
}

export function isEligibleDungeonArt(
  art: VisibleDeckImage,
  requestedMature: boolean,
  viewerAllowsMature: boolean,
): boolean {
  return (
    art.isPublic === true &&
    art.isActive !== false &&
    (!art.isMature || (requestedMature && viewerAllowsMature))
  )
}

export function imageUrlForDeck(art: VisibleDeckImage): string {
  const path = [art.imagePath, art.path, art.thumbnailPath, art.url].find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  )
  if (path) {
    if (path.startsWith('/') || /^https:\/\//i.test(path)) return path
    if (/^(data:|javascript:|blob:)/i.test(path)) return ''
    return '/images/gallery/' + path
  }
  if (
    art.imageData &&
    art.fileType &&
    /^(png|jpeg|jpg|webp|gif)$/i.test(art.fileType)
  ) {
    return (
      'data:image/' +
      art.fileType.replace('jpg', 'jpeg') +
      ';base64,' +
      art.imageData
    )
  }
  return ''
}

export function uniqueDeckPaths(paths: readonly string[]): string[] {
  return [...new Set(paths.filter((value) => value.length > 0))]
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
