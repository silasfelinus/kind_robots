/**
 * Save the Plumber's saves, kept by the Arcade cabinet on this device
 * (utils/arcade/saves.ts). Untrusted on the way back in.
 *
 * Generation 2 (conductor save-the-plumber t-011, projects/kr-arcade/
 * GEN2-STANDARD.md section 3): the cabinet keeps a *file* of three slots, SMB3
 * style, and each slot remembers where the heroine stands on the world map,
 * every node she has cleared (and by which exit), the Golden Gears she found,
 * deaths and play time.
 *
 * Version 3 keys the map by GEN2-WORLDS node ids (savePlumberOverworld.ts).
 * Older files carried Gen-1 stage codes, and some of those codes now name a
 * different node (Gen-1 stage 2-2 is node 2-3), so an old file migrates
 * through each node's stage, never by comparing ids: version 2 keeps its three
 * slots, and a version-1 save (one resume point) lands in slot 1 with every
 * stage before its resume point cleared. Nobody loses a run to the upgrade.
 */
import { MAX_SAVE_BYTES, serializedSaveBytes } from '../saves'
import { CAMPAIGN, GEAR_COURSE_CODES } from './savePlumberLevels'
import {
  SECRET_EXITS_READY,
  mapNode,
  stageNode,
  startId,
} from './savePlumberOverworld'
import { PLUMBER_ROSTER, rosterIndex } from './savePlumberRoster'

export const PLUMBER_POWERS = [
  'springstep',
  'bottled-storm',
  'pocket-lift',
  'sailwing',
  'ballast',
  'tidecoat',
] as const

export type PlumberPower = (typeof PLUMBER_POWERS)[number]

function readPower(raw: unknown): PlumberPower | undefined {
  return PLUMBER_POWERS.find((power) => power === raw)
}

/** One save slot: a heroine's whole adventure. */
export type PlumberSlot = {
  /** The roster seed picked on the cabinet's heroine select. */
  heroine: number
  /** Index into the campaign's stages to continue from (the stage at `node`). */
  stage: number
  /** The world-map node she stands on. */
  node?: string
  /** Node ids cleared by their normal exit. */
  done?: string[]
  /** Node ids cleared by a secret exit. */
  secrets?: string[]
  score: number
  lives: number
  tokens: number
  /** World 1 has been cleared at least once. */
  cleared?: boolean
  /** Stage codes whose Golden Gear has been found, kept across runs. */
  gears?: string[]
  pearls?: string[]
  /** Lives lost on this slot. */
  deaths?: number
  /** Seconds played on this slot. */
  time?: number
  /** A name the player typed at heroine select; absent keeps her roster name. */
  name?: string
  power?: PlumberPower
  reserve?: PlumberPower
  gurgle?: true
}

/**
 * The active slot as the rest of the app reads it (the front page, tests):
 * the version-1 shape plus the slot's Gen-2 memory and the device's Endless
 * best.
 */
export type PlumberSave = PlumberSlot & {
  v: 1
  /** The longest Endless run, in metres (tiles). */
  endlessBest?: number
}

/** Collectibles survive replacing or erasing individual run slots. */
export type PlumberAlbum = {
  done: string[]
  secrets: string[]
  gears: string[]
  pearls?: string[]
  heroines: number[]
  endings: PlumberEnding[]
  runs?: PlumberRunMemory[]
}

/**
 * The finales a cleared run can earn, in gallery order (conductor save-the-plumber t-028, main-game standard
 * "multiple endings"). Every clear earns the base ending; finishing with every Golden Gear adds Teo's
 * clockwork gift, and finding every playable secret exit adds Lady Spigot opening the tap for good.
 */
export const PLUMBER_ENDINGS = [
  'rivers-run-home',
  'clockwork-gift',
  'open-tap',
] as const
export type PlumberEnding = (typeof PLUMBER_ENDINGS)[number]

export const PLUMBER_RUN_HISTORY_LIMIT = 12

export type PlumberRunMemory = {
  id: string
  finishedAt: number
  heroine: number
  name?: string
  node: string
  outcome: PlumberEnding | 'game-over'
  score: number
  deaths: number
  time: number
  stages: number
  gears: number
  secrets: number
}

