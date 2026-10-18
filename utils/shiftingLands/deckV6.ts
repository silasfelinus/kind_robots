import additions from './authoredDecksV6.json'
import {
  AUTHORED_PACK,
  type AuthoredChoice,
  type AuthoredEffect,
  type AuthoredJourneyState,
  type AuthoredResult,
} from './authoredJourney'
import { LATER_LAND_PACK } from './authoredFiveLands'
import {
  JOURNEY_WORLD,
  newJourney,
  resolveJourney,
  stepJourney,
  type JourneyLog,
  type JourneyOutcome,
  type JourneyRoll,
  type JourneyShift,
  type JourneyState,
  type Skill,
} from './journey'

// zuzu-shifting-lands/t-031 (Silas, 2026-10-18): Shifting Desks-depth decks.
// Eight cards per location, three or four choices per card. A choice may be
// certain (no roll), gated on a deed flag earned earlier in the run, or carry
// an up-front cost, and every outcome can mark the moral ledger. The original
// 48 cards keep their text and their first two choices; V6 only adds to them,
// so V2-V5 saves still replay against the untouched base packs.

export const MARKS = [
  'mercy',
  'honesty',
  'courage',
  'cunning',
  'ruthlessness',
] as const
export type Mark = (typeof MARKS)[number]
export type Marks = Record<Mark, number>

export const DEED_FLAGS: Readonly<Record<string, string>> = {
  'deed-shared-bread': 'you gave your food to someone who needed it',
  'deed-kept-promise': 'you kept a promise that cost you',
  'deed-told-truth': 'you told an unwelcome truth',
  'deed-spared-foe': 'you spared someone who wronged you',
  'deed-carries-medicine': 'you carry medicine',
  'deed-knows-old-roads': 'you know the old roads',
  'deed-marked-by-wardens': 'the wardens know your face',
  'deed-owed-favor': 'someone on the road owes you',
  'deed-bloodied-hands': 'you have hurt someone to get your way',
  'deed-left-someone': 'you walked away from someone who needed you',
}

export type V6Effect = AuthoredEffect & { marks?: Partial<Marks> }
export type V6Choice = {
  id: string
  label: string
  intent: string
  risk: string
  requires: { anyFlags: string[] } | null
  cost: { hp?: number; provisions?: number } | null
  roll: AuthoredChoice['roll'] | null
  success: V6Effect
  failure: V6Effect | null
}
export type V6Card = {
  id: string
  locationId: string
  title: string
  flavor: string
  weight: number
  art: string | null
  choices: V6Choice[]
}

export const DECK_V6 = additions as unknown as {
  schemaVersion: number
  newCards: V6Card[]
  addedChoices: Record<string, V6Choice[]>
}

const fromBase = (choice: AuthoredChoice): V6Choice => ({
  ...choice,
  requires: null,
  cost: null,
})

export const V6_CARDS: readonly V6Card[] = [
  ...[...AUTHORED_PACK.encounters, ...LATER_LAND_PACK.encounters].map(
    (card) => ({
      ...card,
      choices: [
        ...card.choices.map(fromBase),
        ...(DECK_V6.addedChoices[card.id] ?? []),
      ],
    }),
  ),
  ...DECK_V6.newCards,
]
const cards = new Map(V6_CARDS.map((card) => [card.id, card]))
const pools = new Map<string, V6Card[]>()
for (const card of V6_CARDS)
  pools.set(card.locationId, [...(pools.get(card.locationId) ?? []), card])

export function v6Card(id: string): V6Card | null {
  return cards.get(id) ?? null
}

export function v6Pool(locationId: string): readonly V6Card[] {
  return pools.get(locationId) ?? []
}

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

export type V6Result = Omit<AuthoredResult, 'roll'> & {
  roll: JourneyRoll | null
  success: boolean
  marks: Partial<Marks>
}
export type JourneyStateV6 = {
  version: 6
  journey: JourneyState
  drawRng: number
  drawn: Record<string, string>
  outcomes: V6Result[]
  flags: string[]
  marks: Marks
}
export type ActionV6 =
  { type: 'TRAVEL'; locationId: string } | { type: 'CHOOSE'; choiceId: string }

export function newJourneyV6(seed: number): JourneyStateV6 {
  const journey = newJourney(seed)
  return {
    version: 6,
    journey,
    drawRng: (journey.seed ^ 0x6d2b79f5) >>> 0,
    drawn: {},
    outcomes: [],
    flags: [],
    marks: { mercy: 0, honesty: 0, courage: 0, cunning: 0, ruthlessness: 0 },
  }
}

export function activeV6Card(state: JourneyStateV6): V6Card | null {
  const active = state.journey.active
  const id = active ? state.drawn[active] : null
  return id ? v6Card(id) : null
}

