import later from './authoredLaterLands.json'
import {
  AUTHORED_PACK,
  stepAuthoredJourney,
  type AuthoredAction,
  type AuthoredEncounter,
  type AuthoredJourneyState,
  type AuthoredResult,
} from './authoredJourney'
import {
  JOURNEY_WORLD,
  resolveJourney,
  type JourneyLog,
  type JourneyOutcome,
  type JourneyRoll,
  type JourneyShift,
  type JourneyState,
  type Skill,
} from './journey'

export const LATER_LAND_PACK = later as unknown as {
  schemaVersion: number
  sources: Array<{ path: string; blobSha: string }>
  locations: Array<{ location_id: string; encounter_ids: string[] }>
  encounters: AuthoredEncounter[]
}
export const FIVE_LAND_CARDS: readonly AuthoredEncounter[] = [
  ...AUTHORED_PACK.encounters,
  ...LATER_LAND_PACK.encounters,
]
const cards = new Map(FIVE_LAND_CARDS.map((card) => [card.id, card]))
const locations = new Map(
  LATER_LAND_PACK.locations.map((place) => [
    place.location_id,
    place.encounter_ids,
  ]),
)
const BASE_SKILLS: Record<Skill, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}
const random = (value: number): [number, number] => {
  const next = (Math.imul(value, 1664525) + 1013904223) >>> 0
  return [next, next / 4294967296]
}
const clamp = (value: number, ceiling: number): number =>
  Math.max(0, Math.min(ceiling, value))

export function findFiveLandCard(id: string): AuthoredEncounter | null {
  return cards.get(id) ?? null
}

export function activeFiveLandEncounter(
  state: AuthoredJourneyState,
): AuthoredEncounter | null {
  const active = state.journey.active
  if (!active) return null
  const id = state.drawn[active]
  return id ? findFiveLandCard(id) : null
}

function fixedDraw(seed: number, locationId: string): AuthoredEncounter | null {
  const ids = locations.get(locationId)
  if (!ids) return null
  const eligible = ids
    .map((id) => cards.get(id))
    .filter((c): c is AuthoredEncounter => !!c)
  if (!eligible.length) return null
  let hash = (seed ^ 2166136261) >>> 0
  for (const character of locationId)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const total = eligible.reduce((sum, encounter) => sum + encounter.weight, 0)
  let offset = hash % total
  for (const encounter of eligible) {
    offset -= encounter.weight
    if (offset < 0) return encounter
  }
  return null
}

/**
 * V4-only gameplay. The legacy V2/V3 reducer remains unchanged, so historical
 * prototype checks in Dustwater and later lands keep their saved dice/rules.
 */
