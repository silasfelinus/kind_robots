import additions from './authoredDecksV6.json'
import castCards from './castCardsV10.json'
import personalCards from './personalCardsV10.json'
import {
  AUTHORED_PACK,
  type AuthoredChoice,
  type AuthoredEffect,
  type AuthoredJourneyState,
  type AuthoredResult,
} from './authoredJourney'
import { LATER_LAND_PACK } from './authoredFiveLands'
import { editChoices, joinBody, liveTextStore } from '../playbook/textOverlay'
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

// zuzu-shifting-lands/t-049: spent deeds. Medicine and a favor owed are
// things you carry, not things you are. A route gated on one spends it, win or
// lose, and closes again until a later outcome hands you another. `price` is
// the board's chip and `gone` the journal line written when it goes. The rule
// lives here, not in authoredDecksV6.json, so the deck fingerprint and
// schemaVersion (and every save that replays against them) stay unchanged.
export const SPENDABLE_DEEDS: Readonly<
  Record<string, { price: string; gone: string }>
> = {
  'deed-carries-medicine': {
    price: 'spends your medicine',
    gone: 'Your medicine is gone.',
  },
  'deed-owed-favor': {
    price: 'spends a favor',
    gone: 'That favor is spent.',
  },
}
// Gated routes that show a spendable deed without spending it: comparing
// herbs is a trade, and a failed one leaves your pouch where it was.
const KEEPS_DEED: ReadonlySet<string> = new Set([
  'a-cup-offered/compare-herbs-with-her',
])

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
// t-052: cast cameo cards (castCardsV10.json) are looked up by id like any
// other card, but never join the V6 draw pools; only a V10 character draw
// (castDeckV10.ts) can deal one, so V6-V9 saves replay untouched.
export const CAST_CARDS_V10 = castCards.cards as unknown as Array<
  V6Card & { cast: string[]; selfVariant?: string; variantOnly?: boolean }
>
// t-053: a premade traveler's own cards (personalCardsV10.json) are looked
// up by id the same way, and only a personal V10 draw (personalDeckV10.ts)
// ever deals one.
export const PERSONAL_CARDS_V10 = personalCards.cards as unknown as Array<
  V6Card & { owner: string }
>
const cards = new Map<string, V6Card>(
  [...V6_CARDS, ...CAST_CARDS_V10, ...PERSONAL_CARDS_V10].map((card) => [
    card.id,
    card,
  ]),
)
const pools = new Map<string, V6Card[]>()
for (const card of V6_CARDS)
  pools.set(card.locationId, [...(pools.get(card.locationId) ?? []), card])

// Playbook Manager live text (conductor weird-humboldt t-037): titles, flavor,
// choice labels and outcome text only; ids, rolls and effects stay authored.
export const SHIFTING_LANDS_LIVE_TEXT = liveTextStore()

export function v6Card(id: string): V6Card | null {
  const card = cards.get(id)
  if (!card) return null
  const edit = SHIFTING_LANDS_LIVE_TEXT.get(id)
  if (!edit) return card
  return {
    ...card,
    title: edit.title ?? card.title,
    flavor: joinBody(edit, card.flavor),
    choices: editChoices(card.choices, edit, (choice, change) => ({
      success: {
        ...choice.success,
        text: change.success ?? choice.success.text,
      },
      failure: choice.failure
        ? { ...choice.failure, text: change.failure ?? choice.failure.text }
        : choice.failure,
    })),
  }
}

export function v6Pool(locationId: string): readonly V6Card[] {
  return pools.get(locationId) ?? []
}

// The spendable deeds this route uses up when taken, success or failure.
export function choiceSpends(
  cardId: string,
  choice: Pick<V6Choice, 'id' | 'requires'>,
): string[] {
  if (KEEPS_DEED.has(`${cardId}/${choice.id}`)) return []
  return (choice.requires?.anyFlags ?? []).filter((flag) =>
    Object.hasOwn(SPENDABLE_DEEDS, flag),
  )
}

const BASE_SKILLS: Record<Skill, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}

