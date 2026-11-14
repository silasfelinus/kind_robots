import type { Run } from './types'

export const CAST_KEY = 'kr-zuzu-gamebook-cast-v1'

export const BOOK_ONE_CAST = [
  {
    id: 'coyote',
    name: 'The One-Eyed Coyote',
    sceneId: 'coyote',
    scenes: ['standoff', 'coyote', 'aftermath', 'parting'],
    flags: ['coyote-kindness', 'coyote-warned', 'coyote-trust'],
  },
  {
    id: 'ling',
    name: 'Ling',
    sceneId: 'survivors',
    scenes: ['survivors', 'they-follow', 'apple-tree'],
    flags: ['sister-trust', 'sister-wary', 'sister-free'],
  },
  {
    id: 'bao',
    name: 'Bao',
    sceneId: 'survivors',
    scenes: ['survivors', 'they-follow', 'apple-tree'],
    flags: ['sister-trust', 'sister-wary', 'sister-free'],
  },
  {
    id: 'hollis',
    name: 'Hollis',
    sceneId: 'a4-well-vouched',
    scenes: ['a4-well-vouched', 'a4-well-toll', 'a4-well-grab'],
    flags: ['met:hollis'],
  },
  {
    id: 'abbess',
    name: 'The Abbess',
    sceneId: 'mission-gate',
    scenes: ['mission-gate', 'supper', 'caught', 'abbess'],
    flags: ['abbess-doubt', 'abbess-wary'],
  },
  {
    id: 'wren',
    name: 'Sister Wren',
    sceneId: 'a5-wren-talk',
    scenes: ['a5-scullery', 'a5-wren-talk', 'a5-well'],
    flags: ['met:wren', 'wren-ally', 'wren-betrayed'],
  },
  {
    id: 'kit',
    name: 'The Silent Kit',
    sceneId: 'a5-kit-supper',
    scenes: ['a5-kit-supper', 'a5-kit-box'],
    flags: ['met:kit'],
  },
] as const

export type BookOneCastId = (typeof BOOK_ONE_CAST)[number]['id']

const validCastIds = new Set<string>(BOOK_ONE_CAST.map((entry) => entry.id))

export function decodeCastCollection(raw: unknown): BookOneCastId[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const record = raw as { version?: unknown; ids?: unknown }
  if (record.version !== 1 || !Array.isArray(record.ids)) return []
  return [
    ...new Set(
      record.ids.filter(
        (id): id is BookOneCastId =>
          typeof id === 'string' && validCastIds.has(id),
      ),
    ),
  ]
}

function encountered(
  scenes: readonly string[],
  flags: readonly string[],
): BookOneCastId[] {
  const sceneIds = new Set(scenes)
  const flagIds = new Set(flags)
  return BOOK_ONE_CAST.filter(
    (entry) =>
      entry.scenes.some((id) => sceneIds.has(id)) ||
      entry.flags.some((flag) => flagIds.has(flag)),
  ).map((entry) => entry.id)
}

export function castFromLocalJourney(run: Run): BookOneCastId[] {
  return encountered(run.visited, run.flags)
}

export function newlyEncounteredCast(before: Run, after: Run): BookOneCastId[] {
  const reachedScenes = after.visited.slice(before.visited.length)
  if (
    before.sceneId !== after.sceneId &&
    !reachedScenes.includes(after.sceneId)
  )
    reachedScenes.push(after.sceneId)
  const earnedFlags = after.flags.filter((flag) => !before.flags.includes(flag))
  return encountered(reachedScenes, earnedFlags)
}
