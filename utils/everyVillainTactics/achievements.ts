// Every Villain Tactics achievements, judged from the scrapbook. A save only
// adds pages and results the battle really produced, so when a live save grows
// the book, everything the book now proves is awarded (already-earned codes are
// skipped by the achievement store). Loading a slot never awards.
import { SCRAPBOOK_MOMENTS, ONE_SHOT_MENU, type Scrapbook } from './frontMenu'
import type { EvtSave } from './saves'
import { STAGE_PRESETS } from './studio'

export const EVT_ACHIEVEMENT_CODES = {
  firstBellCleared: 'every-villain-tactics-first-bell-cleared',
  firstBellLost: 'every-villain-tactics-first-bell-lost',
  mercy: 'every-villain-tactics-mercy',
  rescueCall: 'every-villain-tactics-rescue-call',
  everySide: 'every-villain-tactics-every-side',
  rivalFoil: 'every-villain-tactics-rival-foil',
  untouched: 'every-villain-tactics-untouched',
  noKnockouts: 'every-villain-tactics-no-knockouts',
  everyCivilian: 'every-villain-tactics-every-civilian',
  quickClear: 'every-villain-tactics-quick-clear',
  evidence: 'every-villain-tactics-evidence',
  picnicRescued: 'every-villain-tactics-picnic-rescued',
  overtime: 'every-villain-tactics-overtime',
  picnicWon: 'every-villain-tactics-picnic-won',
  oneShotSweep: 'every-villain-tactics-one-shot-sweep',
  stageArchitect: 'every-villain-tactics-stage-architect',
  scrapbookFull: 'every-villain-tactics-scrapbook-full',
} as const

export type EvtAchievementCode =
  (typeof EVT_ACHIEVEMENT_CODES)[keyof typeof EVT_ACHIEVEMENT_CODES]

const C = EVT_ACHIEVEMENT_CODES

const MOMENT_CODES: ReadonlyArray<[string, EvtAchievementCode]> = [
  ['story:victory', C.firstBellCleared],
  ['story:defeat', C.firstBellLost],
  ['picnic:all-rescued', C.picnicRescued],
  ['picnic:overtime', C.overtime],
  ['picnic:victory', C.picnicWon],
]

const MEDAL_CODES: ReadonlyArray<[string, EvtAchievementCode]> = [
  ['untouched', C.untouched],
  ['no-knockouts', C.noKnockouts],
  ['every-civilian', C.everyCivilian],
  ['quick-clear', C.quickClear],
  ['evidence-recovered', C.evidence],
]

const STORY_SIDES = ['hero', 'villain', 'henchman', 'sidekick'] as const

const ONE_SHOT_TITLES = ONE_SHOT_MENU.map(
  (entry) => STAGE_PRESETS.find((stage) => stage.id === entry.id)?.title,
).filter((title): title is string => !!title)

/** Every achievement a scrapbook and the player's own saves prove. */
export function achievementsProven(
  book: Scrapbook,
  saves: readonly EvtSave[],
): EvtAchievementCode[] {
  const witnessed = new Set(book.records.map((record) => record.id))
  const wins = book.results.filter((result) => result.outcome === 'victory')
  const medals = new Set(book.results.flatMap((result) => result.medals))
  const storySides = new Set(
    wins.filter((r) => r.mode === 'story').map((r) => r.perspective),
  )
  const oneShotWins = new Set(
    wins.filter((r) => r.mode === 'oneshot').map((r) => r.stage),
  )
  const decisions = saves
    .filter((save) => save.mode === 'story')
    .map((save) => ({
      completed: save.story.completed,
      made: new Set<string>(save.story.decisions),
    }))
  const earned = new Set<EvtAchievementCode>()
  for (const [moment, code] of MOMENT_CODES)
    if (witnessed.has(moment)) earned.add(code)
  for (const [medal, code] of MEDAL_CODES)
    if (medals.has(medal)) earned.add(code)
  if (decisions.some((d) => d.made.has('rescue'))) earned.add(C.rescueCall)
  if (decisions.some((d) => d.completed && d.made.has('spare')))
    earned.add(C.mercy)
  if (wins.some((result) => result.foil !== null)) earned.add(C.rivalFoil)
  if (STORY_SIDES.every((side) => storySides.has(side))) earned.add(C.everySide)
  if (
    ONE_SHOT_TITLES.length === ONE_SHOT_MENU.length &&
    ONE_SHOT_TITLES.every((title) => oneShotWins.has(title))
  )
    earned.add(C.oneShotSweep)
  if (SCRAPBOOK_MOMENTS.every((moment) => witnessed.has(moment.id)))
    earned.add(C.scrapbookFull)
  return Object.values(C).filter((code) => earned.has(code))
}

const DECISION_CODES: readonly EvtAchievementCode[] = [C.rescueCall, C.mercy]

/**
 * What to award after a live save moved the scrapbook from `before` to
 * `after`: every achievement the book proves once the save added a page or a
 * result; otherwise only the story decisions the saves carry.
 */
export function achievementsFor(
  before: Scrapbook,
  after: Scrapbook,
  saves: readonly EvtSave[],
): EvtAchievementCode[] {
  const oldPages = new Set(before.records.map((record) => record.id))
  const oldResults = new Set(before.results.map((result) => result.id))
  const grew =
    after.records.some((record) => !oldPages.has(record.id)) ||
    after.results.some((result) => !oldResults.has(result.id))
  const proven = achievementsProven(after, saves)
  return grew ? proven : proven.filter((code) => DECISION_CODES.includes(code))
}
