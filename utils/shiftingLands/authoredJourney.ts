import pack from './authoredHomestead.json'
import {
  JOURNEY_WORLD,
  isJourneyState,
  newJourney,
  resolveJourney,
  stepJourney,
  type BossApproach,
  type EncounterApproach,
  type JourneyAction,
  type JourneyLog,
  type JourneyOutcome,
  type JourneyRoll,
  type JourneyShift,
  type JourneyState,
  type Skill,
} from './journey'

export type AuthoredEffect = {
  text: string
  hp_delta: number
  provisions_delta: number
  add_flags: string[]
  map_effect: 'none' | 'recorded-prospective-shift'
}
export type AuthoredChoice = {
  id: string
  label: string
  intent: string
  risk: string
  roll: { skill: Skill; modifier: number; target: number }
  success: AuthoredEffect
  failure: AuthoredEffect
}
export type AuthoredEncounter = {
  id: string
  locationId: string
  title: string
  flavor: string
  weight: number
  art: string | null
  choices: AuthoredChoice[]
}
export const AUTHORED_PACK = pack as unknown as {
  schemaVersion: number
  sourceSha: string
  locations: Array<{ location_id: string; encounter_ids: string[] }>
  encounters: AuthoredEncounter[]
}
const cards = new Map(AUTHORED_PACK.encounters.map((e) => [e.id, e]))
const skillBonus: Record<Skill, number> = {
  steel: 3, awareness: 2, wits: 2, bearing: 2, resolve: 2, insight: 2,
}
export type AuthoredResult = {
  locationId: string
  encounterId: string
  choiceId: string
  turn: number
  roll: JourneyRoll
  resultText: string
  hpChange: number
  provisionChange: number
  flags: string[]
}
export type AuthoredJourneyState = {
  version: 2
  packSha: string
  journey: JourneyState
  drawRng: number
  drawn: Record<string, string>
  outcomes: AuthoredResult[]
  flags: string[]
}
export type AuthoredAction =
  | { type: 'TRAVEL'; locationId: string }
  | { type: 'CHOOSE'; choiceId: string }
  | { type: 'RESOLVE'; approach: EncounterApproach }
  | { type: 'BOSS'; approach: BossApproach }
