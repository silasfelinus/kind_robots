import world from './worldSnapshot.json'

export const JOURNEY_WORLD = world
export type Skill = 'steel' | 'awareness' | 'wits' | 'bearing' | 'resolve' | 'insight'
export type JourneyPhase = 'explore' | 'boss' | 'complete' | 'fallen' | 'retired'
export type EncounterApproach = 'test' | 'withdraw'
export type BossApproach = 'challenge' | 'parley' | 'retreat'
export type JourneyRoll = {
  landId: string
  locationId: string
  dice: [number, number]
  skill: Skill
  modifier: number
  difficulty: number
  total: number
  success: boolean
}
export type JourneyOutcome = {
  landId: string
  locationId: string
  turn: number
  approach: EncounterApproach
  roll: JourneyRoll | null
  hpChange: number
  provisionChange: number
}
export type JourneyBoss = {
  landId: string
  id: string
  turn: number
  approach: 'challenge' | 'parley'
  roll: JourneyRoll
}
export type JourneyShift = {
  landId: string
  turn: number
  causeLocationId: string
  before: string[]
  after: string[]
  reason: string
}
export type JourneyLog = {
  turn: number
  kind: 'start' | 'travel' | 'encounter' | 'shift' | 'boss' | 'end'
  landId: string
  text: string
}
export type JourneyState = {
  version: 1
  manifestBlobSha: string
  seed: number
  rngState: number
  landIndex: number
  phase: JourneyPhase
  layouts: Record<string, string[]>
  position: string | null
  active: string | null
  resolved: JourneyOutcome[]
  bosses: JourneyBoss[]
  shifts: JourneyShift[]
  journal: JourneyLog[]
  lastRoll: JourneyRoll | null
  turn: number
  hp: number
  provisions: number
}
export type JourneyAction =
  | { type: 'TRAVEL'; locationId: string }
  | { type: 'RESOLVE'; approach: EncounterApproach }
  | { type: 'BOSS'; approach: BossApproach }

const SKILLS: Record<Skill, number> = {
  steel: 3, awareness: 2, wits: 2, bearing: 2, resolve: 2, insight: 2,
}
const SHIFT_CAUSES: Record<string, string> = {
  homestead: 'A fallen fence redirects the road through the Homestead',
  dustwater: 'The changing current closes a crossing along Dustwater',
  tablelands: 'A rockslide redirects the Tablelands trail',
  cave: 'A storm passing through the caverns changes the accessible tunnels',
  verge: 'A shifting obsidian ridge blocks the original approach',
}
const random = (value: number): [number, number] => {
  const next = (Math.imul(value, 1664525) + 1013904223) >>> 0
  return [next, next / 4294967296]
}
const landAt = (state: JourneyState) => JOURNEY_WORLD.lands[state.landIndex]!
const entry = (turn: number, kind: JourneyLog['kind'], landId: string, text: string): JourneyLog =>
  ({ turn, kind, landId, text })
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value))
const roll = (rng: number, landId: string, locationId: string, skill: Skill, difficulty: number):
  [number, JourneyRoll] => {
  const [first, a] = random(rng)
  const [second, b] = random(first)
  const dice: [number, number] = [Math.floor(a * 6) + 1, Math.floor(b * 6) + 1]
  const modifier = SKILLS[skill]
  const total = dice[0] + dice[1] + modifier
  return [second, { landId, locationId, dice, skill, modifier, difficulty, total, success: total >= difficulty }]
}

export function newJourney(seed: number): JourneyState {
  const safeSeed = Number.isFinite(seed) ? Math.max(1, Math.trunc(Math.abs(seed)) >>> 0) : 1
  let rng = safeSeed
  const layouts: Record<string, string[]> = {}
  for (const land of JOURNEY_WORLD.lands) {
    const ids = land.locations.map((location) => location.id)
    for (let i = ids.length - 1; i > 0; i--) {
      const [next, draw] = random(rng)
      rng = next
      const j = Math.floor(draw * (i + 1))
      ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    }
    layouts[land.id] = ids
  }
  return {
    version: 1, manifestBlobSha: JOURNEY_WORLD.source.blobSha, seed: safeSeed,
    rngState: rng, landIndex: 0, phase: 'explore', layouts, position: null,
    active: null, resolved: [], bosses: [], shifts: [],
    journal: [entry(0, 'start', JOURNEY_WORLD.lands[0]!.id, 'Zuzu enters the Homestead.')],
    lastRoll: null, turn: 0, hp: 8, provisions: 2,
  }
}

export function reachableLocations(state: JourneyState): string[] {
  if (state.phase !== 'explore' || state.active !== null) return []
  const land = landAt(state)
  const layout = state.layouts[land.id]!
  if (state.position === null) return layout.slice(0, 2)
  const index = layout.indexOf(state.position)
  if (index < 0) return []
  return [layout[(index + 1) % 3]!, layout[(index + 2) % 3]!]
}

export function travelJourney(state: JourneyState, locationId: string): JourneyState {
  if (!reachableLocations(state).includes(locationId)) return state
  const land = landAt(state)
  const location = land.locations.find((item) => item.id === locationId)
  if (!location) return state
  const turn = state.turn + 1
  const visited = state.resolved.some((item) => item.locationId === locationId)
  return {
    ...state, position: locationId, active: visited ? null : locationId, turn,
    journal: [...state.journal, entry(turn, 'travel', land.id,
      visited ? 'Zuzu returns to ' + location.label + '. This encounter cannot be drawn again.'
        : 'Zuzu reaches ' + location.label + '.')],
  }
}

