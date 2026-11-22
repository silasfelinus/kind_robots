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
import { reignTier } from './console'

/** Casts per painted day -- the length of compositor.ts's CYCLE. */
export const CASTS_PER_DAY = 5

/** The counter that remembers the last day whose proclamation was heard. */
export const PROCLAMATION_COUNTER = 'proclamationDay'
export const PROCLAMATION_EVENT_INDEX_COUNTER = 'proclamationEventIndex'
export const PROCLAMATION_FISH_BOOST = 1.5

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
  /** A small odds bonus for these species only if they are already unlocked. */
  fishBoostSlugs?: string[]
  dourCry?: string
  dourBody?: string
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
  {
    key: 'nursery-reeds',
    title: 'The Nursery Reed Parade',
    cry: 'Hear ye! The reed-keepers have planted a tiny forest below the waterline!',
    body: 'Protected shallows favor the Sunspoke Koi, if the kingdom has kept its nursery alive.',
    effect: { sliders: { nature: 2 } },
    weight: 2,
    favoursLow: 'nature',
    fishBoostSlugs: ['sunspoke-koi'],
    dourCry: 'The reed-keepers are planting again. They ask the court to stop pulling the last reeds out.',
    dourBody: 'The lake is wounded. The surviving nursery still lends the brightest koi a little shelter.',
  },
  {
    key: 'orchard-basket',
    title: "Robin and Ash's Floating Orchard",
    cry: 'Hear ye! Robin and Ash have launched a basket of windfall fruit!',
    body: 'Orchardjaw Perch linger nearer the bank when their orchard survives.',
    effect: { sliders: { joy: 2, nature: 1 } },
    weight: 2,
    fishBoostSlugs: ['orchardjaw-perch'],
    dourCry: 'Robin and Ash have brought bruised fruit to the shore. They had no harvest worth selling.',
  },
  {
    key: 'bridge-watch',
    title: 'A Bridge Made of Promises',
    cry: 'Hear ye! The bridge crew has replaced three boards and an entire argument!',
    body: 'The Bridgeback Sturgeon investigates the racket whenever it can reach the crossing.',
    effect: { sliders: { order: 1, prosperity: 2 } },
    weight: 2,
    fishBoostSlugs: ['bridgeback-sturgeon'],
  },
  {
    key: 'quill-correction',
    title: 'A Correction from Quill',
    cry: "Hear ye! Yesterday's decree said fishing was forbidden. It meant fidgeting!",
    body: "Quill's correction puts an anxious village at ease.",
    effect: { sliders: { joy: 2, order: 1 } },
    weight: 2,
    dourCry: "Quill has corrected the decree from 'ration' to 'reason.' Neither seems plentiful.",
  },
  {
    key: 'fen-seventeen-encores',
    title: "Fen's Seventeenth Encore",
    cry: "Hear ye! Fen has finished the farewell tour and announced the farewell tour's second act!",
    body: 'The tavern is crowded, and the treasury pays for one last round.',
    effect: { sliders: { joy: 3, treasury: -1 } },
    weight: 2,
    favoursLow: 'joy',
    dourCry: 'Fen is singing to the empty chairs. The chairs have asked for another song.',
  },
  {
    key: 'mossy-moon',
    title: "Mossy's Moonwater",
    cry: 'Hear ye! Mossy has bottled moonlight and accidentally watered the turnips!',
    body: 'The druids approve of the growth, though nobody can explain the violet leaves.',
    effect: { sliders: { nature: 3 } },
    weight: 2,
    favoursLow: 'nature',
    dourCry: 'Mossy asks that the wells be left alone tonight. Something in them has started answering.',
  },
  {
    key: 'cordelia-lanterns',
    title: "Cordelia's Lantern Drill",
    cry: 'Hear ye! Captain Cordelia has taught the watch to signal without shouting!',
    body: 'A calmer patrol keeps the alleys safe without another curfew.',
    effect: { sliders: { order: 2, joy: 1 } },
    weight: 2,
    favoursLow: 'order',
    dourCry: 'Cordelia has doubled the lantern watch. A dark street should not be a sentence.',
  },
  {
    key: 'gristle-abacus',
    title: "Gristle's Emergency Abacus",
    cry: 'Hear ye! Gristle has found six missing coins in the royal abacus!',
    body: 'The audit closes without another levy.',
    effect: { sliders: { treasury: 3, joy: 1 } },
    weight: 2,
    favoursLow: 'treasury',
    dourCry: 'Gristle has counted the empty vault twice. The sums remain disagreeable.',
  },
  {
    key: 'vex-millwheel',
    title: "Vex's Very Efficient Wheel",
    cry: 'Hear ye! Vex promises the new wheel turns with no water, only optimism!',
    body: 'Merchants cheer the prototype; the reeds are less enthusiastic.',
    effect: { sliders: { prosperity: 3, nature: -1 } },
    weight: 2,
    favoursLow: 'prosperity',
    dourCry: "Vex's millwheel has stopped. She calls the stillness a bold demonstration.",
  },
  {
    key: 'bakers-truce',
    title: "The Bakers' Flour Truce",
    cry: 'Hear ye! The bakers have agreed not to duel with rolling pins before noon!',
    body: 'Fresh bread feeds the market, and the square smells kinder.',
    effect: { sliders: { prosperity: 2, joy: 2 } },
    weight: 2,
    favoursLow: 'joy',
    dourCry: 'The bakers have divided their last sack of flour. Nobody took the larger half.',
  },
  {
    key: 'ink-delivery',
    title: 'The Royal Ink Shipment',
    cry: 'Hear ye! Quill has received blue ink, red ink and a suspiciously talkative jar of green!',
    body: 'The court can answer petitions with something more legible than mud.',
    effect: { sliders: { order: 1, joy: 1 } },
    weight: 1,
    dourCry: 'Quill is watering down the ink. The petitions are multiplying faster than the words.',
  },
  {
    key: 'crown-gone-missing',
    title: 'The Missing Crown',
    cry: 'Hear ye! The crown was found in the biscuit tin. No charges will be filed!',
    body: 'The court laughs, but a fresh lock has been bought for the treasury.',
    effect: { sliders: { joy: 2, treasury: -1 } },
    weight: 1,
    dourCry: 'The crown was found in the biscuit tin. Nobody had the heart to ask why.',
  },
  {
    key: 'mooring-rations',
    title: 'Biscuit Crumbs at the Mooring',
    cry: 'Hear ye! The boatmen have been feeding the Mooring Mullet their biscuit crumbs!',
    body: 'Mooring Mullet gather near the boats, if a sheltered marina exists.',
    effect: { sliders: { prosperity: 1 } },
    weight: 2,
    fishBoostSlugs: ['mooring-mullet'],
    dourCry: 'The boats are tied up. Even the Mooring Mullet are waiting for scraps.',
  },
  {
    key: 'border-bells',
    title: 'The Bell Beneath the Ferry',
    cry: 'Hear ye! The ferryman reports bells under the hull, though there is no bell aboard!',
    body: 'Tollbell Sturgeon investigate the crossing when the kingdom has earned their presence.',
    effect: { sliders: { order: 2 } },
    weight: 2,
    fishBoostSlugs: ['tollbell-sturgeon'],
  },
  {
    key: 'lamplighter',
    title: 'A Light in the Fog',
    cry: 'Hear ye! The lamplighter has seen a second lantern moving under the water!',
    body: 'Lamplight Anglers are drawn closer where the lake has become their kind of home.',
    effect: { sliders: { order: 1 } },
    weight: 2,
    fishBoostSlugs: ['lamplight-angler'],
    dourCry: 'The lamplighter counts two lights below the surface. He has only one lantern.',
  },
  {
    key: 'rainbow-bunting',
    title: 'Bunting for Every Weather',
    cry: "Hear ye! A rainbow of bunting has survived rain, hail and Fen's rehearsal!",
    body: 'The villagers keep their colors, even when the season refuses to cooperate.',
    effect: { sliders: { joy: 3 } },
    weight: 2,
    favoursLow: 'joy',
    dourCry: 'The bunting is patched from old curtains. The village puts it up anyway.',
  },
  {
    key: 'dry-bank',
    title: 'The Exposed Lakebed',
    cry: 'Hear ye! The waterline has moved, and the ducks demand an inquiry!',
    body: 'The court orders a modest shoreline repair before the bank dries further.',
    effect: { sliders: { nature: 2, treasury: -1 } },
    weight: 2,
    favoursLow: 'nature',
    dourCry: 'The dry bank has exposed old anchors and older bones. The ducks have stopped complaining.',
  },
  {
    key: 'ferry-rest',
    title: 'An Hour Without a Bell',
    cry: 'Hear ye! The ferry crew has taken its first proper rest in a fortnight!',
    body: 'A rested crew brings the bank back into good temper.',
    effect: { sliders: { joy: 2, order: 1 } },
    weight: 2,
    dourCry: 'The ferry is quiet today. Half the crew is sleeping; the other half is mending it.',
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

/** A bad reign changes what the crier can honestly announce, not the event's effect. */
function spokenInReign(event: DailyEvent, save: RunSave): DailyEvent {
  const tier = reignTier(save.kingdomHealth)
  if (tier === 'pristine') return event
  const announcement = event.cry.replace(/^Hear ye!\s*/, '')
  if (tier === 'strained') return { ...event, cry: `Hear this, if you please! ${announcement}` }
  return {
    ...event,
    cry: event.dourCry ?? `By order of the crumbling crown: ${announcement}`,
    body: event.dourBody ?? event.body,
  }
}

/** Only boosts an already eligible species, while today's heard crier is active. */
export function fishWeightForProclamation(
  save: RunSave,
  fishSlug: string,
  baseWeight: number,
): number {
  if (save.counters[PROCLAMATION_COUNTER] !== dayNumber(save)) return baseWeight
  const index = save.counters[PROCLAMATION_EVENT_INDEX_COUNTER]
  if (index === undefined || !Number.isInteger(index)) return baseWeight
  const event = DAILY_EVENTS[index]
  return event?.fishBoostSlugs?.includes(fishSlug)
    ? baseWeight * PROCLAMATION_FISH_BOOST
    : baseWeight
}

/** The proclamation for a given day of this reign. */
export function eventForDay(save: RunSave, day: number): DailyEvent {
  const rng = makeRng(`${save.seed}:proclamation:${day}`)
  const weights = DAILY_EVENTS.map((e) => weightFor(e, save))
  const total = weights.reduce((a, b) => a + b, 0)
  let roll = rng.next() * total
  for (let i = 0; i < DAILY_EVENTS.length; i++) {
    roll -= weights[i]!
    if (roll < 0) return spokenInReign(DAILY_EVENTS[i]!, save)
  }
  return spokenInReign(DAILY_EVENTS[DAILY_EVENTS.length - 1]!, save)
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
  next.counters[PROCLAMATION_EVENT_INDEX_COUNTER] = DAILY_EVENTS.findIndex(
    (event) => event.key === pending.event.key,
  )
  return next
}