function readRunMemories(raw: unknown): PlumberRunMemory[] {
  if (!Array.isArray(raw)) return []
  const memories = new Map<string, PlumberRunMemory>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    if (typeof r.id !== 'string' || !/^[0-9a-f-]{36}$/.test(r.id)) continue
    if (!count(r.finishedAt, Number.MAX_SAFE_INTEGER)) continue
    if (!count(r.heroine, 0xffffffff)) continue
    if (typeof r.node !== 'string' || !mapNode(r.node)) continue
    const outcome =
      r.outcome === 'game-over'
        ? r.outcome
        : PLUMBER_ENDINGS.find((ending) => ending === r.outcome)
    if (!outcome) continue
    if (!count(r.score, 99_999_999) || !count(r.deaths, 999_999)) continue
    if (!count(r.time, 99_999_999) || !count(r.stages, 999)) continue
    if (!count(r.gears, 999) || !count(r.secrets, 999)) continue
    const name = plumberName(r.name)
    const memory: PlumberRunMemory = {
      id: r.id,
      finishedAt: r.finishedAt,
      heroine: r.heroine,
      ...(name ? { name } : {}),
      node: r.node,
      outcome,
      score: r.score,
      deaths: r.deaths,
      time: r.time,
      stages: r.stages,
      gears: r.gears,
      secrets: r.secrets,
    }
    const prior = memories.get(memory.id)
    if (!prior || JSON.stringify(memory) < JSON.stringify(prior))
      memories.set(memory.id, memory)
  }
  return [...memories.values()]
    .sort((a, b) => b.finishedAt - a.finishedAt || a.id.localeCompare(b.id))
    .slice(0, PLUMBER_RUN_HISTORY_LIMIT)
}

export function archivePlumberRun(
  album: PlumberAlbum,
  slot: PlumberSlot,
  outcome: PlumberRunMemory['outcome'],
  id: string,
  finishedAt: number,
): PlumberAlbum {
  const memory: PlumberRunMemory = {
    id,
    finishedAt,
    heroine: slot.heroine,
    ...(slot.name ? { name: slot.name } : {}),
    node: slot.node ?? startId(1),
    outcome,
    score: slot.score,
    deaths: slot.deaths ?? 0,
    time: slot.time ?? 0,
    stages: slot.done?.length ?? 0,
    gears: slot.gears?.length ?? 0,
    secrets: slot.secrets?.length ?? 0,
  }
  return mergePlumberAlbum(
    { ...album, runs: [...(album.runs ?? []), memory] },
    [slot],
  )
}

/**
 * What each ending shows. `plate` is its painted cutscene; until a plate is delivered the finale and gallery fall
 * back to `finale-reversal`, so an ending never draws a blank.
 */
export const PLUMBER_ENDING_COPY: Readonly<
  Record<
    PlumberEnding,
    {
      title: string
      lines: readonly [string, string]
      gallery: string
      hint: string
      plate: string
    }
  >
> = {
  'rivers-run-home': {
    title: 'THE RIVERS RUN HOME!',
    lines: [
      'Lady Spigot lets the last river go, and {name} frees Teo.',
      'Every stolen stream tumbles back down to the land.',
    ],
    gallery: 'Lady Spigot releases the last river. Your heroine frees Teo.',
    hint: 'Reach the end of World 8 to unlock this memory.',
    plate: 'finale-reversal',
  },
  'clockwork-gift': {
    title: "TEO'S CLOCKWORK GIFT",
    lines: [
      'Teo winds every Golden Gear into a singing clockwork fountain.',
      '{name} hears every river in the land chime home at once.',
    ],
    gallery:
      'Every Golden Gear found: Teo builds a fountain that sings for each river.',
    hint: 'Clear World 8 on a file that holds every Golden Gear.',
    plate: 'finale-clockwork-gift',
  },
  'open-tap': {
    title: 'LADY SPIGOT OPENS THE TAP',
    lines: [
      'Shown every hidden stream, Lady Spigot unbolts her valve for good.',
      '{name} and Teo watch the Upstream Sky pour gently home.',
    ],
    gallery:
      'Every secret exit found: Lady Spigot opens her valve and keeps it open.',
    hint: 'Clear World 8 on a file that found every secret exit.',
    plate: 'finale-open-tap',
  },
}

