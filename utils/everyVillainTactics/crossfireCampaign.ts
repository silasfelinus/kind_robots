import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import { createStory } from './firstBellStory'
import { createSave, loadSave, type EvtSave } from './saves'
import { scoreFromSave } from './scores'
import { clonePreset } from './studio'
import { trainingState } from './training'

/** The six authored battles are now a fixed story order, not six one-shots
 * that accidentally share the First Bell save slot. */
export const CROSSFIRE_CHAPTERS = [
  { id: 'first-bell', title: 'First Bell' },
  { id: 'science-lab', title: 'Science Wing Lockdown' },
  { id: 'crosswalk-crisis', title: 'Crosswalk Crisis' },
  { id: 'rooftop-broadcast', title: 'Rooftop Broadcast' },
  { id: 'under-comet-breach', title: 'Under-Comet Breach' },
  { id: 'prom-night-finale', title: "Prom Night: Everybody's Villain" },
] as const

export const evtCrossfireKey = 'kr-every-villain-tactics:crossfire:v1'

/**
 * A battle's authored choice is the *only* source of the next chapter's
 * tactical callback. No parallel, user-editable campaign reputation counter.
 * The squad keeps one wound from the last mission, while a merciful rescue
 * grants opening cover or documented evidence exposes the opening rival.
 */
const CALLBACKS = [
  {
    help: null,
    intel: null,
  },
  {
    help: 'lab-rescued',
    intel: 'lab-evidence',
  },
  {
    help: 'crosswalk-medics',
    intel: 'crosswalk-jammed',
  },
  {
    help: 'roof-warning',
    intel: 'roof-jammed',
  },
  {
    help: 'breach-vented',
    intel: 'breach-evidence',
  },
] as const

export type CrossfireCarryover = {
  effect: 'guard' | 'intel' | 'none'
  guarded: boolean
  marked: boolean
  note: string
  wounded: string[]
}

/** This reads existing validated chapter outcomes; it does not add save keys. */
export function crossfireCarryover(
  battle: EvtSave,
  previousChapter: number,
): CrossfireCarryover {
  const squad = battle.state.units.filter(
    (unit) => unit.team === 'squad' && unit.hp < unit.maxHp,
  )
  const wounded = squad.map((unit) => unit.id)
  const flags = battle.state.flags ?? []
  const source = CALLBACKS[previousChapter]
  const help =
    previousChapter === 0
      ? battle.story.mercy || battle.story.civilians > 0
      : !!source?.help && flags.includes(source.help)
  const intel =
    previousChapter === 0
      ? battle.story.evidence > 0
      : !!source?.intel && flags.includes(source.intel)
  const effect = help ? 'guard' : intel ? 'intel' : 'none'
  const chapter = CROSSFIRE_CHAPTERS[previousChapter]?.title ?? 'The last fight'
  const consequences: string[] = []
  if (help)
    consequences.push(
      'The people you protected warn the squad in time to take cover (+15 enemy miss chance on the opening volley).',
    )
  if (intel)
    consequences.push(
      'Evidence from your previous mission exposes the enemy lead (+20 hit chance on the opening volley).',
    )
  const consequence =
    consequences.join(' ') || 'No rescue or evidence changed the next patrol.'
  const injuries = wounded.length
    ? ` ${wounded.length} squadmate(s) begin the next fight with one lingering wound.`
    : ' The squad recovers between fights.'
  return {
    effect,
    guarded: help,
    marked: intel,
    note: `${chapter}: ${consequence}${injuries}`,
    wounded,
  }
}

export function applyCrossfireCarryover(
  state: ReturnType<typeof trainingState>,
  previous: EvtSave,
  previousChapter: number,
) {
  const carry = crossfireCarryover(previous, previousChapter)
  // No permanent HP maximum mutation: save validation and role abilities stay
  // identical to the canonical 48-person roster. Rest between chapters heals
  // all but one wound, never leaving a dead squadmate unplayable.
  for (const unit of state.units.filter((unit) => unit.team === 'squad')) {
    if (carry.wounded.includes(unit.id)) unit.hp = Math.max(1, unit.maxHp - 1)
  }
  if (carry.guarded) {
    const lead = state.units.find(
      (unit) => unit.team === 'squad' && unit.id === 'backdraft',
    )
    if (lead && !lead.statuses.includes('guarded'))
      lead.statuses.push('guarded')
  }
  if (carry.marked) {
    const rival = state.units.find(
      (unit) => unit.team === 'rival' && unit.hp > 0,
    )
    if (rival && !rival.statuses.includes('marked'))
      rival.statuses.push('marked')
  }
  state.log = carry.note
  state.events = [carry.note, ...state.events].slice(0, 6)
}

