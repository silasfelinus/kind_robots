import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import { createStory } from './firstBellStory'
import { createSave, loadSave, type EvtSave } from './saves'
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
    save.perspective !== journal.perspective
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

/** Save the live fight without copying it into the legacy auto/slot keys. */
export function snapshotCrossfire(
  journal: CrossfireJournal,
  save: EvtSave,
): CrossfireJournal | null {
  if (journal.finished || !validChapterSave(journal, save, journal.chapter))
    return null
  return { ...journal, active: save }
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
  const stage = clonePreset(CROSSFIRE_CHAPTERS[chapter]!.id)
  const story = createStory()
  story.current = null
  const active = createSave({
    slot: 'auto',
    perspective: verified.perspective,
    leadSignature: verified.lead,
    stage,
    state: trainingState(0x53a1b7 + chapter * 997, stage, {
      lead: verified.lead,
      foil: verified.foil ?? undefined,
    }),
    story,
  })
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