// t-052: who is walking. V6-V9 pass nothing and keep the base table and the
// V6 draw; a V10 character supplies its own skills and an identity-aware draw.
export type JourneyRules = {
  skills?: Readonly<Record<Skill, number>>
  draw?: (seed: number, locationId: string) => V6Card | null
  // t-053: a personal V10 road reads cards through this, which adds the
  // traveler's own choices to a shared card. Without it a card is v6Card(id).
  card?: (cardId: string) => V6Card | null
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
  // t-049: the outcome count from which a spent deed closes its routes. New
  // runs start at 0. Saves written before t-049 have no field; they replay
  // under the rules they were played by and adopt the count they reached
  // (adoptSpentDeeds), so their recorded history never changes. Keep it the
  // last key: replay compares states as JSON.
  spentDeedsFrom?: number
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
    spentDeedsFrom: 0,
  }
}

// Whether you still carry a deed. Ordinary deeds are who you have been and
// never go. A spendable deed is held after the latest outcome that granted it,
// until a route spends it; every outcome counts, including those recorded
// before spent deeds applied, so an adopted save remembers what it used. A
// deed granted outside the encounter history counts as held from the start.
export function deedHeld(state: JourneyStateV6, flag: string): boolean {
  if (!state.flags.includes(flag)) return false
  if (!Object.hasOwn(SPENDABLE_DEEDS, flag)) return true
  let held = !state.outcomes.some((outcome) => outcome.flags.includes(flag))
  for (const outcome of state.outcomes) {
    const choice = cards
      .get(outcome.encounterId)
      ?.choices.find((item) => item.id === outcome.choiceId)
    if (choice && choiceSpends(outcome.encounterId, choice).includes(flag))
      held = false
    if (outcome.flags.includes(flag)) held = true
  }
  return held
}

const spentDeedsApply = (state: JourneyStateV6): boolean =>
  typeof state.spentDeedsFrom === 'number' &&
  state.outcomes.length >= state.spentDeedsFrom

// Restore support for t-049. Returns the saved count, undefined for a save
// written before spent deeds existed, or null when the value is forged out of
// range (a count past the recorded outcomes would postpone the rule).
export function spentDeedsFromSave(
  current: unknown,
): number | undefined | null {
  if (!current || typeof current !== 'object') return null
  const saved = current as { spentDeedsFrom?: unknown; outcomes?: unknown }
  if (!Object.hasOwn(saved, 'spentDeedsFrom')) return undefined
  const from = saved.spentDeedsFrom
  return typeof from === 'number' &&
    Number.isSafeInteger(from) &&
    from >= 0 &&
    Array.isArray(saved.outcomes) &&
    from <= saved.outcomes.length
    ? from
    : null
}

export function withSpentDeedsFrom(
  state: JourneyStateV6,
  from: number | undefined,
): JourneyStateV6 {
  const { spentDeedsFrom: _previous, ...rest } = state
  return from === undefined ? rest : { ...rest, spentDeedsFrom: from }
}

// A verified pre-t-049 run adopts spent deeds from its next outcome on.
export function adoptSpentDeeds(state: JourneyStateV6): JourneyStateV6 {
  return state.spentDeedsFrom === undefined
    ? { ...state, spentDeedsFrom: state.outcomes.length }
    : state
}

export function activeV6Card(
  state: JourneyStateV6,
  lookup: (cardId: string) => V6Card | null = v6Card,
): V6Card | null {
  const active = state.journey.active
  const id = active ? state.drawn[active] : null
  return id ? lookup(id) : null
}

export function locationHash(seed: number, locationId: string): number {
  let hash = (seed ^ 2166136261) >>> 0
  for (const character of locationId)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  return hash
}

export function weightedCard<T extends { weight: number }>(
  pool: readonly T[],
  hash: number,
): T | null {
  const total = pool.reduce((sum, card) => sum + card.weight, 0)
  if (!total) return null
  let offset = hash % total
  for (const card of pool) {
    offset -= card.weight
    if (offset < 0) return card
  }
  return null
}