/** Crossfire's first five completed chapters can win allies *in the battle*,
 * not only a different epilogue. The only inputs are previously validated v2
 * chapter saves; no mutable campaign reputation or new save schema is needed. */
export type CrossfireFinaleNetwork = {
  rescues: number
  evidence: number
  squadGuarded: boolean
  enemiesExposed: boolean
}

export function crossfireFinaleNetwork(
  completed: readonly EvtSave[],
): CrossfireFinaleNetwork | null {
  if (
    completed.length !== CROSSFIRE_CHAPTERS.length - 1 ||
    completed.some((save) => save.state.phase !== 'victory')
  )
    return null
  const outcomes = completed.map((save, index) =>
    crossfireCarryover(save, index),
  )
  const rescues = outcomes.filter((outcome) => outcome.guarded).length
  const evidence = outcomes.filter((outcome) => outcome.marked).length
  return {
    rescues,
    evidence,
    squadGuarded: rescues >= 3,
    enemiesExposed: evidence >= 2,
  }
}

/** Allies rescued on multiple nights cover the *whole* squad at the finale;
 * collected evidence exposes the whole opposing formation. These are actual
 * guarded/marked combat statuses, not cosmetic morale points. */
export function applyCrossfireFinaleNetwork(
  state: ReturnType<typeof trainingState>,
  completed: readonly EvtSave[],
): CrossfireFinaleNetwork | null {
  const network = crossfireFinaleNetwork(completed)
  if (!network) return null
  const messages: string[] = []
  if (network.squadGuarded) {
    for (const unit of state.units.filter(
      (unit) => unit.team === 'squad' && unit.hp > 0,
    ))
      if (!unit.statuses.includes('guarded')) unit.statuses.push('guarded')
    messages.push(
      'Students, medics and workers rescued on earlier nights hold the ballroom exits. Every surviving squadmate starts in guarded cover.',
    )
  }
  if (network.enemiesExposed) {
    for (const unit of state.units.filter(
      (unit) => unit.team === 'rival' && unit.hp > 0,
    ))
      if (!unit.statuses.includes('marked')) unit.statuses.push('marked')
    messages.push(
      'Evidence gathered across the city names the attack routes. Every opening rival is marked before the first shot.',
    )
  }
  if (messages.length) {
    const report = messages.join(' ')
    state.log = report
    state.events = [report, ...state.events].slice(0, 6)
  }
  return network
}

export type CrossfireJournal = {
  version: 1
  lead: SignaturePowerId
  foil: SignaturePowerId | null
  perspective: 'hero' | 'villain'
  chapter: number
  /** Completed chapter saves are evidence, not optimistic menu counters. */
  completed: EvtSave[]
  active: EvtSave
  finished: boolean
}

function validChapterSave(
  journal: CrossfireJournal,
  save: EvtSave,
  index: number,
): boolean {
  const result = loadSave(save)
  if (!result.ok) return false
  if (
    save.leadSignature !== journal.lead ||
    save.perspective !== journal.perspective ||
    (save.foilSignature !== undefined && save.foilSignature !== journal.foil)
  )
    return false
  if (index === 0)
    return (
      save.mode === 'story' &&
      save.stage === null &&
      (save.foilSignature ?? null) === journal.foil
    )
  const stage = save.stage
  return (
    save.mode === 'oneshot' &&
    stage?.id === CROSSFIRE_CHAPTERS[index]?.id &&
    JSON.stringify(stage) ===
      JSON.stringify(clonePreset(CROSSFIRE_CHAPTERS[index]!.id))
  )
}

function earnedVictory(save: EvtSave, index: number): boolean {
  return save.state.phase === 'victory' && (index > 0 || save.story.completed)
}

/** A Crossfire journal never upgrades or re-keys old story and one-shot saves. */
export function newCrossfireJournal(save: EvtSave): CrossfireJournal | null {
  const journal: CrossfireJournal = {
    version: 1,
    lead: save.leadSignature,
    foil: save.foilSignature ?? null,
    perspective: save.perspective === 'villain' ? 'villain' : 'hero',
    chapter: 0,
    completed: [],
    active: save,
    finished: false,
  }
  return validChapterSave(journal, save, 0) ? journal : null
}

/** Validation reconstructs each completed battle with the existing v2 save
 * validator. A forged chapter index or unrelated one-shot cannot unlock act 6. */
