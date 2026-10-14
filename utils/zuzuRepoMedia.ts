import { PLATES, platePath, type ScenePlate } from './zuzuGamebook/art'
import { SECTION_PLATES } from './zuzuGamebook/sectionArt'
import {
  SPRITE_FIGHTERS,
  SPRITE_PUPPETS,
  SPRITE_ROOT,
  spriteFile,
} from './zuzuShowdown/sprites'
import {
  PORTRAIT_KINDS,
  PORTRAIT_ROOT,
  portraitFighters,
  portraitInfo,
} from './zuzuShowdown/portraits'
import { STAGE_NAMES, STAGE_ROOT } from './zuzuShowdown/stages'
import {
  GHOST_TRAIL_STAGE_KEYS,
  ghostTrailPlateUrl,
} from './arcade/ghostTrail/stageArt'
import type {
  ZuzuRepoExport,
  ZuzuRepoFileStatus,
  ZuzuRepoMediaEntry,
} from './zuzuWorld'

const GAMEBOOK_MANIFEST = 'utils/zuzuGamebook/art.ts'
const SECTION_MANIFEST = 'utils/zuzuGamebook/sectionArt.ts'
const SPRITE_MANIFEST = 'utils/zuzuShowdown/sprites.ts'
const PORTRAIT_MANIFEST = 'utils/zuzuShowdown/portraits.json'
const STAGE_MANIFEST = 'utils/zuzuShowdown/stages.ts'
const GHOST_TRAIL_MANIFEST = 'utils/arcade/ghostTrail/stageArt.ts'

