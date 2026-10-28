/**
 * The Red Thread: a five-episode cloning story for Space Couch redshirts.
 * A clone preserves its original ID and memorial records. A new generation is
 * a character development, not an erasure of the original's death.
 */
import type { VoyageRun } from './rules'
import { REDSHIRT_BY_ID } from './redshirts'

export type CloneChoice = 'ask' | 'document' | 'override'
export type CloneRecord = {
  id: string
  generation: number
  createdChapter: number
  createdDay: number
  deployments: number
  survived: number
  lastEncounter: string | null
  lastDeploymentChapter: number | null
  lost: boolean
}
export type CloneBeat = {
  step: number
  chapter: number
  choice: CloneChoice
  narrative: string
}
export type CloneProgram = {
  step: number
  records: CloneRecord[]
  beats: CloneBeat[]
}
export type CloneRun = VoyageRun & { cloneProgram?: CloneProgram }

export const CLONE_CHAPTERS = [
  {
    title: 'The Empty Bunk',
    hook: 'One red shirt hangs above a miniature bed. Personnel files a requisition for a fresh hanger. In the back of the couch, a memory spool is still warm.',
    goal: 'Lose a named redshirt in a real encounter, then decide how the crew handles their remaining memories.',
    options: {
      ask: 'Ask their recorded advance directive. The answer is a handwritten yes, conditional on remembering the original life.',
      document:
        'Preserve their complete story in a public archive. The copy will be able to audit what happened to their predecessor.',
      override:
        'Activate the emergency replicator before Personnel can file the death. The crew will remember who skipped the consent hearing.',
    },
  },
  {
    title: 'The Person in the Carbon Copy',
    hook: 'Generation I has come back from a mission. They remember rain on a world they have never visited. The printer insists its ink is perfectly ordinary.',
    goal: 'Deploy a Generation I clone in an encounter. Return in a later episode to investigate what they brought back.',
    options: {
      ask: 'Invite the clone to name themselves and decide what memories to keep. A vote makes the name official.',
      document:
        'Compare mission reports against the original life. A hidden memory proves that Personnel edited the record.',
      override:
        'Overclock the recovery chamber. Generation II can read a future distress call, but every extra minute costs the ship trust.',
    },
  },
  {
    title: 'The Union of Second Selves',
    hook: 'Two versions of the same signature appear on a worker’s contract. The casino claims it owns every new person printed with its licensed molecules.',
    goal: 'Send a Generation II clone into the field, then return with evidence or reputation enough to challenge the casino contract.',
    options: {
      ask: 'Give every copy an independent vote at the bargaining table. The host offers a seat beside their giant hand.',
      document:
        'Publish the ownership contract, including the clause that tried to turn lives into casino inventory.',
      override:
        'Steal the molecular license. The clones are free tonight, but the casino remembers the raid.',
    },
  },
  {
    title: 'A Memory of Tomorrow',
    hook: 'Generation III dreams of the villain’s finale before anyone has announced it. Its predecessor insists this was a childhood memory.',
    goal: 'Deploy a Generation III clone and maintain enough crew trust to compare their memories with the nemesis interference.',
    options: {
      ask: 'Let the clone decide whether to share the future. It tells the others which doorway not to trust.',
      document:
        'Log the conflicting timelines. The proof gives the crew leverage at the final jump gate.',
      override:
        'Read the memory without permission. The enemy notices, and the crew does too.',
    },
  },
  {
    title: 'The Original Who Came Back',
    hook: 'Generation IV refuses to answer to Copy. A tribunal rules that an original, a survivor, and a clone can all be real people.',
    goal: 'Send a Generation IV clone on a mission and return for the final hearing; the ending remembers what rights you earned.',
    options: {
      ask: 'Recognize the clone as a whole person. They choose whether the last transmission says farewell or hello.',
      document:
        'Write an interstellar charter protecting the names, memories, and autonomy of every later generation.',
      override:
        'Broadcast the clones’ testimony across the galaxy before the court can seal it.',
    },
  },
] as const

