// Front menu, settings and scrapbook for Every Villain Tactics. These are pure
// helpers; the store owns browser storage. A scrapbook moment unlocks only from
// a trigger id that a validated save actually fired, so nothing here can award
// progress the player did not earn. Scoring and achievements belong to t-019.
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import type { Perspective } from './firstBellStory'
import { mergeBattleResults, type BattleResult } from './scores'
import { PICNIC_TRIGGERS } from './picnicPanic'
import type { EvtSave } from './saves'
import { STAGE_PRESETS, type StageDraft } from './studio'
import { KNOWN_TRIGGERS } from './training'

export const PLAYABLE_PERSPECTIVES: readonly Perspective[] = ['hero', 'villain']

export type AnimationSpeed = 'off' | 'fast' | 'normal' | 'slow'
export type EvtSettings = {
  version: 1
  animation: AnimationSpeed
  /** End Turn needs a second press, so a stray tap never forfeits AP. */
  confirmEndTurn: boolean
  /** Mark reachable tiles that living rival shooters can see. */
  threatPreview: boolean
}
export const ANIMATION_SPEEDS: ReadonlyArray<{
  id: AnimationSpeed
  label: string
  scale: number
}> = [
  { id: 'off', label: 'Off', scale: 0 },
  { id: 'fast', label: 'Fast', scale: 0.5 },
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'slow', label: 'Cinematic', scale: 1.75 },
]
export const DEFAULT_SETTINGS: Readonly<EvtSettings> = {
  version: 1,
  animation: 'normal',
  confirmEndTurn: true,
  threatPreview: true,
}
export const evtSettingsKey = 'kr-every-villain-tactics:settings'
export const evtScrapbookKey = 'kr-every-villain-tactics:scrapbook'

export const animationScale = (speed: AnimationSpeed) =>
  ANIMATION_SPEEDS.find((entry) => entry.id === speed)?.scale ?? 1

/** Keeps every valid field and falls back per field. Never throws. */
export function sanitizeSettings(raw: unknown): EvtSettings {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }
  }
  const record =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}
  return {
    version: 1,
    animation: ANIMATION_SPEEDS.some((s) => s.id === record.animation)
      ? (record.animation as AnimationSpeed)
      : DEFAULT_SETTINGS.animation,
    confirmEndTurn:
      typeof record.confirmEndTurn === 'boolean'
        ? record.confirmEndTurn
        : DEFAULT_SETTINGS.confirmEndTurn,
    threatPreview:
      typeof record.threatPreview === 'boolean'
        ? record.threatPreview
        : DEFAULT_SETTINGS.threatPreview,
  }
}

