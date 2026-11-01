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
    id: 'college-quad',
    art: 'districts/student-commons',
    tag: 'Rival heroes · fountain cover',
  },
  {
    id: 'science-lab',
    art: 'districts/engineering-workshop',
    tag: 'Rival heroes · narrow aisles',
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