/** The endings a run has earned: none before the last castle falls, otherwise the base plus each completion. */
export function earnedPlumberEndings(run: {
  cleared?: boolean
  gears?: Iterable<string>
  secrets?: Iterable<string>
}): PlumberEnding[] {
  if (!run.cleared) return []
  const gears = new Set(run.gears ?? [])
  const secrets = new Set(run.secrets ?? [])
  const endings: PlumberEnding[] = ['rivers-run-home']
  if (GEAR_COURSE_CODES.every((code) => gears.has(code)))
    endings.push('clockwork-gift')
  if (
    SECRET_EXITS_READY.size > 0 &&
    [...SECRET_EXITS_READY].every((id) => secrets.has(id))
  )
    endings.push('open-tap')
  return endings
}

/** The ending a finale shows: the rarest one the run earned. */
export function plumberFinaleEnding(run: {
  gears?: Iterable<string>
  secrets?: Iterable<string>
}): PlumberEnding {
  return earnedPlumberEndings({ ...run, cleared: true }).at(-1)!
}

/** What the cabinet actually stores: three slots and the Endless best. */
export type PlumberFile = {
  v: 3
  /** The slot being played (0-2). */
  active: number
  slots: (PlumberSlot | null)[]
  endlessBest: number
  album: PlumberAlbum
}

export const PLUMBER_SLUG = 'save-the-plumber'

/**
 * Heroine name entry (conductor save-the-plumber t-028, main-game standard
 * "customizable characters"): up to ten letters and hyphens, picked on the
 * arcade letter wheel at heroine select.
 */
export const PLUMBER_NAME_MAX = 10
export const PLUMBER_NAME_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-'

// A family-arcade filter on whole words, like the high-score initials: small on
// purpose, not a moderation system.
const BLOCKED_NAME_WORDS = new Set([
  'ARSE',
  'ASS',
  'BITCH',
  'BOOB',
  'BOOBS',
  'COCK',
  'CUM',
  'CUNT',
  'DICK',
  'DIK',
  'FAG',
  'FUCK',
  'FUK',
  'HOE',
  'KKK',
  'KYS',
  'NAZI',
  'NIGGA',
  'NIGGER',
  'PENIS',
  'PISS',
  'PORN',
  'PUSSY',
  'SEX',
  'SHIT',
  'SLUT',
  'TIT',
  'TITS',
  'TWAT',
  'VAGINA',
  'WANK',
  'WHORE',
])

/**
 * A typed heroine name tidied for display ("JI-WOO" -> "Ji-Woo"), or undefined
 * when it is empty, too long, uses other characters or trips the family filter.
 */
export function plumberName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const tidy = raw.trim().replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!/^[A-Za-z][A-Za-z-]*$/.test(tidy)) return undefined
  if (tidy.length > PLUMBER_NAME_MAX) return undefined
  const words = tidy.toUpperCase().split('-')
  if (words.some((w) => BLOCKED_NAME_WORDS.has(w))) return undefined
  if (BLOCKED_NAME_WORDS.has(words.join(''))) return undefined
  return tidy
    .toLowerCase()
    .replace(
      /(^|-)([a-z])/g,
      (_, sep: string, c: string) => sep + c.toUpperCase(),
    )
}
export const SLOT_COUNT = 3

const count = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

const isStageCode = (code: unknown): code is string =>
  typeof code === 'string' && GEAR_COURSE_CODES.includes(code)

/** Real stage codes, each once. */
function codes(raw: unknown): string[] {
  return Array.isArray(raw) ? [...new Set(raw.filter(isStageCode))] : []
}

function pearlCodes(raw: unknown): string[] {
  return codes(raw).filter((code) =>
    CAMPAIGN.some((stage) => stage.code === code && stage.wildwater),
  )
}

/** Real node ids, each once; a legacy file's entries are stage codes, moved to their nodes. */
function nodeIds(raw: unknown, legacy: boolean): string[] {
  if (!Array.isArray(raw)) return []
  const ids = raw.flatMap((entry) => {
    if (typeof entry !== 'string') return []
    const id = legacy ? stageNode(entry)?.id : mapNode(entry)?.id
    return id ? [id] : []
  })
  return [...new Set(ids)]
}

/** The node a legacy file stood on: its stage's node, or the same trailhead. */
function legacyNode(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  if (/^w\d-start$/.test(raw)) return mapNode(raw)?.id
  return stageNode(raw)?.id
}