const random = (value: number): [number, number] => {
  const next = (Math.imul(value, 1664525) + 1013904223) >>> 0
  return [next, next / 4294967296]
}
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))
function encounterByLocation(seed: number, locationId: string): AuthoredEncounter | null {
  const location = AUTHORED_PACK.locations.find((l) => l.location_id === locationId)
  if (!location) return null
  const eligible = location.encounter_ids.map((id) => cards.get(id)).filter((e): e is AuthoredEncounter => !!e)
  if (!eligible.length) return null
  let key = (seed ^ 2166136261) >>> 0
  for (const character of locationId) key = Math.imul(key ^ character.charCodeAt(0), 16777619) >>> 0
  const total = eligible.reduce((sum, e) => sum + e.weight, 0)
  let offset = key % total
  for (const card of eligible) {
    offset -= card.weight
    if (offset < 0) return card
  }
  return null
}
export function newAuthoredJourney(seed: number): AuthoredJourneyState {
  const journey = newJourney(seed)
  return {
    version: 2,
    packSha: AUTHORED_PACK.sourceSha,
    journey,
    drawRng: (journey.seed ^ 0x6d2b79f5) >>> 0,
    drawn: {},
    outcomes: [],
    flags: [],
  }
}
export function activeAuthoredEncounter(state: AuthoredJourneyState): AuthoredEncounter | null {
  const active = state.journey.active
  if (!active) return null
  const id = state.drawn[active]
  return id ? cards.get(id) ?? null : null
}
export function authoredOutcomeForLocation(state: AuthoredJourneyState, id: string): AuthoredResult | null {
  return state.outcomes.find((outcome) => outcome.locationId === id) ?? null
}
export function validateAuthoredJourney(value: unknown): value is AuthoredJourneyState {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<AuthoredJourneyState>
  if (s.version !== 2 || s.packSha !== AUTHORED_PACK.sourceSha ||
    !isJourneyState(s.journey) ||
    !Number.isInteger(s.drawRng) || s.drawRng! < 0 || s.drawRng! > 0xffffffff ||
    !s.drawn || typeof s.drawn !== 'object' || Array.isArray(s.drawn) ||
    !Array.isArray(s.outcomes) || !Array.isArray(s.flags) ||
    s.flags.some((flag) => typeof flag !== 'string' || !/^[a-z][a-z0-9-]+$/.test(flag)))
    return false
  const seen = new Set<string>()
  for (const [locationId, encounterId] of Object.entries(s.drawn)) {
    const card = cards.get(encounterId)
    if (!card || card.locationId !== locationId ||
      !s.journey!.resolved.some((r) => r.locationId === locationId) &&
      s.journey!.active !== locationId)
      return false
  }
  for (const result of s.outcomes) {
    const card = cards.get(result?.encounterId)
    const choice = card?.choices.find((c) => c.id === result?.choiceId)
    const committed = s.journey!.resolved.find((r) => r.locationId === result?.locationId)
    if (!card || card.locationId !== result.locationId ||
      seen.has(result.locationId) || s.drawn[result.locationId] !== card.id ||
      !choice || !committed || committed.turn !== result.turn ||
      !Number.isInteger(result.turn) ||
      !Array.isArray(result.flags) || result.flags.some((f) => typeof f !== 'string') ||
      !Number.isInteger(result.hpChange) || !Number.isInteger(result.provisionChange) ||
      typeof result.resultText !== 'string' || result.resultText.length < 20 ||
      result.roll?.landId !== 'homestead' ||
      result.roll?.locationId !== result.locationId ||
      result.roll?.skill !== choice.roll.skill ||
      result.roll?.modifier !== skillBonus[choice.roll.skill] + choice.roll.modifier ||
      result.roll?.difficulty !== choice.roll.target ||
      !Array.isArray(result.roll?.dice) || result.roll.dice.length !== 2 ||
      result.roll.dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6) ||
      result.roll.total !== result.roll.dice[0]! + result.roll.dice[1]! + result.roll.modifier ||
      result.roll.success !== (result.roll.total >= result.roll.difficulty) ||
      committed.roll?.total !== result.roll.total || committed.approach !== 'test' ||
      committed.hpChange !== result.hpChange || committed.provisionChange !== result.provisionChange)
      return false
    seen.add(result.locationId)
  }
  if (Object.keys(s.drawn).some((id) =>
    s.journey!.resolved.some((r) => r.locationId === id) &&
    !s.outcomes!.some((result) => result.locationId === id)))
    return false
  if (s.journey!.resolved.some((r) => r.landId === 'homestead' &&
    (!s.drawn![r.locationId] || !seen.has(r.locationId))))
    return false
  return true
}
export function restoreAuthoredJourney(value: unknown): AuthoredJourneyState | null {
  return validateAuthoredJourney(value) ? value : null
}
export function stepAuthoredJourney(state: AuthoredJourneyState, action: AuthoredAction): AuthoredJourneyState {
  if (action.type === 'TRAVEL') {
    const next = stepJourney(state.journey, action)
    if (next === state.journey) return state
    if (!next.active || next.landIndex !== 0)
      return { ...state, journey: next }
    const selected = encounterByLocation(next.seed, next.active)
    if (!selected || state.drawn[next.active]) return state
    return {
      ...state,
      journey: next,
      drawn: { ...state.drawn, [next.active]: selected.id },
    }
  }
  if (action.type === 'BOSS') {
    const next = stepJourney(state.journey, action)
    return next === state.journey ? state : { ...state, journey: next }
  }
  if (action.type === 'RESOLVE') {
    if (state.journey.landIndex === 0) return state
    const next = stepJourney(state.journey, action as JourneyAction)
    return next === state.journey ? state : { ...state, journey: next }
  }
  if (action.type !== 'CHOOSE' || state.journey.landIndex !== 0) return state
  const encounter = activeAuthoredEncounter(state)
  const choice = encounter?.choices.find((item) => item.id === action.choiceId)
  if (!encounter || !choice || !state.journey.active ||
    state.outcomes.some((item) => item.locationId === encounter.locationId))
    return state

  const before = state.journey
  const [first, a] = random(state.drawRng)
  const [second, b] = random(first)
  const dice: [number, number] = [Math.floor(a * 6) + 1, Math.floor(b * 6) + 1]
  const modifier = skillBonus[choice.roll.skill] + choice.roll.modifier
  const total = dice[0] + dice[1] + modifier
  const roll: JourneyRoll = {
    landId: 'homestead', locationId: encounter.locationId,
    dice, skill: choice.roll.skill, modifier, difficulty: choice.roll.target,
    total, success: total >= choice.roll.target,
  }
  const consequence = roll.success ? choice.success : choice.failure

  // Use the existing deterministic travel/boss gate to complete exactly one
  // location. Its no-dice withdraw resolution is replaced atomically below
  // with the authored roll and outcome. No phantom cost or second roll survives.
  const advanced = resolveJourney(before, 'withdraw')
  if (advanced === before) return state
  const hp = clamp(before.hp + consequence.hp_delta, 8)
  const provisions = clamp(before.provisions + consequence.provisions_delta, 30)
  const hpChange = hp - before.hp
  const provisionChange = provisions - before.provisions
  const turn = advanced.turn
  const last = advanced.resolved[advanced.resolved.length - 1]!
  const resolved: JourneyOutcome[] = [
    ...advanced.resolved.slice(0, -1),
    { ...last, approach: 'test', roll, hpChange, provisionChange },
  ]
  const remaining = advanced.layouts.homestead!.filter((id) =>
    !resolved.some((r) => r.locationId === id))
  const entry: JourneyLog = {
    turn, kind: 'encounter', landId: 'homestead',
    text: encounter.title + ': ' + choice.label + '. ' +
      dice.join(' + ') + ' + ' + modifier + ' = ' + total +
      ' vs ' + choice.roll.target + '. ' + consequence.text,
  }
  const journal: JourneyLog[] = [...before.journal, entry]
  const layouts = { ...advanced.layouts }
  const shifts = [...advanced.shifts]
  if (consequence.map_effect === 'recorded-prospective-shift' && remaining.length === 2) {
    const earlier = [...layouts.homestead!]
    const after = [...earlier]
    const aIndex = earlier.indexOf(remaining[0]!)
    const bIndex = earlier.indexOf(remaining[1]!)
    ;[after[aIndex], after[bIndex]] = [earlier[bIndex]!, earlier[aIndex]!]
    const reason = encounter.title + ': ' + consequence.text
    const shift: JourneyShift = {
      landId: 'homestead', turn, causeLocationId: encounter.locationId,
      before: earlier, after, reason,
    }
    layouts.homestead = after
    shifts.push(shift)
    journal.push({ turn, kind: 'shift', landId: 'homestead', text: reason })
  }
  const phase = hp === 0 ? 'fallen' : remaining.length === 0 ? 'boss' : 'explore'
  if (phase === 'boss')
    journal.push({ turn, kind: 'boss', landId: 'homestead', text: JOURNEY_WORLD.lands[0]!.boss.label + ' is now reachable.' })
  if (phase === 'fallen')
    journal.push({ turn, kind: 'end', landId: 'homestead', text: 'Zuzu falls on the road. The journey ends.' })
  const journey: JourneyState = {
    ...advanced, rngState: before.rngState, layouts, shifts, journal, resolved,
    hp, provisions, lastRoll: roll, phase,
  }
  const outcome: AuthoredResult = {
    locationId: encounter.locationId, encounterId: encounter.id,
    choiceId: choice.id, turn, roll, resultText: consequence.text,
    hpChange, provisionChange, flags: consequence.add_flags,
  }
  return {
    ...state, journey, drawRng: second,
    outcomes: [...state.outcomes, outcome],
    flags: [...new Set([...state.flags, ...consequence.add_flags])],
  }
}