/** Validate only additive state before importing a saved v1 voyage. */
export function validCloneProgram(raw: unknown): raw is CloneProgram {
  if (!raw || typeof raw !== 'object') return false
  const value = raw as Partial<CloneProgram>
  if (
    !Number.isInteger(value.step) ||
    value.step! < 0 ||
    value.step! > CLONE_CHAPTERS.length ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.beats) ||
    value.records.length > 100 ||
    value.beats.length > CLONE_CHAPTERS.length
  )
    return false
  const seen = new Set<string>()
  for (const record of value.records) {
    if (
      !record ||
      !REDSHIRT_BY_ID[record.id] ||
      !Number.isInteger(record.generation) ||
      record.generation < 1 ||
      record.generation > 4 ||
      !Number.isInteger(record.createdChapter) ||
      record.createdChapter < 1 ||
      record.createdChapter > 9 ||
      !Number.isInteger(record.createdDay) ||
      record.createdDay < 1 ||
      !Number.isInteger(record.deployments) ||
      record.deployments < 0 ||
      !Number.isInteger(record.survived) ||
      record.survived < 0 ||
      record.survived > record.deployments ||
      typeof record.lost !== 'boolean' ||
      (record.lastEncounter !== null &&
        typeof record.lastEncounter !== 'string') ||
      (record.lastDeploymentChapter !== null &&
        (!Number.isInteger(record.lastDeploymentChapter) ||
          record.lastDeploymentChapter < record.createdChapter ||
          record.lastDeploymentChapter > 9))
    )
      return false
    const key = record.id + ':' + record.generation
    if (seen.has(key)) return false
    seen.add(key)
  }
  return (
    value.beats.every(
      (beat, index) =>
        beat &&
        beat.step === index &&
        Number.isInteger(beat.chapter) &&
        beat.chapter >= 1 &&
        beat.chapter <= 9 &&
        ['ask', 'document', 'override'].includes(beat.choice) &&
        typeof beat.narrative === 'string' &&
        beat.narrative.length < 1000,
    ) && value.step === value.beats.length
  )
}

