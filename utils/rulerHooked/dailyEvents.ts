// utils/rulerHooked/dailyEvents.ts
//
// Daily kingdom events: the Town Crier's dawn proclamation (2026-11-05
// illustrated overhaul, Silas: "daily kingdom events").
//
// "Daily" means the IN-GAME day, never the wall clock. The design pillar
// (DESIGN-BRIEF.md "Time") is zero time-locked activities, so:
//   - a day is five casts (the painted cycle day -> golden -> dusk -> night ->
//     dawn in compositor.ts); the day number only moves when you fish;
//   - each day's proclamation waits until it is heard -- nothing expires, and
//     putting the game down for a month changes nothing;
//   - every proclamation is a small, one-off nudge through the same closed
//     Effect reducer the cards use. None gates a fish, card, arc or ending.
//
// Deterministic: the same seed and day always proclaim the same event.

import type { AxisKey, Effect, RunSave } from '~/types/ruler-hooked'
import { makeRng } from './seed'
import { applyEffect, cloneSave } from './applyEffects'

/** Casts per painted day -- the length of compositor.ts's CYCLE. */
export const CASTS_PER_DAY = 5

/** The counter that remembers the last day whose proclamation was heard. */
export const PROCLAMATION_COUNTER = 'proclamationDay'

export interface DailyEvent {
  key: string
  title: string
  /** What the crier shouts, in character. */
  cry: string
  /** One plain sentence on what it means for the day. */
  body: string
  effect: Effect
  /** Base draw weight. */
  weight: number
  /** Optional: weight multiplier when an axis sits low (the realm calls for it). */
  favoursLow?: AxisKey
}

export const DAILY_EVENTS: DailyEvent[] = [
  {
    key: 'market-day',
    title: 'Market Day at the Wharf',
    cry: 'Hear ye! The stalls are up and the haggling is loud!',
    body: 'Fishmongers pay a little extra for the royal catch today.',
    effect: { counters: { coins: 15 }, sliders: { prosperity: 2 } },
    weight: 3,
    favoursLow: 'prosperity',
  },
  {
    key: 'heron-festival',
    title: 'The Heron Festival',
    cry: 'Hear ye! Paper herons on every roof, and a dance at dusk!',
    body: 'The village is in a mood to celebrate.',
    effect: { sliders: { joy: 4 } },
    weight: 2,
    favoursLow: 'joy',
  },
  {
    key: 'druid-procession',
    title: 'The Druids Walk the Shore',
    cry: 'Hear ye! The druids process at dawn. Mind the moss!',
    body: 'They plant reeds where the bank has worn thin.',
    effect: { sliders: { nature: 3 } },
    weight: 2,
    favoursLow: 'nature',
  },
  {
    key: 'tax-audit',
    title: 'Gristle Audits the Ledgers',
    cry: 'Hear ye! The taxman has found a column that does not add up!',
    body: 'Coin is recovered, and the village grumbles.',
    effect: { sliders: { treasury: 4, joy: -1 } },
    weight: 2,
    favoursLow: 'treasury',
  },
  {
    key: 'guard-parade',
    title: 'The Watch Parades',
    cry: 'Hear ye! Captain Cordelia drills the watch in the square!',
    body: 'The roads feel steadier for it.',
    effect: { sliders: { order: 3 } },
    weight: 2,
    favoursLow: 'order',
  },
  {
    key: 'soft-rain',
    title: 'A Soft Rain',
    cry: 'Hear ye! It is raining, and that is the whole proclamation.',
    body: 'The lake drinks deep. The fish will not mind.',
    effect: { sliders: { nature: 2 } },
    weight: 2,
  },
  {
    key: 'bards-contest',
    title: 'The Bards Contest',
    cry: 'Hear ye! Seventeen bards, one stage, no mercy!',
    body: 'Fen insists on judging. Fen also insists on competing.',
    effect: { sliders: { joy: 3, treasury: -1 } },
    weight: 2,
  },
  {
    key: 'duck-census',
    title: 'The Annual Duck Census',
    cry: 'Hear ye! Every duck must be counted. Every duck!',
    body: 'An orderly kingdom knows its ducks.',
    effect: { sliders: { order: 1, joy: 1 } },
    weight: 1,
  },
  {
    key: 'lost-boot',
    title: 'A Boot in the Shallows',
    cry: 'Hear ye! A boot was fished from the lake. It held coins!',
    body: 'Finders keepers, by royal precedent.',
    effect: { counters: { coins: 10 } },
    weight: 1,
  },
  {
    key: 'quiet-day',
    title: 'Nothing Whatsoever',
    cry: 'Hear ye! Absolutely nothing has happened. Enjoy it.',
    body: 'A rare, perfect day for fishing.',
    effect: { sliders: { joy: 1 } },
    weight: 2,
  },
]

export function dayNumber(save: Pick<RunSave, 'turnCount'>): number {
  return Math.floor(Math.max(0, save.turnCount) / CASTS_PER_DAY) + 1
}

function weightFor(event: DailyEvent, save: RunSave): number {
  if (!event.favoursLow) return event.weight
  const value = save.kingdomHealth[event.favoursLow] ?? 50
  return value < 40 ? event.weight * 3 : event.weight
}

/** The proclamation for a given day of this reign. */
export function eventForDay(save: RunSave, day: number): DailyEvent {
  const rng = makeRng(`${save.seed}:proclamation:${day}`)
  const weights = DAILY_EVENTS.map((e) => weightFor(e, save))
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng.next() * total
  for (let i = 0; i < DAILY_EVENTS.length; i++) {
    roll -= weights[i]!
    if (roll < 0) return DAILY_EVENTS[i]!
  }
  return DAILY_EVENTS[DAILY_EVENTS.length - 1]!
}

/** Today's proclamation if it has not been heard yet, else null. */
export function pendingProclamation(
  save: RunSave | null,
): { day: number; event: DailyEvent } | null {
  if (!save || save.status !== 'ACTIVE') return null
  const day = dayNumber(save)
  const heard = save.counters[PROCLAMATION_COUNTER] ?? 0
  if (heard >= day) return null
  return { day, event: eventForDay(save, day) }
}

/** Hear today's proclamation: apply its nudge once and mark the day heard. */
export function hearProclamation(save: RunSave): RunSave {
  const pending = pendingProclamation(save)
  if (!pending) return save
  const next = cloneSave(save)
  applyEffect(next, pending.event.effect)
  next.counters[PROCLAMATION_COUNTER] = pending.day
  return next
}