export function readCrossfireJournal(raw: unknown): CrossfireJournal | null {
  let value = raw
  try {
    if (typeof raw === 'string') value = JSON.parse(raw)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const journal = value as CrossfireJournal
  if (
    journal.version !== 1 ||
    !Number.isInteger(journal.chapter) ||
    journal.chapter < 0 ||
    journal.chapter >= CROSSFIRE_CHAPTERS.length ||
    !['hero', 'villain'].includes(journal.perspective) ||
    !Array.isArray(journal.completed) ||
    typeof journal.finished !== 'boolean' ||
    !journal.active ||
    (journal.finished &&
      (journal.chapter !== CROSSFIRE_CHAPTERS.length - 1 ||
        journal.completed.length !== CROSSFIRE_CHAPTERS.length)) ||
    (!journal.finished && journal.completed.length !== journal.chapter) ||
    !validChapterSave(journal, journal.active, journal.chapter)
  )
    return null
  for (let index = 0; index < journal.completed.length; index++) {
    const save = journal.completed[index]!
    if (!validChapterSave(journal, save, index) || !earnedVictory(save, index))
      return null
  }
  if (
    journal.finished &&
    (!earnedVictory(journal.active, journal.chapter) ||
      journal.completed.at(-1)?.checksum !== journal.active.checksum)
  )
    return null
  return journal
}

/** Restore earned pages from the separate journal without replaying a battle. */
export function crossfireScrapbookSaves(raw: unknown): EvtSave[] {
  const journal = readCrossfireJournal(raw)
  if (!journal) return []
  return journal.finished
    ? [...journal.completed]
    : [...journal.completed, journal.active]
}

/** A campaign total is a read-only view of its validated journal, not a
 * farmable balance. The current victory counts once, even before advancing. */
export function crossfireCampaignScore(raw: unknown) {
  const journal = readCrossfireJournal(raw)
  if (!journal) return null
  const victories = [...journal.completed]
  if (!journal.finished && earnedVictory(journal.active, journal.chapter))
    victories.push(journal.active)
  const chapters = victories.map((save, index) => {
    const result = scoreFromSave(save)!
    return {
      id: CROSSFIRE_CHAPTERS[index]!.id,
      title: CROSSFIRE_CHAPTERS[index]!.title,
      points: result.total,
      medals: result.medals.length,
    }
  })
  return {
    chapters,
    cleared: chapters.length,
    total: chapters.reduce((sum, chapter) => sum + chapter.points, 0),
    medals: chapters.reduce((sum, chapter) => sum + chapter.medals, 0),
  }
}

/** Save the live fight without copying it into the legacy auto/slot keys. */
export function snapshotCrossfire(
  journal: CrossfireJournal,
  save: EvtSave,
): CrossfireJournal | null {
  if (journal.finished || !validChapterSave(journal, save, journal.chapter))
    return null
  return { ...journal, active: save }
}

/** Reconstruct the exact opening, including earned support and wounds. */
function openingCrossfireSave(
  journal: CrossfireJournal,
  chapter: number,
  completed: readonly EvtSave[],
): EvtSave {
  const stage =
    chapter === 0 ? null : clonePreset(CROSSFIRE_CHAPTERS[chapter]!.id)
  const story = createStory()
  if (stage) story.current = null
  const state = trainingState(0x53a1b7 + chapter * 997, stage ?? undefined, {
    lead: journal.lead,
    foil: journal.foil ?? undefined,
  })
  const previous = completed[chapter - 1]
  if (previous) applyCrossfireCarryover(state, previous, chapter - 1)
  if (chapter === CROSSFIRE_CHAPTERS.length - 1)
    applyCrossfireFinaleNetwork(state, completed)
  return createSave({
    slot: 'auto',
    perspective: journal.perspective,
    leadSignature: journal.lead,
    foilSignature: journal.foil,
    stage,
    state,
    story,
  })
}

/** Retry only the current chapter; completed chapters are immutable. */
export function retryCrossfire(raw: unknown): CrossfireJournal | null {
  const journal = readCrossfireJournal(raw)
  if (!journal || journal.finished) return null
  return readCrossfireJournal({
    ...journal,
    active: openingCrossfireSave(journal, journal.chapter, journal.completed),
  })
}

/** Victory plus First Bell's closing decision are required before advancing.
 * Losses remain replayable without silently granting progress. */
export function advanceCrossfire(
  journal: CrossfireJournal,
): CrossfireJournal | null {
  const verified = readCrossfireJournal(journal)
  if (
    !verified ||
    verified.finished ||
    !earnedVictory(verified.active, verified.chapter)
  )
    return null
  const completed = [...verified.completed, verified.active]
  const chapter = verified.chapter + 1
  if (chapter === CROSSFIRE_CHAPTERS.length)
    return { ...verified, completed, finished: true }
  const active = openingCrossfireSave(verified, chapter, completed)
  const next = {
    ...verified,
    chapter,
    completed,
    active,
  }
  return readCrossfireJournal(next)
}

export function crossfireChapterTitle(journal: CrossfireJournal): string {
  return CROSSFIRE_CHAPTERS[journal.chapter]!.title
}