function drawFor(seed: number, locationId: string): V6Card | null {
  const pool = v6Pool(locationId)
  if (!pool.length) return null
  let hash = (seed ^ 2166136261) >>> 0
  for (const character of locationId)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const total = pool.reduce((sum, card) => sum + card.weight, 0)
  let offset = hash % total
  for (const card of pool) {
    offset -= card.weight
    if (offset < 0) return card
  }
  return null
}

// Why a route is closed right now, in words the board can show; null when the
// route is open. Costs are paid before the roll, so a route you cannot afford,
// or whose price alone would kill you, stays closed.
export function choiceLock(
  state: JourneyStateV6,
  choice: V6Choice,
): string | null {
  const gate = choice.requires?.anyFlags ?? []
  if (gate.length && !gate.some((flag) => state.flags.includes(flag)))
    return (
      'Opens only if ' +
      gate.map((flag) => DEED_FLAGS[flag] ?? flag).join(', or ') +
      '.'
    )
  const provisions = choice.cost?.provisions ?? 0
  if (state.journey.provisions + provisions < 0)
    return `Costs ${-provisions} provision${provisions === -1 ? '' : 's'}; you have ${state.journey.provisions}.`
  const hp = choice.cost?.hp ?? 0
  if (hp < 0 && state.journey.hp + hp <= 0)
    return 'You are too badly hurt to pay this price.'
  return null
}

