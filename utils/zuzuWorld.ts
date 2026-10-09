export const ZUZU_PROJECTS = [
  { slug: 'comic-creator', label: 'Zuzu Comic', route: '/play/comics/studio' },
  {
    slug: 'music-video',
    label: 'Music videos & trailer',
    route: '/play/music-video',
  },
  { slug: 'comic-film', label: 'Animated episode', route: '/play/music-video' },
  { slug: 'zuzu-lair', label: "Zuzu's Lair", route: '/play/zuzu-lair' },
  { slug: 'zuzu-gamebook', label: 'Gamebook', route: '/play/zuzu-gamebook' },
  {
    slug: 'zuzu-shifting-lands',
    label: 'Shifting Lands',
    route: '/admin/worlds/zuzu',
  },
  { slug: 'zuzu-showdown', label: 'Showdown', route: '/play/zuzu-showdown' },
  { slug: 'kr-arcade', label: 'Ghost Trail', route: '/play/arcade' },
] as const

export type ZuzuProjectSlug = (typeof ZUZU_PROJECTS)[number]['slug']

export function isZuzuProjectSlug(value: string): value is ZuzuProjectSlug {
  return ZUZU_PROJECTS.some((project) => project.slug === value)
}

export type ZuzuProject = {
  id: number
  title: string
  slug: ZuzuProjectSlug
}

export type ZuzuAsset = {
  id: number
  title: string
  entity: string | null
  source: string
  sourceProject: string
  artJobIds: number[]
  projectSlugs: string[]
  linkedProjectIds: number[]
  thumbnailUrl: string
  previewUrl: string
  fileType: string
  mediaKind: 'image' | 'video'
  status: 'available'
  isMature: boolean
  isPublic: boolean
  promptString: string | null
  checkpoint: string | null
}

export type ZuzuWorldPage = {
  items: ZuzuAsset[]
  projects: ZuzuProject[]
  total: number
  page: number
  pageSize: number
  recordedCount: number
  ledgerCount: number
  source: string
  sourceWarning: string | null
}

export const ZUZU_ASSET_PAGE_SIZE = 48