function titleOf(stem: string): string {
  return stem
    .replace(/^sections\//, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function repoKeyForUrl(url: string): string {
  return 'public' + (url.startsWith('/') ? url : '/' + url)
}

function plateEntry(
  usedBy: string,
  plate: ScenePlate,
  collection: 'gamebook-plate' | 'gamebook-section',
): ZuzuRepoMediaEntry {
  const url = platePath(plate)
  return {
    key: repoKeyForUrl(url),
    url,
    title: titleOf(plate.file),
    projectSlug: 'zuzu-gamebook',
    collection,
    storage: 'git',
    manifest:
      collection === 'gamebook-plate' ? GAMEBOOK_MANIFEST : SECTION_MANIFEST,
    usedBy: [usedBy],
    artImageId:
      Number.isSafeInteger(plate.artImageId) && plate.artImageId > 0
        ? plate.artImageId
        : null,
    provenance: plate.source || null,
    fit: plate.fit,
    alt: plate.alt || null,
  }
}

function rawZuzuRepoMedia(): ZuzuRepoMediaEntry[] {
  const entries: ZuzuRepoMediaEntry[] = []
  for (const [key, plate] of Object.entries(PLATES)) {
    entries.push(plateEntry(key, plate, 'gamebook-plate'))
  }
  for (const [key, plate] of Object.entries(SECTION_PLATES)) {
    entries.push(plateEntry(key, plate, 'gamebook-section'))
  }

  const rigs = [
    ...SPRITE_FIGHTERS.map((slug) => ({ slug, rig: spriteFile(slug) })),
    ...Object.entries(SPRITE_PUPPETS).flatMap(([slug, rig]) =>
      rig ? [{ slug: `${slug} puppet`, rig }] : [],
    ),
  ]
  for (const { slug, rig } of rigs) {
    const url = `${SPRITE_ROOT}/${rig}-hd.webp`
    entries.push({
      key: repoKeyForUrl(url),
      url,
      title: `${titleOf(rig)} sprite atlas`,
      projectSlug: 'zuzu-showdown',
      collection: 'showdown-sprite',
      storage: 'git',
      manifest: SPRITE_MANIFEST,
      usedBy: [slug],
      artImageId: null,
      provenance: `Conductor zuzu-showdown rig (${rig}-hd.json frame map)`,
      fit: null,
      alt: null,
    })
  }

  for (const fighter of portraitFighters()) {
    for (const kind of PORTRAIT_KINDS) {
      const info = portraitInfo(fighter, kind)
      if (!info) continue
      const url = `${PORTRAIT_ROOT}/${info.file}-hd.webp`
      entries.push({
        key: repoKeyForUrl(url),
        url,
        title: `${titleOf(info.file)} portrait`,
        projectSlug: 'zuzu-showdown',
        collection: 'showdown-portrait',
        storage: 'git',
        manifest: PORTRAIT_MANIFEST,
        usedBy: [`${fighter}:${kind}`],
        artImageId: null,
        provenance: 'Conductor zuzu-showdown tools/portraits.py',
        fit: null,
        alt: null,
      })
    }
  }

  for (const [slug, name] of Object.entries(STAGE_NAMES)) {
    const url = `${STAGE_ROOT}/${slug}-backdrop-hd.webp`
    entries.push({
      key: repoKeyForUrl(url),
      url,
      title: `${name} backdrop`,
      projectSlug: 'zuzu-showdown',
      collection: 'showdown-stage',
      storage: 'git',
      manifest: STAGE_MANIFEST,
      usedBy: [slug],
      artImageId: null,
      provenance: `Conductor zuzu-showdown tools/stage.py (${slug}-hd.json)`,
      fit: null,
      alt: null,
    })
  }

  for (const stage of GHOST_TRAIL_STAGE_KEYS) {
    const url = ghostTrailPlateUrl(stage)
    entries.push({
      key: repoKeyForUrl(url),
      url,
      title: `${titleOf(
        url
          .split('/')
          .pop()!
          .replace(/\.webp$/, ''),
      )} plate`,
      projectSlug: 'kr-arcade',
      collection: 'ghost-trail-plate',
      storage: 'delivered',
      manifest: GHOST_TRAIL_MANIFEST,
      usedBy: [stage],
      artImageId: null,
      provenance:
        'Delivered far plate under public/images (gitignored; present only where the deploy delivered it)',
      fit: null,
      alt: null,
    })
  }
  return entries
}

export function dedupeZuzuRepoMedia(
  entries: readonly ZuzuRepoMediaEntry[],
): ZuzuRepoMediaEntry[] {
  const byKey = new Map<string, ZuzuRepoMediaEntry>()
  for (const entry of entries) {
    const existing = byKey.get(entry.key)
    if (!existing) {
      byKey.set(entry.key, { ...entry, usedBy: [...entry.usedBy] })
      continue
    }
    const preferIncoming = existing.fit === 'stand-in' && entry.fit === 'exact'
    const merged: ZuzuRepoMediaEntry = preferIncoming
      ? { ...entry, usedBy: existing.usedBy }
      : existing
    for (const user of entry.usedBy) {
      if (!merged.usedBy.includes(user)) merged.usedBy.push(user)
    }
    merged.artImageId = merged.artImageId ?? entry.artImageId
    byKey.set(entry.key, merged)
  }
  return [...byKey.values()]
}

let cachedIndex: ZuzuRepoMediaEntry[] | null = null

export function zuzuRepoMediaIndex(): ZuzuRepoMediaEntry[] {
  cachedIndex ??= dedupeZuzuRepoMedia(rawZuzuRepoMedia())
  return cachedIndex
}

export function resolveZuzuRepoFileStatus(
  entries: readonly ZuzuRepoMediaEntry[],
  exists: (repoKey: string) => boolean | null,
): (ZuzuRepoMediaEntry & { fileStatus: ZuzuRepoFileStatus })[] {
  return entries.map((entry) => {
    let found: boolean | null
    try {
      found = exists(entry.key)
    } catch {
      found = null
    }
    return {
      ...entry,
      fileStatus: found === null ? 'unverified' : found ? 'present' : 'missing',
    }
  })
}

export function repoExportsByArtImage(
  entries: readonly ZuzuRepoMediaEntry[],
): Map<number, ZuzuRepoExport[]> {
  const map = new Map<number, ZuzuRepoExport[]>()
  for (const entry of entries) {
    if (!entry.artImageId) continue
    const list = map.get(entry.artImageId) ?? []
    list.push({
      key: entry.key,
      url: entry.url,
      title: entry.title,
      projectSlug: entry.projectSlug,
    })
    map.set(entry.artImageId, list)
  }
  return map
}

export function filterZuzuRepoMedia<
  T extends Pick<
    ZuzuRepoMediaEntry,
    | 'key'
    | 'title'
    | 'projectSlug'
    | 'collection'
    | 'usedBy'
    | 'artImageId'
    | 'provenance'
  >,
>(
  entries: readonly T[],
  filters: { search?: string; project?: string; collection?: string },
): T[] {
  const search = (filters.search ?? '').trim().toLowerCase()
  return entries.filter((entry) => {
    if (filters.project && entry.projectSlug !== filters.project) return false
    if (filters.collection && entry.collection !== filters.collection)
      return false
    if (!search) return true
    return [
      entry.key,
      entry.title,
      entry.provenance ?? '',
      entry.artImageId ? String(entry.artImageId) : '',
      ...entry.usedBy,
    ].some((value) => value.toLowerCase().includes(search))
  })
}