function program(run: VoyageRun): CloneProgram {
  return (run as CloneRun).cloneProgram ?? { step: 0, records: [], beats: [] }
}
export function cloneProgram(run: VoyageRun): CloneProgram {
  return program(run)
}
export function cloneLatest(run: VoyageRun, id: string): CloneRecord | null {
  return (
    [...program(run).records].reverse().find((record) => record.id === id) ??
    null
  )
}
export function cloneGeneration(run: VoyageRun, id: string): number {
  const current = cloneLatest(run, id)
  return current && !current.lost && (run.redshirtRoster ?? []).includes(id)
    ? current.generation
    : 0
}
export function cloneCost(generation: number): number {
  return generation >= 1 && generation <= 4 ? generation * 2 + 1 : Infinity
}
export function cloneQuestStatus(run: VoyageRun): {
  step: number
  title: string
  hook: string
  goal: string
  ready: boolean
  reason: string
} {
  const data = program(run)
  const step = Math.min(CLONE_CHAPTERS.length, data.step)
  if (step === CLONE_CHAPTERS.length)
    return {
      step,
      title: 'The Red Thread Complete',
      hook: 'The tiny memorial corridor is also a gallery of living signatures.',
      goal: 'A clone-rights ending is now possible.',
      ready: false,
      reason: 'The final tribunal has been heard.',
    }
  const chapter = CLONE_CHAPTERS[step]!
  const previous = data.beats.at(-1)
  if (previous && run.chapter <= previous.chapter)
    return {
      step,
      ...chapter,
      ready: false,
      reason: 'The next act begins in a future episode.',
    }
  if (step === 0) {
    const ready = (run.redshirtFallen ?? []).length > 0
    return {
      step,
      ...chapter,
      ready,
      reason: ready
        ? 'A fallen colleague waits in the memorial.'
        : 'No redshirt memorial has been opened yet.',
    }
  }
  const experienced = data.records.some(
    (record) =>
      record.generation === step &&
      record.deployments > 0 &&
      record.lastDeploymentChapter !== null &&
      record.lastDeploymentChapter < run.chapter,
  )
  if (!experienced)
    return {
      step,
      ...chapter,
      ready: false,
      reason:
        'A Generation ' +
        step +
        ' clone must return from a field assignment in an earlier episode.',
    }
  if (step === 2 && run.reputation < 1)
    return {
      step,
      ...chapter,
      ready: false,
      reason:
        'The clone-rights hearing requires at least one reputation point.',
    }
  if (step === 3 && run.trust < 1)
    return {
      step,
      ...chapter,
      ready: false,
      reason: 'Your crew must trust you before examining the future memory.',
    }
  return { step, ...chapter, ready: true, reason: 'The next act is ready.' }
}
export function advanceCloneQuest(
  run: VoyageRun,
  choice: CloneChoice,
): VoyageRun {
  if (!['ask', 'document', 'override'].includes(choice)) return run
  if (!['briefing', 'travel', 'expedition', 'debrief'].includes(run.phase))
    return run
  const status = cloneQuestStatus(run)
  if (!status.ready || status.step >= CLONE_CHAPTERS.length) return run
  const data = program(run)
  const narrative = CLONE_CHAPTERS[status.step]!.options[choice]
  const next: CloneProgram = {
    ...data,
    step: status.step + 1,
    beats: [
      ...data.beats,
      { step: status.step, chapter: run.chapter, choice, narrative },
    ],
  }
  return {
    ...run,
    cloneProgram: next,
    trust: run.trust + (choice === 'ask' ? 1 : choice === 'override' ? -2 : 0),
    reputation: run.reputation + (choice === 'document' ? 1 : 0),
    supplies: run.supplies + (choice === 'override' ? 1 : 0),
    worldFlags: [
      ...(run.worldFlags ?? []),
      'clone-quest:' + status.step + ':' + choice,
    ],
    scene: narrative,
    log: [...run.log, 'RED THREAD / ' + status.title + ': ' + narrative],
  }
}
export function cloneCandidates(run: VoyageRun): {
  id: string
  name: string
  generation: number
  cost: number
  available: boolean
  reason: string
}[] {
  const data = program(run)
  const fallen = [...new Set((run.redshirtFallen ?? []).map((loss) => loss.id))]
  const ids = [...new Set([...fallen, ...data.records.map((x) => x.id)])]
  return ids
    .filter((id) => REDSHIRT_BY_ID[id])
    .map((id) => {
      const last = cloneLatest(run, id)
      const generation = (last?.generation ?? 0) + 1
      const cost = cloneCost(generation)
      const alive = (run.redshirtRoster ?? []).includes(id)
      const priorDeath = (run.redshirtFallen ?? []).find(
        (loss) => loss.id === id,
      )
      const lastChapter =
        last?.createdChapter ?? priorDeath?.chapter ?? run.chapter
      const available =
        data.step >= generation &&
        generation <= 4 &&
        run.chapter > lastChapter &&
        run.supplies >= cost &&
        (alive ? !!last && !last.lost : true) &&
        (!alive ||
          (run.expeditionVisit?.results ?? []).every(
            (result) => result.lead !== id,
          ))
      return {
        id,
        name: REDSHIRT_BY_ID[id]!.name,
        generation,
        cost,
        available,
        reason:
          data.step < generation
            ? 'Unlock Generation ' + generation + ' in The Red Thread.'
            : generation > 4
              ? 'The fourth generation is the final authorized template.'
              : run.chapter <= lastChapter
                ? 'The next version may be grown in a later episode.'
                : run.supplies < cost
                  ? 'Requires ' + cost + ' supplies.'
                  : alive &&
                      (run.expeditionVisit?.results ?? []).some(
                        (result) => result.lead === id,
                      )
                    ? 'Already assigned this episode.'
                    : 'Ready to print or upgrade.',
      }
    })
}
export function printClone(run: VoyageRun, id: string): VoyageRun {
  if (!['briefing', 'travel', 'expedition', 'debrief'].includes(run.phase))
    return run
  const candidate = cloneCandidates(run).find((entry) => entry.id === id)
  if (!candidate?.available) return run
  const alive = (run.redshirtRoster ?? []).includes(id)
  if (!alive && (run.redshirtRoster?.length ?? 0) >= 12) return run
  const data = program(run)
  const created: CloneRecord = {
    id,
    generation: candidate.generation,
    createdChapter: run.chapter,
    createdDay: run.day ?? run.chapter,
    deployments: 0,
    survived: 0,
    lastEncounter: null,
    lastDeploymentChapter: null,
    lost: false,
  }
  const kind = alive ? 'upgraded to' : 'returned as'
  const caption =
    REDSHIRT_BY_ID[id]!.name +
    ' ' +
    kind +
    ' Generation ' +
    candidate.generation +
    '. Their previous lives remain on the memorial wall.'
  return {
    ...run,
    supplies: run.supplies - candidate.cost,
    redshirtRoster: alive
      ? run.redshirtRoster
      : [...(run.redshirtRoster ?? []), id],
    cloneProgram: {
      ...data,
      records: [...data.records, created],
    },
    scene: caption,
    log: [...run.log, 'CLONE LAB: ' + caption],
    worldFlags: [
      ...(run.worldFlags ?? []),
      'clone-generation:' + candidate.generation,
    ],
  }
}
/** Call once after each expedition dispatch. Only new results count as experience. */
export function recordCloneMissions(
  previous: VoyageRun,
  resolved: VoyageRun,
): VoyageRun {
  if (previous === resolved) return resolved
  const data = program(previous)
  if (!data.records.length) return resolved
  const before = new Set(
    (previous.expeditionVisit?.results ?? []).map((x) => x.encounterId),
  )
  const gained = (resolved.expeditionVisit?.results ?? []).filter(
    (result) => !before.has(result.encounterId),
  )
  if (!gained.length) return resolved
  const records = data.records.map((record) => {
    const latest = cloneLatest(previous, record.id)
    if (latest !== record || record.lost) return record
    const events = gained.filter((result) => result.lead === record.id)
    if (!events.length) return record
    return {
      ...record,
      deployments: record.deployments + events.length,
      survived: record.survived + events.filter((e) => !e.casualty).length,
      lastEncounter: events.at(-1)!.encounterId,
      lastDeploymentChapter: resolved.chapter,
      lost: events.some((e) => e.casualty === record.id),
    }
  })
  return {
    ...resolved,
    cloneProgram: { ...data, records },
  }
}
/** Advanced clones remember their previous assignments, raising known odds only. */
export function cloneOddsBonus(run: VoyageRun, id: string): number {
  const generation = cloneGeneration(run, id)
  return generation ? generation * 6 : 0
}
/** Acknowledges clone rights; the forced-copy path has a separate verdict. */
export function cloneEndingCoda(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const data = program(run)
  if (data.step < 1 || !data.records.length) return run
  const last = data.beats.at(-1)
  const finished = data.step >= CLONE_CHAPTERS.length
  const coerced = data.beats.some((beat) => beat.choice === 'override')
  const living = data.records.filter(
    (record) => cloneLatest(run, record.id) === record && !record.lost,
  ).length
  const epilogue = finished
    ? coerced
      ? 'THE RED THREAD: Every copy has a name, but the crew will remember who took their memories without permission. The clone tribunal promises a second trial.'
      : 'THE RED THREAD: The clone tribunal recognizes every generation as a complete person. Their names are entered beside the originals, not in place of them.'
    : 'THE RED THREAD: The unfinished memory trial remains aboard the couch. The living clones insist their story is still theirs to tell.'
  const title = finished
    ? coerced
      ? ' · The Unfinished Consent'
      : ' · The Rights of Copies'
    : ''
  return {
    ...run,
    ending: (run.ending ?? 'Voyage Complete') + title,
    scene:
      run.scene +
      ' ' +
      epilogue +
      ' ' +
      living +
      ' clone lineages are still aboard.' +
      (last ? ' Final heard testimony: ' + last.narrative : ''),
    log: [...run.log, epilogue],
  }
}
