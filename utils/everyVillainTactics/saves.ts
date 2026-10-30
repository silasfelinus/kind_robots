// Versioned save slots for Every Villain Tactics. A save captures the exact
// seeded battle (RNG state, units, statuses, cooldowns, warnings), the First
// Bell story run and the trigger history, so a reload continues the same
// fight instead of rerolling it. Prom of Doom keeps its own save key.
//
// Integrity has two layers. A checksum over the canonical payload catches
// corruption and casual edits. Because anyone can recompute a client-side
// checksum, every load is also rebuilt against a fresh reference roster and
// rejected when an immutable field (identity, max HP, role stats, power) or a
// rule invariant (bounds, walls, overlaps, cooldown range) does not hold.
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import { FIRST_BELL_MAP, inside, tileAt, type Point } from './combat'
import type {
  Beat,
  ChoiceEffect,
  Perspective,
  StoryRun,
} from './firstBellStory'
import { tacticFor } from './powers'
import { stageProblems, type StageDraft } from './studio'
import {
  KNOWN_TRIGGERS,
  trainingState,
  type TrainingState,
  type Unit,
} from './training'

export const EVT_SAVE_VERSION = 2
export const EVT_SAVE_KIND = 'every-villain-tactics'
export const EVT_SAVE_SLOTS = ['auto', 'slot-1', 'slot-2', 'slot-3'] as const
export type EvtSaveSlot = (typeof EVT_SAVE_SLOTS)[number]
/** Story saves are the First Bell campaign; one-shots are studio battles.
 * A one-shot can never be loaded as, or overwrite the meaning of, a story. */
export type EvtSaveMode = 'story' | 'oneshot'
export const evtSaveKey = (slot: EvtSaveSlot) =>
  'kr-every-villain-tactics:save:' + slot

export type EvtSave = {
  kind: typeof EVT_SAVE_KIND
  version: typeof EVT_SAVE_VERSION
  slot: EvtSaveSlot
  mode: EvtSaveMode
  savedAt: string
  perspective: Perspective
  leadSignature: SignaturePowerId
  /** The one-shot's stage draft; null for story saves. */
  stage: StageDraft | null
  state: TrainingState
  story: StoryRun
  checksum: string
}
export type EvtSaveSummary = {
  slot: EvtSaveSlot
  mode: EvtSaveMode
  savedAt: string
  lead: string
  turn: number
  phase: TrainingState['phase']
  title: string
}
export type LoadResult =
  { ok: true; save: EvtSave; migrated: boolean } | { ok: false; reason: string }

const PERSPECTIVES: readonly Perspective[] = [
  'hero',
  'villain',
  'henchman',
  'sidekick',
]
const BEATS: readonly Beat[] = [
  'arrival',
  'alarm',
  'reckoning',
  'victory',
  'defeat',
]
const EFFECTS: readonly ChoiceEffect[] = [
  'catwalk',
  'service',
  'rescue',
  'contain',
  'spare',
  'press',
  'finish',
]
const STATUSES = ['guarded', 'suppressed', 'marked']

/** Stable JSON: object keys sorted, undefined dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value))
    return (
      '[' + value.map((item) => canonicalJson(item ?? null)).join(',') + ']'
    )
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return (
    '{' +
    entries
      .map(([k, v]) => JSON.stringify(k) + ':' + canonicalJson(v))
      .join(',') +
    '}'
  )
}
function hash32(text: string, seed: number): string {
  let h = seed >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
/** Version 1 used a single FNV-1a word over the same canonical payload. */
export const checksumV1 = (payload: unknown) =>
  hash32(canonicalJson(payload), 2166136261)
export function saveChecksum(payload: Omit<EvtSave, 'checksum'>): string {
  const text = canonicalJson(payload)
  return hash32(text, 2166136261) + hash32(text, 0x9e3779b9)
}

export function createSave(input: {
  slot: EvtSaveSlot
  perspective: Perspective
  leadSignature: string
  stage: StageDraft | null
  state: TrainingState
  story: StoryRun
  savedAt?: string
}): EvtSave {
  const payload: Omit<EvtSave, 'checksum'> = {
    kind: EVT_SAVE_KIND,
    version: EVT_SAVE_VERSION,
    slot: input.slot,
    mode: input.stage ? 'oneshot' : 'story',
    savedAt: input.savedAt ?? new Date().toISOString(),
    perspective: input.perspective,
    leadSignature: input.leadSignature as SignaturePowerId,
    stage: input.stage ? structuredClone(input.stage) : null,
    state: structuredClone(input.state),
    story: structuredClone(input.story),
  }
  return { ...payload, checksum: saveChecksum(payload) }
}
export const serializeSave = (save: EvtSave) => JSON.stringify(save)