export function resolveJourney(state: JourneyState, approach: EncounterApproach): JourneyState {
  if (state.phase !== 'explore' || state.active === null ||
      (approach !== 'test' && approach !== 'withdraw')) return state
  const land = landAt(state)
  const location = land.locations.find((candidate) => candidate.id === state.active)
  if (!location || state.resolved.some((item) => item.locationId === location.id)) return state
  const turn = state.turn + 1
  const [rng, check] = approach === 'test'
    ? roll(state.rngState, land.id, location.id, location.skill as Skill, location.difficulty)
    : [state.rngState, null] as const
  const hp = clamp(state.hp -
    (approach === 'withdraw' ? (state.provisions > 0 ? 0 : 1)
      : check!.success ? 0 : location.difficulty === 11 ? 2 : 1), 8)
  const provisions = clamp(state.provisions -
    (approach === 'withdraw' && state.provisions > 0 ? 1 : 0) +
    (check?.success && location.id === 'border-farm' ? 1 : 0), 30)
  const resolved: JourneyOutcome[] = [...state.resolved, {
    landId: land.id, locationId: location.id, turn, approach, roll: check,
    hpChange: hp - state.hp, provisionChange: provisions - state.provisions,
  }]
  const remaining = state.layouts[land.id]!.filter((id) => !resolved.some((item) => item.locationId === id))
  const shifts = [...state.shifts]
  const journal = [...state.journal, entry(turn, 'encounter', land.id,
    approach === 'withdraw' ? 'Zuzu withdraws from ' + location.label + ', paying the cost.'
      : location.label + ': ' + check!.dice.join('+') + ' + ' + check!.modifier +
        ' = ' + check!.total + ' versus ' + check!.difficulty + '. ' + (check!.success ? 'Passed.' : 'Failed.'))]
  const layouts = { ...state.layouts }
  if (remaining.length === 2 && check !== null && check.dice[0] % 2 === 0) {
    const before = [...layouts[land.id]!]
    const indices = before.map((id, index) => remaining.includes(id) ? index : -1).filter((index) => index >= 0)
    const after = [...before]
    ;[after[indices[0]!], after[indices[1]!]] = [before[indices[1]!]!, before[indices[0]!]!]
    const reason = (SHIFT_CAUSES[land.id] ?? 'The roads change') + ' after the encounter at ' + location.label + '.'
    shifts.push({ landId: land.id, turn, causeLocationId: location.id, before, after, reason })
    layouts[land.id] = after
    journal.push(entry(turn, 'shift', land.id, reason))
  }
  const phase: JourneyPhase = hp <= 0 ? 'fallen' : remaining.length === 0 ? 'boss' : 'explore'
  if (phase === 'fallen') journal.push(entry(turn, 'end', land.id, 'Zuzu falls on the road. The journey ends.'))
  if (phase === 'boss') journal.push(entry(turn, 'boss', land.id, land.boss.label + ' is now reachable.'))
  return {
    ...state, rngState: rng, layouts, shifts, journal, hp, provisions, resolved,
    lastRoll: check, active: null, turn, phase,
  }
}

export function confrontJourneyBoss(state: JourneyState, approach: BossApproach): JourneyState {
  if (state.phase !== 'boss' || !['challenge', 'parley', 'retreat'].includes(approach)) return state
  const land = landAt(state)
  const turn = state.turn + 1
  if (approach === 'retreat') return {
    ...state, phase: 'retired', turn,
    journal: [...state.journal, entry(turn, 'end', land.id, 'Zuzu leaves ' + land.name + ' without victory.')],
  }
  if (approach === 'parley' && state.provisions < 1) return state
  const skill: Skill = approach === 'challenge' ? 'steel' : 'bearing'
  const [rngState, check] = roll(state.rngState, land.id, land.boss.id, skill, 9 + state.landIndex)
  const provisions = state.provisions - (approach === 'parley' ? 1 : 0)
  const hp = clamp(state.hp - (check.success ? 0 : approach === 'challenge' ? 2 : 1), 8)
  const journal = [...state.journal, entry(turn, 'boss', land.id,
    land.boss.label + ': ' + approach + ', ' + check.dice.join('+') + ' + ' +
    check.modifier + ' versus ' + check.difficulty + ': ' + (check.success ? 'cleared.' : 'repelled.'))]
  if (!check.success) {
    if (hp === 0) journal.push(entry(turn, 'end', land.id, 'Zuzu falls before the trial.'))
    return { ...state, rngState, provisions, hp, journal, lastRoll: check,
      phase: hp === 0 ? 'fallen' : 'boss', turn }
  }
  const bosses: JourneyBoss[] = [...state.bosses, { landId: land.id, id: land.boss.id, turn,
    approach, roll: check }]
  const final = state.landIndex === JOURNEY_WORLD.lands.length - 1
  const phase: JourneyPhase = final ? 'complete' : 'explore'
  if (final) journal.push(entry(turn, 'end', land.id, 'Zuzu survives all five lands.'))
  else journal.push(entry(turn, 'start', JOURNEY_WORLD.lands[state.landIndex + 1]!.id,
    'Zuzu enters ' + JOURNEY_WORLD.lands[state.landIndex + 1]!.name + '.'))
  return {
    ...state, rngState, provisions, hp, bosses, journal, lastRoll: check,
    landIndex: final ? state.landIndex : state.landIndex + 1,
    phase, position: null, active: null, turn,
  }
}

export function stepJourney(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case 'TRAVEL': return travelJourney(state, action.locationId)
    case 'RESOLVE': return resolveJourney(state, action.approach)
    case 'BOSS': return confrontJourneyBoss(state, action.approach)
  }
}
export function replayJourney(seed: number, actions: readonly JourneyAction[]): JourneyState {
  let state = newJourney(seed)
  for (const action of actions) {
    const next = stepJourney(state, action)
    if (next === state) throw new Error('Illegal journey action: ' + action.type)
    state = next
  }
  return state
}
