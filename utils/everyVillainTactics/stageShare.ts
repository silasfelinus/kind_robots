// Local stage drafts and a portable share code for the Stage Studio. A share
// code is plain JSON text. Importing rebuilds the stage field by field from
// a strict allow-list (unknown keys are dropped, strings are length-capped,
// nothing is ever evaluated) and then requires full studio validation.
// Server-side publishing, versions and permissions belong to t-011.
import type { Point, Side, TacticalMap, Tile } from './combat'
import type {
  StageHazard,
  StageProp,
  StageVictory,
  StageWave,
} from './stageRules'
import {
  CAMERAS,
  EMOTIONS,
  type Scene,
  type SceneEffect,
  type SceneNode,
  type SceneScript,
  type SceneTrigger,
} from './sceneGraph'
import {
  STAGE_ENCOUNTERS,
  stageProblems,
  type StageCivilian,
  type StageDraft,
  type StageSpawn,
} from './studio'

export const STAGE_CODE_KIND = 'every-villain-tactics-stage'
export const STAGE_CODE_VERSION = 1
export const MAX_STAGE_CODE = 60_000
export const MAX_DRAFTS = 12
export const evtDraftsKey = 'kr-every-villain-tactics:drafts'

export type StageDraftEntry = {
  name: string
  savedAt: string
  stage: StageDraft
}
export type DraftLibrary = { version: 1; drafts: StageDraftEntry[] }
export type ImportResult =
  { ok: true; stage: StageDraft } | { ok: false; reason: string }

const SPAWN_IDS = ['backdraft', 'priya', 'hattie', 'pip', 'vee', 'remy']
const SIDES: Side[] = ['north', 'south', 'east', 'west']

class Invalid extends Error {}
const fail = (reason: string): never => {
  throw new Invalid(reason)
}
const record = (value: unknown, what: string): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : fail(what + ' is malformed.')
const list = (value: unknown, what: string, max: number): unknown[] =>
  Array.isArray(value) && value.length <= max
    ? value
    : fail(what + ' is malformed or too long.')
const int = (value: unknown, min: number, max: number, what: string) =>
  Number.isInteger(value) &&
  (value as number) >= min &&
  (value as number) <= max
    ? (value as number)
    : fail(what + ' must be a whole number from ' + min + ' to ' + max + '.')
const text = (value: unknown, max: number, what: string) =>
  typeof value === 'string' && value.length <= max
    ? value
    : fail(what + ' must be text up to ' + max + ' characters.')
const slug = (value: unknown, what: string) => {
  const id = text(value, 40, what)
  return /^[a-z0-9][a-z0-9-]*$/.test(id)
    ? id
    : fail(what + ' may use lowercase letters, digits and dashes only.')
}
const point = (value: unknown, what: string): Point => {
  const p = record(value, what)
  return { x: int(p.x, 0, 8, what + ' x'), y: int(p.y, 0, 5, what + ' y') }
}
const oneOf = <T extends string>(
  value: unknown,
  options: readonly T[],
  what: string,
) =>
  options.includes(value as T) ? (value as T) : fail('Unknown ' + what + '.')

function cleanMap(value: unknown): TacticalMap {
  const map = record(value, 'Map')
  if (map.width !== 9 || map.height !== 6)
    fail('Shared stages use the 9 × 6 battlefield.')
  const tiles: Record<string, Tile> = {}
  const raw = record(map.tiles, 'Map tiles')
  if (Object.keys(raw).length > 54) fail('Map has too many tiles.')
  for (const [key, entry] of Object.entries(raw)) {
    const match = /^([0-8]),([0-5])$/.exec(key)
    if (!match) fail('Map tile ' + key.slice(0, 12) + ' is off the board.')
    const t = record(entry, 'Map tile')
    const tile: Tile = { elevation: int(t.elevation, 0, 2, 'Elevation') }
    if (t.wall !== undefined) {
      if (typeof t.wall !== 'boolean') fail('Wall flag is malformed.')
      if (t.wall) tile.wall = true
    }
    if (t.cover !== undefined) {
      const c = record(t.cover, 'Cover')
      const cover: Tile['cover'] = {}
      for (const side of SIDES)
        if (c[side] !== undefined)
          cover[side] = oneOf(c[side], ['half', 'full'] as const, 'cover')
      if (Object.keys(cover).length) tile.cover = cover
    }
    tiles[key] = tile
  }
  return { width: 9, height: 6, tiles }
}