/** v1 was the pre-power battle shape: no mode, no trigger history, and
 * units without tactical roles. Migration keeps those units on the original
 * default profile rather than inventing HP or powers mid-battle. */
function migrateV1(raw: Record<string, unknown>): LoadResult {
  const { checksum, ...rest } = raw
  if (typeof checksum !== 'string' || checksumV1(rest) !== checksum)
    return {
      ok: false,
      reason: 'Version 1 checksum mismatch: save was edited.',
    }
  const state = rest.state as TrainingState | undefined
  const story = rest.story as StoryRun | undefined
  if (
    !state ||
    typeof state !== 'object' ||
    !story ||
    typeof story !== 'object'
  )
    return { ok: false, reason: 'Version 1 save is missing its battle.' }
  const fired = [
    ...(Array.isArray(story.seen) ? story.seen : []).map(
      (beat) => 'story:' + beat,
    ),
    ...(Number.isInteger(state.turn) && state.turn >= 3 ? ['fire-alarm'] : []),
  ]
  const payload = {
    ...rest,
    version: EVT_SAVE_VERSION,
    mode: rest.stage ? 'oneshot' : 'story',
    stage: rest.stage ?? null,
    state: { ...state, fired },
  } as Omit<EvtSave, 'checksum'>
  return validateSave({ ...payload, checksum: saveChecksum(payload) }, true)
}

/** Parse, migrate and verify a stored save. Never throws. */
export function loadSave(raw: unknown): LoadResult {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return { ok: false, reason: 'Save data is not readable JSON.' }
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return { ok: false, reason: 'Save data is empty or malformed.' }
  const record = data as Record<string, unknown>
  if (record.kind !== EVT_SAVE_KIND)
    return { ok: false, reason: 'This is not an Every Villain Tactics save.' }
  if (record.version === 1) return migrateV1(record)
  if (typeof record.version !== 'number' || record.version > EVT_SAVE_VERSION)
    return { ok: false, reason: 'Save comes from a newer or unknown version.' }
  if (record.version !== EVT_SAVE_VERSION)
    return { ok: false, reason: 'Unsupported save version.' }
  const { checksum, ...payload } = record
  if (checksum !== saveChecksum(payload as Omit<EvtSave, 'checksum'>))
    return {
      ok: false,
      reason: 'Checksum mismatch: save was edited or corrupted.',
    }
  return validateSave(record as unknown as EvtSave, false)
}

const isInt = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) &&
  (value as number) >= min &&
  (value as number) <= max
const isBool = (value: unknown) => typeof value === 'boolean'
function isCell(value: unknown, state: TrainingState): boolean {
  const p = value as Point
  return (
    !!p &&
    typeof p === 'object' &&
    isInt(p.x, 0, 99) &&
    isInt(p.y, 0, 99) &&
    inside(state.map, p) &&
    !tileAt(state.map, p).wall
  )
}
const optionalCell = (value: unknown, state: TrainingState) =>
  value === undefined || value === null || isCell(value, state)

/** Fields fixed when the battle starts. A save may not change them. */
const IMMUTABLE: readonly (keyof Unit)[] = [
  'identity',
  'team',
  'maxHp',
  'henchmanName',
  'henchmanType',
  'lieutenantName',
  'signatureBoss',
  'role',
  'weapon',
  'aim',
  'reach',
  'mobility',
  'defense',
  'power',
]
const MUTABLE = new Set<string>([
  'id',
  'x',
  'y',
  'hp',
  'ap',
  'moved',
  'fired',
  'overwatch',
  'statuses',
  'burrowTarget',
  'seismicTarget',
  'seismicChargeHp',
  'signatureTarget',
  'signatureCounter',
  'signatureChargeHp',
  'signatureCooldown',
  'signatureSupportUsed',
  'powerCooldown',
  'powerSpent',
])