export function stepFiveLandJourney(
  state: AuthoredJourneyState,
  action: AuthoredAction,
): AuthoredJourneyState {
  const land = JOURNEY_WORLD.lands[state.journey.landIndex]!
  if (land.id === 'homestead') return stepAuthoredJourney(state, action)
  if (action.type === 'TRAVEL') {
    const traveled = stepAuthoredJourney(state, action)
    if (traveled === state || !traveled.journey.active) return traveled
    const locationId = traveled.journey.active
    const fixed = fixedDraw(traveled.journey.seed, locationId)
    if (!fixed || traveled.drawn[locationId]) return traveled
    return {
      ...traveled,
      drawn: { ...traveled.drawn, [locationId]: fixed.id },
    }
  }
  if (action.type === 'BOSS') return stepAuthoredJourney(state, action)
  // Old prototype RESOLVE is not a legal V4 encounter action.
  if (action.type !== 'CHOOSE') return state

  const encounter = activeFiveLandEncounter(state)
  const choice = encounter?.choices.find((item) => item.id === action.choiceId)
  if (
    !encounter ||
    !choice ||
    encounter.locationId !== state.journey.active ||
    state.outcomes.some((item) => item.locationId === encounter.locationId)
  )
    return state

  const before = state.journey
  const [first, a] = random(state.drawRng)
  const [second, b] = random(first)
  const dice: [number, number] = [Math.floor(a * 6) + 1, Math.floor(b * 6) + 1]
  const modifier = BASE_SKILLS[choice.roll.skill] + choice.roll.modifier
  const total = dice[0] + dice[1] + modifier
  const roll: JourneyRoll = {
    landId: land.id,
    locationId: encounter.locationId,
    dice,
    skill: choice.roll.skill,
    modifier,
    difficulty: choice.roll.target,
    total,
    success: total >= choice.roll.target,
  }
  const consequence = roll.success ? choice.success : choice.failure
  const advanced = resolveJourney(before, 'withdraw')
  if (advanced === before) return state

  const hp = clamp(before.hp + consequence.hp_delta, 8)
  const provisions = clamp(before.provisions + consequence.provisions_delta, 30)
  const turn = advanced.turn
  const last = advanced.resolved[advanced.resolved.length - 1]!
  const resolved: JourneyOutcome[] = [
    ...advanced.resolved.slice(0, -1),
    {
      ...last,
      approach: 'test',
      roll,
      hpChange: hp - before.hp,
      provisionChange: provisions - before.provisions,
    },
  ]
  const remaining = advanced.layouts[land.id]!.filter(
    (id) => !resolved.some((result) => result.locationId === id),
  )
  const journal: JourneyLog[] = [
    ...before.journal,
    {
      turn,
      kind: 'encounter',
      landId: land.id,
      text:
        encounter.title +
        ': ' +
        choice.label +
        '. ' +
        dice.join(' + ') +
        ' + ' +
        modifier +
        ' = ' +
        total +
        ' vs ' +
        choice.roll.target +
        '. ' +
        consequence.text,
    },
  ]
  const layouts = { ...advanced.layouts }
  const shifts = [...advanced.shifts]
  if (
    consequence.map_effect === 'recorded-prospective-shift' &&
    remaining.length === 2
  ) {
    const prior = [...layouts[land.id]!]
    const after = [...prior]
    const firstIndex = prior.indexOf(remaining[0]!)
    const secondIndex = prior.indexOf(remaining[1]!)
    ;[after[firstIndex], after[secondIndex]] = [
      prior[secondIndex]!,
      prior[firstIndex]!,
    ]
    const reason = encounter.title + ': ' + consequence.text
    const shift: JourneyShift = {
      landId: land.id,
      turn,
      causeLocationId: encounter.locationId,
      before: prior,
      after,
      reason,
    }
    layouts[land.id] = after
    shifts.push(shift)
    journal.push({ turn, kind: 'shift', landId: land.id, text: reason })
  }
  const phase =
    hp === 0 ? 'fallen' : remaining.length === 0 ? 'boss' : 'explore'
  if (phase === 'boss')
    journal.push({
      turn,
      kind: 'boss',
      landId: land.id,
      text: land.boss.label + ' is now reachable.',
    })
  if (phase === 'fallen')
    journal.push({
      turn,
      kind: 'end',
      landId: land.id,
      text: 'You fall on the road. The journey ends.',
    })
  const journey: JourneyState = {
    ...advanced,
    rngState: before.rngState,
    layouts,
    shifts,
    journal,
    resolved,
    hp,
    provisions,
    lastRoll: roll,
    phase,
  }
  const result: AuthoredResult = {
    locationId: encounter.locationId,
    encounterId: encounter.id,
    choiceId: choice.id,
    turn,
    roll,
    resultText: consequence.text,
    hpChange: hp - before.hp,
    provisionChange: provisions - before.provisions,
    flags: consequence.add_flags,
  }
  return {
    ...state,
    journey,
    drawRng: second,
    outcomes: [...state.outcomes, result],
    flags: [...new Set([...state.flags, ...consequence.add_flags])],
  }
}

export function validateLaterLandContent(): string[] {
  const errors: string[] = []
  if (
    LATER_LAND_PACK.schemaVersion !== 1 ||
    LATER_LAND_PACK.encounters.length !== 36
  )
    errors.push('Later-land schema/version/card count mismatch')
  if (
    LATER_LAND_PACK.sources.length !== 4 ||
    LATER_LAND_PACK.sources.some(
      (source) => !/^[0-9a-f]{40}$/.test(source.blobSha),
    )
  )
    errors.push('Missing pinned Conductor source sha')
  if (LATER_LAND_PACK.locations.length !== 12)
    errors.push('Missing later-land location pools')
  const knownLocations = new Set(
    JOURNEY_WORLD.lands
      .slice(1)
      .flatMap((land) => land.locations.map((loc) => loc.id)),
  )
  const encountered = new Set<string>()
  for (const place of LATER_LAND_PACK.locations) {
    if (
      !knownLocations.has(place.location_id) ||
      place.encounter_ids.length !== 3
    )
      errors.push('Bad location pool: ' + place.location_id)
    for (const id of place.encounter_ids) {
      const card = findFiveLandCard(id)
      if (!card || card.locationId !== place.location_id || encountered.has(id))
        errors.push('Bad encounter membership: ' + id)
      encountered.add(id)
    }
  }
  if (encountered.size !== 36)
    errors.push('Missing or repeated later-land encounter IDs')
  for (const card of LATER_LAND_PACK.encounters) {
    if (
      !encountered.has(card.id) ||
      card.art !== null ||
      card.choices.length < 2 ||
      card.flavor.length < 90 ||
      card.choices.some(
        (choice) =>
          choice.id.length === 0 ||
          choice.success.text === choice.failure.text ||
          choice.success.text.length < 30 ||
          choice.failure.text.length < 30,
      )
    )
      errors.push('Invalid authored card: ' + card.id)
  }
  return errors
}