export type ScrapbookMoment = {
  /** The trigger id a save records when this moment happens. */
  id: string
  mode: 'story' | 'oneshot'
  chapter: string
  title: string
  caption: string
  art: string
}
/** One page per trigger a save can record; 'seen:' bookkeeping ids excluded. */
export const SCRAPBOOK_MOMENTS: readonly ScrapbookMoment[] = [
  {
    id: 'story:arrival',
    mode: 'story',
    chapter: 'First Bell',
    title: 'The doors are locked from the inside',
    caption:
      'You chose how to reach the sealed auditorium: the catwalk or the service corridor.',
    art: 'encounters/the-fire-drill-that-wasnt',
  },
  {
    id: 'story:alarm',
    mode: 'story',
    chapter: 'First Bell',
    title: 'A second bell, a second emergency',
    caption:
      'Mid-fight, a cry behind the wall forced a choice between rescue and evidence.',
    art: 'incidents/skybridge',
  },
  {
    id: 'fire-alarm',
    mode: 'story',
    chapter: 'First Bell',
    title: 'The fire alarm on round three',
    caption:
      'The gym alarm cut through the battle and announced a second rescue call.',
    art: 'front/tutorial',
  },
  {
    id: 'story:reckoning',
    mode: 'story',
    chapter: 'First Bell',
    title: 'The first enemy is down',
    caption: 'A rival fell, and you decided whether to show mercy or press on.',
    art: 'encounters/a-promise-on-the-roof',
  },
  {
    id: 'story:victory',
    mode: 'story',
    chapter: 'First Bell',
    title: 'The auditorium opens',
    caption:
      'The battle ended in your favour and the sealed doors finally gave.',
    art: 'endings/the-rescue-that-counted',
  },
  {
    id: 'story:defeat',
    mode: 'story',
    chapter: 'First Bell',
    title: 'The doors do not open',
    caption:
      'The patrol held. The story kept going, but not the way you planned.',
    art: 'endings/the-broken-grid',
  },
  {
    id: 'picnic:opening',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Picnic Panic',
    caption:
      'Foreman Thumpkin declared the plaza lawn a tunnel right-of-way at noon.',
    art: 'districts/waterfront-market',
  },
  {
    id: 'picnic:first-emergence',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Dust and Diamond Teeth',
    caption: 'The first Warren Wrecker burst out of its announced dust ring.',
    art: 'incidents/garden',
  },
  {
    id: 'picnic:civilian-lost',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'A Blanket Folds Into the Ground',
    caption: 'A family waiting beside a dust ring was pulled into the tunnels.',
    art: 'incidents/flood',
  },
  {
    id: 'picnic:all-rescued',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Everyone Behind the Bandstand',
    caption: 'Every picnicker was walked clear before the lawn gave way.',
    art: 'incidents/broadcast',
  },
  {
    id: 'picnic:shift-change',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Second Shift Reports to the Lawn',
    caption:
      'Thumpkin whistled up a second shift, and the molehills arrived a round ahead of the bunnies.',
    art: 'incidents/garden',
  },
  {
    id: 'picnic:overtime',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Time and a Half',
    caption: 'The overtime shift tunneled in on schedule, cones and all.',
    art: 'districts/waterfront-market',
  },
  {
    id: 'picnic:victory',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Leftovers for Everyone',
    caption: 'The plaza was secured and the picnic went on.',
    art: 'endings/honors-in-the-prom-simulation',
  },
  {
    id: 'picnic:defeat',
    mode: 'oneshot',
    chapter: 'Picnic Panic',
    title: 'Tunnels Under Every Blanket',
    caption: 'The Warren Wreckers took the lawn this time.',
    art: 'endings/the-price-of-a-single-switch',
  },
]
/** Trigger ids that unlock a scrapbook page. */
export const SCRAPBOOK_TRIGGERS: readonly string[] = [
  ...KNOWN_TRIGGERS,
  ...PICNIC_TRIGGERS,
]

export type ScrapbookRecord = {
  id: string
  /** When the save that first carried this trigger was written. */
  at: string
  lead: string
  perspective: Perspective
  stage: string
}
export type Scrapbook = {
  version: 1
  records: ScrapbookRecord[]
  results: BattleResult[]
}
const PERSPECTIVES: readonly Perspective[] = [
  'hero',
  'villain',
  'henchman',
  'sidekick',
]
export const emptyScrapbook = (): Scrapbook => ({
  version: 1,
  records: [],
  results: [],
})

function validRecord(value: unknown): value is ScrapbookRecord {
  const r = value as ScrapbookRecord
  return (
    !!r &&
    typeof r === 'object' &&
    SCRAPBOOK_MOMENTS.some((m) => m.id === r.id) &&
    typeof r.at === 'string' &&
    !Number.isNaN(Date.parse(r.at)) &&
    IDENTITY_ARCS.some((arc) => arc.signature === r.lead) &&
    PERSPECTIVES.includes(r.perspective) &&
    typeof r.stage === 'string' &&
    r.stage.length > 0 &&
    r.stage.length <= 80
  )
}
/** Drops unknown or malformed pages and keeps the first record per moment. */
export function sanitizeScrapbook(raw: unknown): Scrapbook {
  let data: unknown = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return emptyScrapbook()
    }
  }
  const records = (data as Scrapbook | null)?.records
  if (!Array.isArray(records)) return emptyScrapbook()
  return {
    ...mergeScrapbook(emptyScrapbook(), records.filter(validRecord)),
    results: mergeBattleResults(
      [],
      Array.isArray((data as Scrapbook).results)
        ? (data as Scrapbook).results
        : [],
    ),
  }
}