function reject(reason: string): LoadResult {
  return { ok: false, reason }
}
function validateSave(save: EvtSave, migrated: boolean): LoadResult {
  if (!EVT_SAVE_SLOTS.includes(save.slot)) return reject('Unknown save slot.')
  if (!PERSPECTIVES.includes(save.perspective))
    return reject('Unknown story perspective.')
  if (
    typeof save.savedAt !== 'string' ||
    Number.isNaN(Date.parse(save.savedAt))
  )
    return reject('Save timestamp is invalid.')
  if (!IDENTITY_ARCS.some((arc) => arc.signature === save.leadSignature))
    return reject('Squad lead is not one of the canonical 48.')
  if (save.mode !== (save.stage ? 'oneshot' : 'story'))
    return reject('Save mode does not match its stage.')
  if (save.stage && stageProblems(save.stage).length)
    return reject('One-shot stage fails studio validation.')

  const state = save.state
  if (!state || typeof state !== 'object' || !Array.isArray(state.units))
    return reject('Battle state is missing.')
  const expectedMap = save.stage ? save.stage.map : FIRST_BELL_MAP
  if (canonicalJson(state.map) !== canonicalJson(expectedMap))
    return reject('Battlefield terrain does not match the mission.')
  if (state.stageId !== (save.stage?.id ?? null))
    return reject('Stage id does not match.')
  if (state.turnLimit !== (save.stage?.turnLimit ?? null))
    return reject('Turn limit does not match the mission.')
  if (!isInt(state.seed, 1, 0xffffffff)) return reject('RNG state is invalid.')
  if (!isInt(state.turn, 1, (state.turnLimit ?? 300) + 1))
    return reject('Turn counter is out of range.')
  if (!['active', 'victory', 'defeat'].includes(state.phase))
    return reject('Battle phase is invalid.')
  if (!['move', 'fire', 'power'].includes(state.mode))
    return reject('Command mode is invalid.')
  if (state.hover !== null && !isInt(state.hover?.x, 0, 99))
    return reject('Hover cell is invalid.')
  if (
    typeof state.log !== 'string' ||
    state.log.length > 600 ||
    !Array.isArray(state.events) ||
    state.events.length > 6 ||
    !state.events.every((e) => typeof e === 'string' && e.length <= 600)
  )
    return reject('Battle log is malformed.')
  if (
    !Array.isArray(state.fired) ||
    new Set(state.fired).size !== state.fired.length ||
    !state.fired.every((id) => KNOWN_TRIGGERS.includes(id))
  )
    return reject('Trigger history is malformed.')

  // Rebuild the starting roster and compare every immutable unit field.
  // A migrated pre-role battle keeps the legacy roster for its whole life.
  const legacy = state.units.every((unit) => unit.role === undefined)
  const reference = trainingState(1, save.stage ?? undefined, {
    lead: save.leadSignature,
    roles: !legacy,
  })
  if (state.units.length !== reference.units.length)
    return reject('Unit roster does not match the mission.')
  const occupied = new Set<string>()
  for (const unit of state.units) {
    const base = reference.units.find((u) => u.id === unit.id)
    if (!base) return reject('Unknown unit ' + String(unit.id) + '.')
    for (const field of Object.keys(unit))
      if (!MUTABLE.has(field) && !IMMUTABLE.includes(field as keyof Unit))
        return reject('Unexpected unit field ' + field + '.')
    for (const field of IMMUTABLE)
      if (unit[field] !== base[field])
        return reject(base.id + ' has a forged ' + field + '.')
    if (!isInt(unit.hp, 0, unit.maxHp))
      return reject(unit.id + ' HP is invalid.')
    if (!isInt(unit.ap, 0, 3)) return reject(unit.id + ' AP is invalid.')
    if (!isBool(unit.moved) || !isBool(unit.fired) || !isBool(unit.overwatch))
      return reject(unit.id + ' action flags are invalid.')
    if (
      !Array.isArray(unit.statuses) ||
      new Set(unit.statuses).size !== unit.statuses.length ||
      !unit.statuses.every((s) => STATUSES.includes(s))
    )
      return reject(unit.id + ' statuses are invalid.')
    if (!isCell(unit, state))
      return reject(unit.id + ' stands off the map or in a wall.')
    if (unit.hp > 0) {
      const at = unit.x + ',' + unit.y
      if (occupied.has(at)) return reject('Two units share a tile.')
      occupied.add(at)
    }
    for (const point of [
      unit.burrowTarget,
      unit.seismicTarget,
      unit.signatureTarget,
      unit.signatureCounter,
    ])
      if (!optionalCell(point, state))
        return reject(unit.id + ' warning tile is invalid.')
    for (const charge of [unit.seismicChargeHp, unit.signatureChargeHp])
      if (charge !== undefined && !isInt(charge, 0, unit.maxHp))
        return reject(unit.id + ' charge is invalid.')
    const power = unit.power ? tacticFor(unit.power) : undefined
    if (power) {
      if (!isInt(unit.powerCooldown, 0, power.cooldown))
        return reject(unit.id + ' power recharge is invalid.')
      if (!isBool(unit.powerSpent) || (unit.powerSpent && power.cooldown !== 0))
        return reject(unit.id + ' power use is invalid.')
    } else if (
      unit.powerCooldown !== undefined ||
      unit.powerSpent !== undefined
    )
      return reject(unit.id + ' has power state without a power.')
  }
  if (!state.units.some((u) => u.id === state.selected && u.team === 'squad'))
    return reject('Selected unit is not in the squad.')
  if (
    state.impact !== null &&
    !(
      state.units.some((u) => u.id === state.impact?.attacker) &&
      state.units.some((u) => u.id === state.impact?.target) &&
      isBool(state.impact?.hit) &&
      isInt(state.impact?.serial, 0, 1e9)
    )
  )
    return reject('Impact record is invalid.')

  const story = save.story
  if (
    !story ||
    !(story.current === null || BEATS.includes(story.current)) ||
    !Array.isArray(story.seen) ||
    new Set(story.seen).size !== story.seen.length ||
    !story.seen.every((beat) => BEATS.includes(beat)) ||
    !Array.isArray(story.decisions) ||
    story.decisions.length !== story.seen.length ||
    !story.decisions.every((effect) => EFFECTS.includes(effect)) ||
    !(
      story.approach === null || ['catwalk', 'service'].includes(story.approach)
    ) ||
    !isInt(story.civilians, 0, 20) ||
    !isInt(story.evidence, 0, 20) ||
    !isBool(story.mercy) ||
    !isBool(story.completed)
  )
    return reject('Story progress is malformed.')
  for (const beat of story.seen)
    if (!state.fired.includes('story:' + beat))
      return reject('Story beat ' + beat + ' is missing from trigger history.')
  if (
    story.completed &&
    !story.seen.some((b) => b === 'victory' || b === 'defeat')
  )
    return reject('Story claims an ending that never fired.')
  return { ok: true, save, migrated }
}