/**
 * A slot from untrusted data, or null. `legacy` reads a version-1/2 slot,
 * whose map entries are Gen-1 stage codes. Missing fields are derived.
 */
export function readPlumberSlot(
  raw: unknown,
  legacy = false,
): PlumberSlot | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!count(r.heroine, 0xffffffff)) return null
  if (!count(r.stage, CAMPAIGN.length - 1)) return null
  if (!count(r.score, 99_999_999) || !count(r.lives, 99)) return null
  if (!count(r.tokens, 99)) return null
  const stage = r.stage
  // A version-1 save only knew its resume point: everything before it was cleared.
  const done = Array.isArray(r.done)
    ? nodeIds(r.done, legacy)
    : nodeIds(
        CAMPAIGN.slice(0, stage).map((s) => s.code),
        true,
      )
  const node = legacy
    ? legacyNode(r.node)
    : typeof r.node === 'string'
      ? mapNode(r.node)?.id
      : undefined
  return {
    heroine: r.heroine,
    stage,
    node: node ?? stageNode(CAMPAIGN[stage]!.code)?.id ?? startId(1),
    done,
    secrets: nodeIds(r.secrets, legacy),
    score: r.score,
    lives: Math.max(1, r.lives),
    tokens: r.tokens,
    cleared: r.cleared === true,
    gears: codes(r.gears),
    ...(pearlCodes(r.pearls).length ? { pearls: pearlCodes(r.pearls) } : {}),
    deaths: count(r.deaths, 999_999) ? r.deaths : 0,
    time: count(r.time, 99_999_999) ? r.time : 0,
    ...(plumberName(r.name) ? { name: plumberName(r.name) } : {}),
    ...(readPower(r.power) ? { power: readPower(r.power) } : {}),
    ...(readPower(r.reserve) ? { reserve: readPower(r.reserve) } : {}),
    ...(r.gurgle === true ? { gurgle: true as const } : {}),
  }
}

/**
 * A monotonic, validated collection. A slot contributes only earned progress,
 * and deleting that slot never takes away an already recorded souvenir.
 */
export function mergePlumberAlbum(
  raw: unknown,
  slots: (PlumberSlot | null)[],
): PlumberAlbum {
  const a =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const array = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : []
  const done = nodeIds(
    [...array(a.done), ...slots.flatMap((slot) => slot?.done ?? [])],
    false,
  )
  const secrets = nodeIds(
    [...array(a.secrets), ...slots.flatMap((slot) => slot?.secrets ?? [])],
    false,
  )
  const gears = codes([
    ...array(a.gears),
    ...slots.flatMap((slot) => slot?.gears ?? []),
  ])
  const pearls = pearlCodes([
    ...array(a.pearls),
    ...slots.flatMap((slot) => slot?.pearls ?? []),
  ])
  const heroines = [
    ...new Set([
      ...array(a.heroines).filter(
        (v): v is number =>
          typeof v === 'number' &&
          Number.isInteger(v) &&
          v >= 0 &&
          v < PLUMBER_ROSTER.length,
      ),
      ...slots
        .filter((slot): slot is PlumberSlot => slot !== null)
        .map((slot) => rosterIndex(slot.heroine)),
    ]),
  ]
  const earned = new Set<unknown>([
    ...array(a.endings),
    ...slots.flatMap((slot) => (slot ? earnedPlumberEndings(slot) : [])),
  ])
  const endings = PLUMBER_ENDINGS.filter((ending) => earned.has(ending))
  const runs = readRunMemories(a.runs)
  return {
    done,
    secrets,
    gears,
    ...(pearls.length ? { pearls } : {}),
    heroines,
    endings,
    ...(runs.length ? { runs } : {}),
  }
}