function cleanVictory(value: unknown): StageVictory {
  const v = record(value, 'Victory')
  const kind = oneOf(
    v.kind,
    ['defeat-all', 'survive', 'rescue', 'defeat-boss', 'hold-zone'] as const,
    'victory condition',
  )
  if (kind === 'survive')
    return { kind, rounds: int(v.rounds, 1, 40, 'Survive rounds') }
  if (kind === 'rescue')
    return { kind, count: int(v.count, 1, 6, 'Rescue count') }
  if (kind === 'defeat-boss')
    return {
      kind,
      unit: oneOf(v.unit, ['pip', 'vee', 'remy'] as const, 'boss'),
    }
  if (kind === 'hold-zone')
    return {
      kind,
      rounds: int(v.rounds, 1, 40, 'Hold rounds'),
      cells: list(v.cells, 'Hold zone', 6).map((c) => point(c, 'Hold zone')),
    }
  return { kind }
}

const SPEAKER = /^[a-z][a-z0-9-]{0,39}$/
const nodeRef = (value: unknown, what: string): string | null =>
  value === null ? null : slug(value, what)
function cleanTrigger(value: unknown): SceneTrigger {
  const t = record(value, 'Scene trigger')
  const kind = oneOf(
    t.kind,
    [
      'opening',
      'closing',
      'turn',
      'tile',
      'sight',
      'health',
      'kill',
      'rescue',
      'secret',
      'objective',
      'after',
      'flag',
    ] as const,
    'scene trigger',
  )
  const team = () => oneOf(t.team, ['squad', 'rival'] as const, 'team')
  const unit = (v: unknown) => oneOf(v, SPAWN_IDS, 'scene unit')
  switch (kind) {
    case 'closing':
      return {
        kind,
        outcome: oneOf(
          t.outcome,
          ['victory', 'defeat', 'any'] as const,
          'outcome',
        ),
      }
    case 'turn':
      return { kind, round: int(t.round, 1, 40, 'Trigger round') }
    case 'tile':
      return { kind, ...point(t, 'Trigger tile'), team: team() }
    case 'sight':
      return { kind, unit: unit(t.unit), target: unit(t.target) }
    case 'health':
      return { kind, unit: unit(t.unit), atMost: int(t.atMost, 0, 6, 'Health') }
    case 'kill':
      return { kind, team: team(), count: int(t.count, 1, 6, 'Kill count') }
    case 'rescue':
      return { kind, count: int(t.count, 1, 6, 'Rescue count') }
    case 'objective':
      return { kind, progress: int(t.progress, 1, 40, 'Objective progress') }
    case 'after':
      return { kind, scene: slug(t.scene, 'Chained scene') }
    case 'flag':
      return { kind, flag: slug(t.flag, 'Flag') }
    default:
      return { kind }
  }
}
function cleanEffect(value: unknown): SceneEffect {
  const e = record(value, 'Choice effect')
  const kind = oneOf(e.kind, ['flag', 'heal', 'suppress'] as const, 'effect')
  return kind === 'flag' ? { kind, flag: slug(e.flag, 'Flag') } : { kind }
}
function cleanScript(value: unknown): SceneScript {
  const script = record(value, 'Scene script')
  if (script.version !== 1) fail('Unsupported scene script version.')
  return {
    version: 1,
    scenes: list(script.scenes, 'Scenes', 12).map((entry): Scene => {
      const scene = record(entry, 'Scene')
      return {
        id: slug(scene.id, 'Scene id'),
        title: text(scene.title, 80, 'Scene title'),
        trigger: cleanTrigger(scene.trigger),
        start: slug(scene.start, 'Scene start'),
        nodes: list(scene.nodes, 'Scene lines', 30).map((raw): SceneNode => {
          const n = record(raw, 'Scene line')
          const speaker = text(n.speaker, 40, 'Speaker')
          if (!SPEAKER.test(speaker)) fail('Speaker ids are lowercase slugs.')
          const node: SceneNode = {
            id: slug(n.id, 'Line id'),
            speaker,
            emotion: oneOf(n.emotion, EMOTIONS, 'emotion'),
            camera: oneOf(n.camera, CAMERAS, 'camera'),
            text: text(n.text, 400, 'Line'),
            next: nodeRef(n.next, 'Next line'),
          }
          if (n.choices !== undefined)
            node.choices = list(n.choices, 'Choices', 3).map((c) => {
              const choice = record(c, 'Choice')
              return {
                label: text(choice.label, 80, 'Choice label'),
                next: nodeRef(choice.next, 'Choice target'),
                effects: list(choice.effects, 'Choice effects', 3).map(
                  cleanEffect,
                ),
              }
            })
          return node
        }),
      }
    }),
  }
}