export function summarizeSave(save: EvtSave): EvtSaveSummary {
  const lead = IDENTITY_ARCS.find((arc) => arc.signature === save.leadSignature)
  return {
    slot: save.slot,
    mode: save.mode,
    savedAt: save.savedAt,
    lead: lead?.hero.alias ?? save.leadSignature,
    turn: save.state.turn,
    phase: save.state.phase,
    title: save.stage?.title ?? 'First Bell',
  }
}

/** Most recently saved valid slot, for Continue. */
export function latestSave(saves: readonly EvtSave[]): EvtSave | null {
  return (
    [...saves].sort(
      (a, b) =>
        Date.parse(b.savedAt) - Date.parse(a.savedAt) ||
        EVT_SAVE_SLOTS.indexOf(a.slot) - EVT_SAVE_SLOTS.indexOf(b.slot),
    )[0] ?? null
  )
}

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
/** Storage can be missing or throw (private mode, quota); never crash play. */
export function writeSlot(storage: SaveStorage | null, save: EvtSave): boolean {
  if (!storage) return false
  try {
    storage.setItem(evtSaveKey(save.slot), serializeSave(save))
    return true
  } catch {
    return false
  }
}
/** null means the slot is empty; a failed result explains a rejected save. */
export function readSlot(
  storage: SaveStorage | null,
  slot: EvtSaveSlot,
): LoadResult | null {
  if (!storage) return null
  let raw: string | null = null
  try {
    raw = storage.getItem(evtSaveKey(slot))
  } catch {
    return { ok: false, reason: 'Browser storage is unavailable.' }
  }
  if (raw === null) return null
  const result = loadSave(raw)
  if (result.ok && result.save.slot !== slot)
    return { ok: false, reason: 'Save was copied from another slot.' }
  return result
}
export function clearSlot(storage: SaveStorage | null, slot: EvtSaveSlot) {
  try {
    storage?.removeItem(evtSaveKey(slot))
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