function chooseV6(state: JourneyStateV6, choiceId: string): JourneyStateV6 {
  const land = JOURNEY_WORLD.lands[state.journey.landIndex]!
  const card = activeV6Card(state)
  const choice = card?.choices.find((item) => item.id === choiceId)
  if (
    !card ||
    !choice ||
    card.locationId !== state.journey.active ||
    state.outcomes.some((item) => item.locationId === card.locationId) ||
    choiceLock(state, choice)
  )
    return state

  const before = state.journey
  let drawRng = state.drawRng
  let roll: JourneyRoll | null = null
  if (choice.roll) {
    const [first, a] = random(drawRng)
    const [second, b] = random(first)
    drawRng = second
    const dice: [number, number] = [
      Math.floor(a * 6) + 1,
      Math.floor(b * 6) + 1,
    ]
    const modifier = BASE_SKILLS[choice.roll.skill] + choice.roll.modifier
    const total = dice[0] + dice[1] + modifier
    roll = {
      landId: land.id,
      locationId: card.locationId,
      dice,
      skill: choice.roll.skill,
      modifier,
      difficulty: choice.roll.target,
      total,
      success: total >= choice.roll.target,
    }
  }
  const success = roll ? roll.success : true
  const consequence = success ? choice.success : choice.failure
  if (!consequence) return state
  const advanced = resolveJourney(before, 'withdraw')
  if (advanced === before) return state

  const hp = clamp(before.hp + (choice.cost?.hp ?? 0) + consequence.hp_delta, 8)
  const provisions = clamp(
    before.provisions +
      (choice.cost?.provisions ?? 0) +
      consequence.provisions_delta,
    30,
  )
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
  const check = roll
    ? `${roll.dice.join(' + ')} + ${roll.modifier} = ${roll.total} vs ${roll.difficulty}. `
    : ''
  const journal: JourneyLog[] = [
    ...before.journal,
    {
      turn,
      kind: 'encounter',
      landId: land.id,
      text: `${card.title}: ${choice.label}. ${check}${consequence.text}`,
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
    const reason = card.title + ': ' + consequence.text
    const shift: JourneyShift = {
      landId: land.id,
      turn,
      causeLocationId: card.locationId,
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
  const marks = { ...state.marks }
  for (const mark of MARKS) marks[mark] += consequence.marks?.[mark] ?? 0
  return {
    ...state,
    journey: {
      ...advanced,
      rngState: before.rngState,
      layouts,
      shifts,
      journal,
      resolved,
      hp,
      provisions,
      lastRoll: roll ?? before.lastRoll,
      phase,
    },
    drawRng,
    outcomes: [
      ...state.outcomes,
      {
        locationId: card.locationId,
        encounterId: card.id,
        choiceId: choice.id,
        turn,
        roll,
        success,
        resultText: consequence.text,
        hpChange: hp - before.hp,
        provisionChange: provisions - before.provisions,
        flags: consequence.add_flags,
        marks: { ...(consequence.marks ?? {}) },
      },
    ],
    flags: [...new Set([...state.flags, ...consequence.add_flags])],
    marks,
  }
}

export function stepJourneyV6(
  state: JourneyStateV6,
  action: ActionV6,
): JourneyStateV6 {
  if (action.type === 'TRAVEL') {
    if (typeof action.locationId !== 'string') return state
    const next = stepJourney(state.journey, action)
    if (next === state.journey) return state
    if (!next.active) return { ...state, journey: next }
    if (state.drawn[next.active]) return state
    const card = drawFor(next.seed, next.active)
    if (!card) return state
    return {
      ...state,
      journey: next,
      drawn: { ...state.drawn, [next.active]: card.id },
    }
  }
  if (action.type === 'CHOOSE' && typeof action.choiceId === 'string')
    return chooseV6(state, action.choiceId)
  return state
}

// The character sheet's earned items and bonds come from the original
// authored rewards, which are all rolled base choices; certain V6 outcomes
// never forge one.
export function v6SheetSource(state: JourneyStateV6): AuthoredJourneyState {
  return {
    version: 2,
    packSha: AUTHORED_PACK.sourceSha,
    journey: state.journey,
    drawRng: state.drawRng,
    drawn: state.drawn,
    outcomes: state.outcomes
      .filter((result): result is V6Result & { roll: JourneyRoll } =>
        Boolean(result.roll),
      )
      .map(({ success: _success, marks: _marks, ...result }) => result),
    flags: state.flags,
  }
}

const CHOICE_IDS = /^[a-z0-9][a-z0-9-]*$/

// Content contract for the V6 deck: eight cards per location, three or four
// choices each, certain choices with no failure, gates only on deed flags,
// bounded costs and effects. Returns readable problems, empty when sound.
export function validateDeckV6(): string[] {
  const errors: string[] = []
  const locations: Array<{ id: string }> = JOURNEY_WORLD.lands.flatMap(
    (land) => land.locations as Array<{ id: string }>,
  )
  for (const location of locations) {
    const pool = v6Pool(location.id)
    if (pool.length !== 8)
      errors.push(`${location.id}: ${pool.length} cards, expected 8`)
  }
  const ids = new Set<string>()
  for (const card of V6_CARDS) {
    if (ids.has(card.id)) errors.push(`duplicate card id ${card.id}`)
    ids.add(card.id)
    if (!locations.some((location) => location.id === card.locationId))
      errors.push(`${card.id}: unknown location ${card.locationId}`)
    if (card.choices.length < 3 || card.choices.length > 4)
      errors.push(`${card.id}: ${card.choices.length} choices`)
    if (!Number.isInteger(card.weight) || card.weight < 1 || card.weight > 3)
      errors.push(`${card.id}: weight ${card.weight}`)
    if (card.flavor.length < 90) errors.push(`${card.id}: thin flavor`)
    if (/\bZuzu\b/.test(JSON.stringify(card)))
      errors.push(`${card.id}: names the hero`)
    if (
      !card.choices.some(
        (choice) =>
          !choice.requires && !choice.cost?.hp && !choice.cost?.provisions,
      )
    )
      errors.push(`${card.id}: every route can be locked at once`)
    const choiceIds = new Set<string>()
    for (const choice of card.choices) {
      const where = `${card.id}/${choice.id}`
      if (!CHOICE_IDS.test(choice.id) || choiceIds.has(choice.id))
        errors.push(`${where}: bad or repeated id`)
      choiceIds.add(choice.id)
      if (!choice.roll !== !choice.failure)
        errors.push(`${where}: certain choices have no failure; rolls need one`)
      if (
        choice.roll &&
        (!Object.hasOwn(BASE_SKILLS, choice.roll.skill) ||
          choice.roll.target < 6 ||
          choice.roll.target > 12 ||
          Math.abs(choice.roll.modifier) > 1)
      )
        errors.push(`${where}: bad roll`)
      for (const flag of choice.requires?.anyFlags ?? [])
        if (!Object.hasOwn(DEED_FLAGS, flag))
          errors.push(`${where}: gate on non-deed flag ${flag}`)
      if (choice.requires && !choice.requires.anyFlags.length)
        errors.push(`${where}: empty gate`)
      const cost = choice.cost ?? {}
      if ((cost.hp ?? 0) > 0 || (cost.hp ?? 0) < -2)
        errors.push(`${where}: hp cost out of range`)
      if ((cost.provisions ?? 0) > 0 || (cost.provisions ?? 0) < -3)
        errors.push(`${where}: provisions cost out of range`)
      for (const effect of [choice.success, choice.failure]) {
        if (!effect) continue
        if (
          effect.text.length < 30 ||
          Math.abs(effect.hp_delta) > 2 ||
          effect.provisions_delta < -3 ||
          effect.provisions_delta > 2 ||
          !['none', 'recorded-prospective-shift'].includes(effect.map_effect) ||
          !Array.isArray(effect.add_flags) ||
          Object.keys(effect.marks ?? {}).some(
            (mark) => !(MARKS as readonly string[]).includes(mark),
          )
        )
          errors.push(`${where}: effect out of range`)
      }
    }
  }
  return errors
}
