export const ZUZU_PROJECTS = [
  { slug: 'comic-creator', label: 'Zuzu Comic', route: '/play/comics/studio' },
  {
    slug: 'music-video',
    label: 'Music videos & trailer',
    route: '/play/video-generator?studio=music',
  },
  {
    slug: 'comic-film',
    label: 'Animated episode',
    route: '/play/video-generator?studio=music',
  }
  { slug: 'zuzu-lair', label: "Zuzu's Lair", route: '/admin/zuzu-lair' },
  { slug: 'zuzu-gamebook', label: 'Gamebook', route: '/play/zuzu-gamebook' },
  {
    slug: 'zuzu-shifting-lands',
    label: 'Shifting Lands',
    route: '/play/zuzu-shifting-lands',
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

export const ZUZU_USAGE_ROLES = [
  { value: 'general', label: 'General reference', short: 'Reference' },
  { value: 'shot-keyframe', label: 'Shot keyframe', short: 'Keyframe' },
  { value: 'character-design', label: 'Character design', short: 'Character' },
  { value: 'stage-background', label: 'Stage background', short: 'Stage' },
  { value: 'animation-clip', label: 'Animation clip', short: 'Clip' },
] as const

export type ZuzuUsageRole = (typeof ZUZU_USAGE_ROLES)[number]['value']

export const ZUZU_SLOT_MAX = 120
export const ZUZU_PINNED_VERSION_MAX = 64

export function isZuzuUsageRole(value: unknown): value is ZuzuUsageRole {
  return ZUZU_USAGE_ROLES.some((role) => role.value === value)
}

export function zuzuUsageRoleOf(
  stored: string | null | undefined,
): ZuzuUsageRole {
  return isZuzuUsageRole(stored) ? stored : 'general'
}

export function zuzuUsageRoleShort(role: string | null | undefined): string {
  const value = zuzuUsageRoleOf(role)
  return ZUZU_USAGE_ROLES.find((entry) => entry.value === value)?.short ?? ''
}

export type ZuzuUsageInput = {
  role?: unknown
  slot?: unknown
  pinnedVersion?: unknown
}

export type ZuzuUsageFields = {
  role: Exclude<ZuzuUsageRole, 'general'> | null
  slot: string | null
  pinnedVersion: string | null
}

export type ZuzuUsageParse =
  { ok: true; value: ZuzuUsageFields } | { ok: false; message: string }

const CONTROL_CHARACTERS = /\p{Cc}/u
const PINNED_VERSION = /^[\w .#:/-]+$/

function optionalLabel(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string') {
    return { ok: false, message: `${label} must be text.` }
  }
  if (CONTROL_CHARACTERS.test(value.replace(/[\t\n\r]/g, ' '))) {
    return { ok: false, message: `${label} contains unsupported characters.` }
  }
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed) return { ok: true, value: null }
  if (trimmed.length > max) {
    return { ok: false, message: `${label} is limited to ${max} characters.` }
  }
  return { ok: true, value: trimmed }
}

export function parseZuzuUsage(input: ZuzuUsageInput): ZuzuUsageParse {
  const role = input.role ?? 'general'
  if (!isZuzuUsageRole(role)) {
    return {
      ok: false,
      message: `Choose a production role: ${ZUZU_USAGE_ROLES.map((entry) => entry.label.toLowerCase()).join(', ')}.`,
    }
  }
  const slot = optionalLabel(input.slot, ZUZU_SLOT_MAX, 'Scene / slot label')
  if (!slot.ok) return slot
  const pinned = optionalLabel(
    input.pinnedVersion,
    ZUZU_PINNED_VERSION_MAX,
    'Pinned version',
  )
  if (!pinned.ok) return pinned
  if (pinned.value && !PINNED_VERSION.test(pinned.value)) {
    return {
      ok: false,
      message:
        'Pinned version may use letters, numbers, spaces and . # : / - _ only.',
    }
  }
  return {
    ok: true,
    value: {
      role: role === 'general' ? null : role,
      slot: slot.value,
      pinnedVersion: pinned.value,
    },
  }
}

export type ZuzuAssetUsage = {
  projectId: number
  projectSlug: ZuzuProjectSlug
  projectTitle: string
  role: ZuzuUsageRole
  slot: string | null
  pinnedVersion: string | null
  linkedAt: string
}

export type ZuzuRepoExport = {
  key: string
  url: string
  title: string
  projectSlug: ZuzuProjectSlug
}

export const ZUZU_REPO_COLLECTIONS = [
  { value: 'gamebook-plate', label: 'Gamebook scene plates' },
  { value: 'gamebook-section', label: 'Gamebook section plates' },
  { value: 'showdown-sprite', label: 'Showdown sprite atlases' },
  { value: 'showdown-portrait', label: 'Showdown portraits' },
  { value: 'showdown-stage', label: 'Showdown stage backdrops' },
  { value: 'ghost-trail-plate', label: 'Ghost Trail far plates' },
] as const

export type ZuzuRepoCollection = (typeof ZUZU_REPO_COLLECTIONS)[number]['value']

export type ZuzuRepoFileStatus = 'present' | 'missing' | 'unverified'

export type ZuzuRepoMediaEntry = {
  key: string
  url: string
  title: string
  projectSlug: ZuzuProjectSlug
  collection: ZuzuRepoCollection
  storage: 'git' | 'delivered'
  manifest: string
  usedBy: string[]
  artImageId: number | null
  provenance: string | null
  fit: 'exact' | 'stand-in' | null
  alt: string | null
}

export type ZuzuRepoMedia = ZuzuRepoMediaEntry & {
  fileStatus: ZuzuRepoFileStatus
  artImageAccessible: boolean
}

export type ZuzuRepoMediaPage = {
  items: ZuzuRepoMedia[]
  total: number
  page: number
  pageSize: number
  indexed: number
  counts: Record<ZuzuRepoFileStatus, number>
  collections: { value: ZuzuRepoCollection; label: string; count: number }[]
  source: string
}

export const ZUZU_REPO_PAGE_SIZE = 48

export type ZuzuAsset = {
  id: number
  title: string
  entity: string | null
  source: string
  sourceProject: string
  artJobIds: number[]
  projectSlugs: string[]
  linkedProjectIds: number[]
  usages: ZuzuAssetUsage[]
  repoExports: ZuzuRepoExport[]
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