/** The cabinet's file from untrusted data: version 3, or an older file migrated forward. */
export function readPlumberFile(raw: unknown): PlumberFile {
  const empty: PlumberFile = {
    v: 3,
    active: 0,
    slots: Array(SLOT_COUNT).fill(null),
    endlessBest: 0,
    album: mergePlumberAlbum(null, []),
  }
  if (!raw || typeof raw !== 'object') return empty
  const r = raw as Record<string, unknown>
  const best = (v: unknown) => (count(v, 9_999_999) ? v : 0)
  if (r.v === 3 || r.v === 2) {
    const slots = Array.isArray(r.slots) ? r.slots : []
    const normalized = Array.from({ length: SLOT_COUNT }, (_, i) =>
      readPlumberSlot(slots[i], r.v === 2),
    )
    return {
      v: 3,
      active: count(r.active, SLOT_COUNT - 1) ? r.active : 0,
      slots: normalized,
      endlessBest: best(r.endlessBest),
      album: mergePlumberAlbum(r.album, normalized),
    }
  }
  if (r.v !== 1) return empty
  // A true version-1 save has no map fields (they are derived from its stage);
  // a version-1 *view* from readPlumberSave carries this version's node ids.
  const slot = readPlumberSlot(r)
  return {
    ...empty,
    slots: [slot, null, null],
    endlessBest: best(r.endlessBest),
    album: mergePlumberAlbum(null, [slot, null, null]),
  }
}

function matchesCanonicalSave(expected: unknown, actual: unknown): boolean {
  if (expected === actual) return true
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((value, i) => matchesCanonicalSave(value, actual[i]))
    )
  }
  if (
    !expected ||
    !actual ||
    typeof expected !== 'object' ||
    typeof actual !== 'object' ||
    Array.isArray(actual)
  )
    return false
  const fields = Object.entries(expected)
  const value = actual as Record<string, unknown>
  return (
    Object.keys(value).length === fields.length &&
    fields.every(
      ([key, field]) =>
        Object.hasOwn(value, key) && matchesCanonicalSave(field, value[key]),
    )
  )
}

export type PlumberSaveReconciliation =
  | { status: 'merged'; save: PlumberFile }
  | { status: 'conflict'; slots: number[] }

export type PlumberConflictChoice = 'device' | 'account'

/** Merge independent slot changes; divergent runs require an explicit choice. */
export function reconcilePlumberSaves(
  local: PlumberFile,
  remote: PlumberFile,
  baseline: PlumberFile | null,
  choice?: PlumberConflictChoice,
  accountMissing = false,
): PlumberSaveReconciliation {
  const conflicts: number[] = []
  const slots = local.slots.map((left, index) => {
    const right = remote.slots[index] ?? null
    if (matchesCanonicalSave(left, right)) return left
    if (!accountMissing) {
      if (baseline) {
        const before = baseline.slots[index] ?? null
        if (matchesCanonicalSave(left, before)) return right
        if (matchesCanonicalSave(right, before)) return left
      } else {
        if (left === null) return right
        if (right === null) return left
      }
    }
    if (!choice) conflicts.push(index)
    return choice === 'account' ? right : left
  })
  if (conflicts.length) return { status: 'conflict', slots: conflicts }
  const active =
    baseline && local.active === baseline.active ? remote.active : local.active
  const album = mergePlumberAlbum(
    {
      done: [...remote.album.done, ...local.album.done],
      secrets: [...remote.album.secrets, ...local.album.secrets],
      gears: [...remote.album.gears, ...local.album.gears],
      pearls: [...(remote.album.pearls ?? []), ...(local.album.pearls ?? [])],
      heroines: [...remote.album.heroines, ...local.album.heroines],
      endings: [...remote.album.endings, ...local.album.endings],
      runs: [...(remote.album.runs ?? []), ...(local.album.runs ?? [])],
    },
    slots,
  )
  return {
    status: 'merged',
    save: {
      v: 3,
      slots,
      active,
      album,
      endlessBest: Math.max(local.endlessBest, remote.endlessBest),
    },
  }
}

/** Account writes require canonical v3 files, not silently repaired input. */
export function validPlumberCloudSave(raw: unknown): raw is PlumberFile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  if ((raw as Record<string, unknown>).v !== 3) return false
  const bytes = serializedSaveBytes(raw)
  if (bytes === null || bytes > MAX_SAVE_BYTES) return false
  return matchesCanonicalSave(readPlumberFile(raw), raw)
}

/** The active slot, in the shape the front page reads, or null before the first game. */
export function readPlumberSave(raw: unknown): PlumberSave | null {
  const file = readPlumberFile(raw)
  const slot = file.slots[file.active]
  if (!slot) return null
  return { v: 1, ...slot, endlessBest: file.endlessBest }
}