/** Scrapbook pages a validated save has earned. */
export function momentsFromSave(save: EvtSave): ScrapbookRecord[] {
  return (save.state.fired ?? [])
    .filter((id) => SCRAPBOOK_MOMENTS.some((m) => m.id === id))
    .map((id) => ({
      id,
      at: save.savedAt,
      lead: save.leadSignature,
      perspective: save.perspective,
      stage: save.stage?.title ?? 'First Bell',
    }))
}

/** Adds only moments not yet in the book; the earliest witness is kept. */
export function mergeScrapbook(
  book: Scrapbook,
  incoming: readonly ScrapbookRecord[],
): Scrapbook {
  const byId = new Map(book.records.map((r) => [r.id, r]))
  for (const record of incoming) {
    const known = byId.get(record.id)
    if (!known || Date.parse(record.at) < Date.parse(known.at))
      byId.set(record.id, { ...record })
  }
  return {
    version: 1,
    results: book.results,
    records: SCRAPBOOK_MOMENTS.map((m) => byId.get(m.id)).filter(
      (r): r is ScrapbookRecord => !!r,
    ),
  }
}

export type ScrapbookPage = ScrapbookMoment & {
  record: ScrapbookRecord | null
  leadAlias: string | null
}
export function scrapbookPages(book: Scrapbook): ScrapbookPage[] {
  return SCRAPBOOK_MOMENTS.map((moment) => {
    const record = book.records.find((r) => r.id === moment.id) ?? null
    return {
      ...moment,
      record,
      leadAlias: record
        ? (IDENTITY_ARCS.find((arc) => arc.signature === record.lead)?.hero
            .alias ?? null)
        : null,
    }
  })
}

/** Every signature-locked origin battle must stay inaccessible to other leads.
 * The tactical store also enforces this guard, not only the visual menu. */
export const ORIGIN_STAGE_LEADS: Readonly<Record<string, string>> = {
  'last-order': 'accident-fire',
  'ferris-wheel': 'accident-air',
  'sunken-street': 'accident-earth',
  'unlicensed-rescue': 'accident-birthright',
  'song-that-stopped': 'accident-social',
  'hydrant-blue': 'accident-water',
  'clocktower-collapse': 'accident-discipline',
  'equation-that-escaped': 'accident-genius',
  'candle-that-wouldnt-die': 'magic-fire',
  'orchard-under-asphalt': 'magic-earth',
  'future-in-the-glass': 'magic-water',
  'overdue-thunder': 'magic-air',
  'bell-and-the-door': 'magic-discipline',
  'when-two-plus-two-screamed': 'magic-genius',
  'heir-who-said-no': 'magic-birthright',
  'empty-applause': 'magic-social',
  'ashes-of-the-ledger': 'mutant-fire',
  'balcony-witness': 'mutant-air',
  'bridge-of-last-chances': 'mutant-earth',
  'ship-with-no-port': 'mutant-water',
  'four-hands-and-a-promise': 'mutant-discipline',
  'probability-of-panic': 'mutant-genius',
  'keys-to-the-shelter': 'mutant-birthright',
  'friend-nobody-remembers': 'mutant-social',
  'furnace-lift': 'tech-fire',
  'last-skyway': 'tech-air',
  'foundation-day': 'tech-earth',
  'flooded-platform': 'tech-water',
  'parade-that-couldnt-stop': 'tech-discipline',
  'grandmas-password': 'tech-genius',
  'museum-of-tomorrow': 'tech-birthright',
  'edited-rescue': 'tech-social',
  'refuge-in-orbit': 'alien-fire',
  'treaty-in-the-clouds': 'alien-air',
  'museum-that-moved': 'alien-earth',
  'song-for-the-drowned': 'alien-water',
  'orders-from-home': 'alien-discipline',
  'small-future': 'alien-genius',
  'missing-coronation': 'alien-birthright',
  'everyone-inside': 'alien-social',
  'match-under-the-bed': 'psychic-fire',
  'elevator-that-floated': 'psychic-air',
  'stone-that-testified': 'psychic-earth',
  'letter-no-one-sent': 'psychic-water',
  'book-that-walked-away': 'psychic-discipline',
  'thought-that-wasnt-yours': 'psychic-genius',
  'prophecy-auction': 'psychic-birthright',
  'rumor-after-midnight': 'psychic-social',
}
export const canStartOneShot = (stageId: string, lead: string): boolean =>
  !ORIGIN_STAGE_LEADS[stageId] || ORIGIN_STAGE_LEADS[stageId] === lead