export function drawV6Card(seed: number, locationId: string): V6Card | null {
  return weightedCard(v6Pool(locationId), locationHash(seed, locationId))
}

// Why a route is closed right now, in words the board can show; null when the
// route is open. Costs are paid before the roll, so a route you cannot afford,
// or whose price alone would kill you, stays closed.
export function choiceLock(
  state: JourneyStateV6,
  choice: V6Choice,
): string | null {
  const gate = choice.requires?.anyFlags ?? []
  const holds = spentDeedsApply(state)
    ? (flag: string) => deedHeld(state, flag)
    : (flag: string) => state.flags.includes(flag)
  if (gate.length && !gate.some(holds)) {
    const needs = gate.map((flag) => DEED_FLAGS[flag] ?? flag).join(', or ')
    return gate.some((flag) => state.flags.includes(flag))
      ? `Already spent. Opens again only if ${needs}.`
      : `Opens only if ${needs}.`
  }
  const provisions = choice.cost?.provisions ?? 0
  if (state.journey.provisions + provisions < 0)
    return `Costs ${-provisions} provision${provisions === -1 ? '' : 's'}; you have ${state.journey.provisions}.`
  const hp = choice.cost?.hp ?? 0
  if (hp < 0 && state.journey.hp + hp <= 0)
    return 'You are too badly hurt to pay this price.'
  return null
}

function chooseV6(
  state: JourneyStateV6,
  choiceId: string,
  skills: Readonly<Record<Skill, number>>,
  lookup: (cardId: string) => V6Card | null = v6Card,
): JourneyStateV6 {
  const land = JOURNEY_WORLD.lands[state.journey.landIndex]!
  const card = activeV6Card(state, lookup)
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
    const modifier = skills[choice.roll.skill] + choice.roll.modifier
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
  const spent = choiceSpends(card.id, choice)
    .filter((flag) => !consequence.add_flags.includes(flag))
    .map((flag) => ' ' + SPENDABLE_DEEDS[flag]!.gone)
    .join('')
  const journal: JourneyLog[] = [
    ...before.journal,
    {
      turn,
      kind: 'encounter',
      landId: land.id,
      text: `${card.title}: ${choice.label}. ${check}${consequence.text}${spent}`,
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
  rules: JourneyRules = {},
): JourneyStateV6 {
  if (action.type === 'TRAVEL') {
    if (typeof action.locationId !== 'string') return state
    const next = stepJourney(state.journey, action)
    if (next === state.journey) return state
    if (!next.active) return { ...state, journey: next }
    if (state.drawn[next.active]) return state
    const card = (rules.draw ?? drawV6Card)(next.seed, next.active)
    if (!card) return state
    return {
      ...state,
      journey: next,
      drawn: { ...state.drawn, [next.active]: card.id },
    }
  }
  if (action.type === 'CHOOSE' && typeof action.choiceId === 'string')
    return chooseV6(
      state,
      action.choiceId,
      rules.skills ?? BASE_SKILLS,
      rules.card,
    )
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
    errors.push(...v6CardProblems(card))
  }
  for (const key of KEEPS_DEED) {
    const [cardId, choiceId] = key.split('/')
    const choice = cards
      .get(cardId!)
      ?.choices.find((item) => item.id === choiceId)
    if (
      !choice?.requires?.anyFlags.some((flag) =>
        Object.hasOwn(SPENDABLE_DEEDS, flag),
      )
    )
      errors.push(`${key}: kept deed names no route gated on a spendable deed`)
  }
  return errors
}

// The per-card editorial and rules floor every dealt card meets, shared by the
// V6 deck and the V10 cast cameos.
export function v6CardProblems(card: V6Card): string[] {
  const errors: string[] = []
  const locations: Array<{ id: string }> = JOURNEY_WORLD.lands.flatMap(
    (land) => land.locations as Array<{ id: string }>,
  )
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
    if (
      choiceSpends(card.id, choice).length &&
      choice.requires!.anyFlags.length !== 1
    )
      errors.push(`${where}: a spending route gates on one deed only`)
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
  return errors
}