/** Rebuilds a stage from untrusted data using only known fields. */
export function cleanStage(value: unknown): StageDraft {
  const s = record(value, 'Stage')
  if (s.version !== 1) fail('Unsupported stage version.')
  const stage: StageDraft = {
    version: 1,
    id: slug(s.id, 'Stage id'),
    title: text(s.title, 80, 'Title'),
    venue: text(s.venue, 120, 'Venue'),
    objective: text(s.objective, 280, 'Objective'),
    map: cleanMap(s.map),
    spawns: list(s.spawns, 'Spawns', 6).map((entry): StageSpawn => {
      const spawn = record(entry, 'Spawn')
      return {
        id: oneOf(spawn.id, SPAWN_IDS, 'spawn'),
        ...point(spawn, 'Spawn'),
      }
    }),
    secrets: list(s.secrets, 'Secrets', 12).map((p) => point(p, 'Secret')),
    hazards: list(s.hazards, 'Hazard markers', 12).map((p) =>
      point(p, 'Hazard marker'),
    ),
    turnLimit:
      s.turnLimit === null ? null : int(s.turnLimit, 2, 40, 'Turn limit'),
  }
  if (s.encounter !== undefined)
    stage.encounter = oneOf(
      s.encounter,
      STAGE_ENCOUNTERS.flatMap((e) => (e.id ? [e.id] : [])),
      'rival line-up',
    )
  if (s.scenes !== undefined)
    stage.scenes = oneOf(s.scenes, ['picnic-panic'] as const, 'scene set')
  if (s.civilians !== undefined)
    stage.civilians = list(s.civilians, 'Civilians', 6).map(
      (entry): StageCivilian => {
        const c = record(entry, 'Civilian')
        return {
          id: slug(c.id, 'Civilian id'),
          name: text(c.name, 80, 'Civilian name'),
          ...point(c, 'Civilian'),
        }
      },
    )
  if (s.props !== undefined)
    stage.props = list(s.props, 'Props', 8).map((entry): StageProp => {
      const p = record(entry, 'Prop')
      return {
        id: slug(p.id, 'Prop id'),
        ...point(p, 'Prop'),
        cover: oneOf(p.cover, ['half', 'full'] as const, 'prop cover'),
        hp: int(p.hp, 1, 3, 'Prop HP'),
      }
    })
  if (s.activeHazards !== undefined)
    stage.activeHazards = list(s.activeHazards, 'Hazards', 10).map(
      (entry): StageHazard => {
        const h = record(entry, 'Hazard')
        const kind = oneOf(
          h.kind,
          ['fire', 'water', 'collapse'] as const,
          'hazard',
        )
        return {
          id: slug(h.id, 'Hazard id'),
          kind,
          ...point(h, 'Hazard'),
          ...(kind === 'collapse'
            ? { round: int(h.round, 1, 40, 'Collapse round') }
            : {}),
        }
      },
    )
  if (s.waves !== undefined)
    stage.waves = list(s.waves, 'Waves', 3).map((entry): StageWave => {
      const w = record(entry, 'Wave')
      return {
        round: int(w.round, 2, 40, 'Wave round'),
        crew: oneOf(
          w.crew,
          ['warren-wreckers', 'wombat-ronin', 'licensed-legends'] as const,
          'reinforcement crew',
        ),
        spawns: list(w.spawns, 'Wave spawns', 3).map((p) => point(p, 'Hatch')),
      }
    })
  if (s.victory !== undefined) stage.victory = cleanVictory(s.victory)
  if (s.script !== undefined) stage.script = cleanScript(s.script)
  return stage
}