/** Replayable one-shot battles offered from the front menu, in menu order. */
export const ONE_SHOT_MENU: ReadonlyArray<{
  id: string
  art: string
  tag: string
}> = [
  {
    id: 'picnic-plaza',
    art: 'districts/waterfront-market',
    tag: 'Civilian rescue · burrowing bunny men',
  },
  {
    id: 'ferris-wheel',
    art: 'districts/waterfront-market',
    tag: 'Skyline origin · stabilize gondolas and rescue two passengers',
  },
  {
    id: 'sunken-street',
    art: 'incidents/skybridge',
    tag: 'Cornerstone origin · stabilize a sinkhole and rescue bus passengers',
  },
  {
    id: 'unlicensed-rescue',
    art: 'districts/student-commons',
    tag: 'Valcourt origin · shield a volunteer, then evacuate the library',
  },
  {
    id: 'song-that-stopped',
    art: 'districts/media-spire',
    tag: 'Chorus origin · break the radio loop, evacuate two groups',
  },
  {
    id: 'hydrant-blue',
    art: 'districts/industrial-foundry',
    tag: 'Tidewarden origin · restore the main and rescue both crews',
  },
  {
    id: 'clocktower-collapse',
    art: 'districts/student-commons',
    tag: 'The Second Hand origin · catch the lift on an even round',
  },
  {
    id: 'equation-that-escaped',
    art: 'districts/engineering-workshop',
    tag: 'Eureka origin · rewrite the faulty drone from a clear sightline',
  },
  {
    id: 'candle-that-wouldnt-die',
    art: 'districts/student-commons',
    tag: 'Lanternwitch origin · bind the candle and rescue two mourners',
  },
  {
    id: 'orchard-under-asphalt',
    art: 'districts/botanical-conservatory',
    tag: 'Granny Mayhem origin · stitch a shelter arch and rescue gardeners',
  },
  {
    id: 'future-in-the-glass',
    art: 'districts/botanical-conservatory',
    tag: 'Reflection origin · reframe the vision and evacuate the rooftop',
  },
  {
    id: 'overdue-thunder',
    art: 'districts/student-commons',
    tag: 'The Weathervane origin · fold the storm and rescue both readers',
  },
  {
    id: 'bell-and-the-door',
    art: 'districts/student-commons',
    tag: 'The Abbess origin · break the obedience ward and evacuate two people',
  },
  {
    id: 'when-two-plus-two-screamed',
    art: 'districts/engineering-workshop',
    tag: 'Theorem origin · complete the bridge and evacuate two students',
  },
  {
    id: 'heir-who-said-no',
    art: 'districts/botanical-conservatory',
    tag: 'The Hearthwitch origin · unbind the household pact and rescue two witnesses',
  },
  {
    id: 'empty-applause',
    art: 'districts/student-commons',
    tag: 'Curtain Call origin · rewrite the monologue and free two performers',
  },
  {
    id: 'ashes-of-the-ledger',
    art: 'districts/student-commons',
    tag: 'Ashborn origin · Cut a safe escape hole through the reinforced door without igniting the charts',
  },
  {
    id: 'balcony-witness',
    art: 'districts/botanical-conservatory',
    tag: 'Kestrel origin · Redirect the flock through the high windows to shield the witness',
  },
  {
    id: 'bridge-of-last-chances',
    art: 'incidents/skybridge',
    tag: "Groundswell origin · Reinforce the failing span with living stone at the bridge's center",
  },
  {
    id: 'ship-with-no-port',
    art: 'districts/waterfront-market',
    tag: 'Harbormaster origin · Shape a temporary seawall beside the ferry channel',
  },
  {
    id: 'four-hands-and-a-promise',
    art: 'districts/student-commons',
    tag: "Lotus Guard origin · Stabilize the rig's ropes beside the failed anchor with four hands",
  },
  {
    id: 'probability-of-panic',
    art: 'districts/engineering-workshop',
    tag: 'Contingency origin · Identify the keystone fault from a clear sightline and interrupt the chain reaction',
  },
  {
    id: 'keys-to-the-shelter',
    art: 'districts/student-commons',
    tag: 'The Guardian origin · Raise the ancestral shelter ward at the sealed doorway',
  },
  {
    id: 'friend-nobody-remembers',
    art: 'districts/student-commons',
    tag: 'Common Ground origin · Retrace the trustworthy relationship at the council table without removing the blocking patch',
  },
  {
    id: 'furnace-lift',
    art: 'districts/industrial-foundry',
    tag: 'Torchlight origin · Weld the support bridge without overheating it',
  },
  {
    id: 'last-skyway',
    art: 'incidents/skybridge',
    tag: 'Tailwind origin · Rewrite the drone flight plan to establish a safe air corridor',
  },
  {
    id: 'foundation-day',
    art: 'districts/student-commons',
    tag: "Rebar origin · Deploy portable braces at the building's remaining exit",
  },
  {
    id: 'flooded-platform',
    art: 'districts/industrial-foundry',
    tag: 'Lifeline origin · Tow the train car toward the evacuation ledge with the pressure suit',
  },
  {
    id: 'parade-that-couldnt-stop',
    art: 'incidents/skybridge',
    tag: 'Hurdler origin · Synchronize a nonviolent formation break beside the signal relay',
  },
  {
    id: 'grandmas-password',
    art: 'districts/student-commons',
    tag: 'Dr. Frog origin · Override the door controller with the recipe-memory sequence without wiping the kitchen AI',
  },
  {
    id: 'museum-of-tomorrow',
    art: 'districts/labor-museum',
    tag: 'Sterling origin · Brace the scholarship elevator with prototype armor',
  },
  {
    id: 'edited-rescue',
    art: 'districts/media-spire',
    tag: 'Witness origin · Trace the missing camera angle from the public livestream console',
  },
  {
    id: 'refuge-in-orbit',
    art: 'districts/industrial-foundry',
    tag: 'Daystar origin · Shape a solar shield around the failing sail without burning the hull',
  },
  {
    id: 'treaty-in-the-clouds',
    art: 'incidents/skybridge',
    tag: 'The Envoy origin · Translate the pressure-wave treaty at the floating relay',
  },
  {
    id: 'museum-that-moved',
    art: 'districts/labor-museum',
    tag: 'Monolith origin · Read the mineral memories and raise an escape passage at the plinth',
  },
  {
    id: 'song-for-the-drowned',
    art: 'districts/waterfront-market',
    tag: "Lighthouse origin · Redirect the tide using controlled harmony at the pontoon's acoustic beacon",
  },
  {
    id: 'orders-from-home',
    art: 'districts/student-commons',
    tag: "Zuzu origin · Sever the command relay's capture net without touching the captives",
  },
  {
    id: 'small-future',
    art: 'districts/engineering-workshop',
    tag: 'Uplift origin · Recalibrate the confiscation device from the diagnostic terminal',
  },
  {
    id: 'missing-coronation',
    art: 'districts/student-commons',
    tag: 'The Exile origin · Open the royal gateway without binding anyone to the crown',
  },
  {
    id: 'everyone-inside',
    art: 'districts/student-commons',
    tag: 'Assembly origin · Offer a reversible empathic link at the counseling table, with an explicit opt-out',
  },
  {
    id: 'match-under-the-bed',
    art: 'districts/student-commons',
    tag: "Firekeeper origin · Draw the nightmare's cold flame into a harmless signal flare",
  },
  {
    id: 'elevator-that-floated',
    art: 'districts/industrial-foundry',
    tag: 'Weightless origin · Lower the drifting elevator to a stable landing with controlled telekinesis',
  },
  {
    id: 'stone-that-testified',
    art: 'districts/labor-museum',
    tag: 'Groundtruth origin · Touch the speaking paving stone and separate remembered evidence from suggestion',
  },
  {
    id: 'letter-no-one-sent',
    art: 'districts/waterfront-market',
    tag: "Calm Waters origin · Redirect the psychic flood at the memorial rail without taking away anyone's grief",
  },
  {
    id: 'book-that-walked-away',
    art: 'districts/student-commons',
    tag: 'The Librarian origin · Step through the security blind spot and catch the displaced book at the gate',
  },
  {
    id: 'thought-that-wasnt-yours',
    art: 'districts/media-spire',
    tag: 'Mindsight origin · Separate implanted suggestions from authentic thoughts at the debate relay',
  },
  {
    id: 'prophecy-auction',
    art: 'districts/student-commons',
    tag: 'Second Sight origin · Read several possible futures at the projection dais and mark a safe exit',
  },
  {
    id: 'rumor-after-midnight',
    art: 'districts/media-spire',
    tag: 'The Confidante origin · Trace the forged rumor to its first harmed person at the editorial desk',
  },
  {
    id: 'college-quad',
    art: 'districts/student-commons',
    tag: 'Rival heroes · fountain cover',
  },
  {
    id: 'science-lab',
    art: 'districts/engineering-workshop',
    tag: 'Story encounter · eight-round lockdown, branching choice',
  },
  {
    id: 'crosswalk-crisis',
    art: 'incidents/skybridge',
    tag: 'Evacuate three civilians · timed crossing and reinforcements',
  },
  {
    id: 'rooftop-broadcast',
    art: 'incidents/broadcast',
    tag: 'Rooftop transmitter · elevation, catwalk collapse and reinforcements',
  },
  {
    id: 'under-comet-breach',
    art: 'districts/industrial-foundry',
    tag: 'Containment tunnels · split squad, coolant, timed seal-keeper',
  },
  {
    id: 'prom-night-finale',
    art: 'districts/student-commons',
    tag: 'Grand ballroom · three faction waves, collapsing dance floor, six-round siege',
  },
  {
    id: 'quad-portal-watch',
    art: 'encounters/a-visitor-from-the-stars',
    tag: 'Teleporting Wombat Ronin',
  },
  {
    id: 'lab-mascot-recall',
    art: 'districts/neon-arcade',
    tag: 'Wind-up Licensed Legends',
  },
  {
    id: 'boiler-room',
    art: 'districts/industrial-foundry',
    tag: 'Survive · fire, live water, weak floors',
  },
  {
    id: 'fountain-hold',
    art: 'districts/botanical-conservatory',
    tag: 'Hold the zone · reinforcement wave',
  },
  {
    id: 'quarry-lieutenant',
    art: 'districts/labor-museum',
    tag: 'Four-HP lieutenant boss',
  },
]
export function oneShotStages(): Array<
  StageDraft & { art: string; tag: string }
> {
  return ONE_SHOT_MENU.flatMap((entry) => {
    const stage = STAGE_PRESETS.find((s) => s.id === entry.id)
    return stage ? [{ ...stage, art: entry.art, tag: entry.tag }] : []
  })
}

/** Story viewpoints shown on the New Story screen, each with outcome art. */
export const PERSPECTIVE_ART: Readonly<Record<Perspective, string>> = {
  hero: 'hero',
  villain: 'villain',
  henchman: 'betrayal',
  sidekick: 'partner',
}