export function exportStage(stage: StageDraft): string {
  return JSON.stringify({
    kind: STAGE_CODE_KIND,
    version: STAGE_CODE_VERSION,
    stage: cleanStage(JSON.parse(JSON.stringify(stage))),
  })
}

/** Parse a share code. Never throws and never evaluates its contents. */
export function importStage(code: string): ImportResult {
  if (typeof code !== 'string' || !code.trim())
    return { ok: false, reason: 'Paste a stage code first.' }
  if (code.length > MAX_STAGE_CODE)
    return { ok: false, reason: 'That stage code is too long.' }
  let data: unknown
  try {
    data = JSON.parse(code)
  } catch {
    return { ok: false, reason: 'That is not a readable stage code.' }
  }
  const wrapper = data as Record<string, unknown> | null
  if (
    !wrapper ||
    typeof wrapper !== 'object' ||
    wrapper.kind !== STAGE_CODE_KIND
  )
    return { ok: false, reason: 'That is not an Every Villain Tactics stage.' }
  if (wrapper.version !== STAGE_CODE_VERSION)
    return { ok: false, reason: 'That stage code comes from another version.' }
  let stage: StageDraft
  try {
    stage = cleanStage(wrapper.stage)
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, reason: error.message }
    throw error
  }
  const problems = stageProblems(stage)
  return problems.length
    ? { ok: false, reason: 'Stage fails validation: ' + problems[0] }
    : { ok: true, stage }
}

export const emptyLibrary = (): DraftLibrary => ({ version: 1, drafts: [] })

/** Keeps only drafts that still import cleanly; drops the rest. */
export function sanitizeLibrary(raw: unknown): DraftLibrary {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return emptyLibrary()
    }
  }
  const drafts = (data as DraftLibrary | null)?.drafts
  if (!Array.isArray(drafts)) return emptyLibrary()
  const kept: StageDraftEntry[] = []
  for (const entry of drafts.slice(0, MAX_DRAFTS)) {
    const e = entry as StageDraftEntry
    if (
      !e ||
      typeof e.name !== 'string' ||
      !e.name.trim() ||
      e.name.length > 60 ||
      typeof e.savedAt !== 'string' ||
      Number.isNaN(Date.parse(e.savedAt)) ||
      kept.some((k) => k.name === e.name)
    )
      continue
    const result = importStage(
      JSON.stringify({
        kind: STAGE_CODE_KIND,
        version: STAGE_CODE_VERSION,
        stage: e.stage,
      }),
    )
    if (result.ok)
      kept.push({ name: e.name, savedAt: e.savedAt, stage: result.stage })
  }
  return { version: 1, drafts: kept }
}

export function upsertDraft(
  library: DraftLibrary,
  name: string,
  stage: StageDraft,
  savedAt: string,
): { ok: true; library: DraftLibrary } | { ok: false; reason: string } {
  const label = name.trim().slice(0, 60)
  if (!label) return { ok: false, reason: 'Name the draft first.' }
  const problems = stageProblems(stage)
  if (problems.length)
    return { ok: false, reason: 'Fix the stage first: ' + problems[0] }
  const others = library.drafts.filter((d) => d.name !== label)
  if (others.length >= MAX_DRAFTS)
    return {
      ok: false,
      reason: 'The draft shelf holds ' + MAX_DRAFTS + ' stages.',
    }
  return {
    ok: true,
    library: {
      version: 1,
      drafts: [
        { name: label, savedAt, stage: JSON.parse(JSON.stringify(stage)) },
        ...others,
      ],
    },
  }
}
export const removeDraft = (library: DraftLibrary, name: string) => ({
  version: 1 as const,
  drafts: library.drafts.filter((d) => d.name !== name),
})
