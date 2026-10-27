import type { NodeKind, Playbook, PlaybookNode } from '../playbook/types'
import {
  checkpointClass,
  type Assumptions,
  type CheckpointClassId,
} from './calibration'
import type { BuiltCounts } from './existing'
import { FACTOR_ROWS } from './factors'
import type { Blueprint } from './types'

// The production ledger: every unit of work a playbook is made of, what it has
// already cost and what is left. A unit is one authored beat; its art moves
// missing → queued → rendered → delivered (queued is not rendered, rendered is
// not delivered until the game shows it), and its words are its scene text and
// the success and failure text of every checked choice. A section is starred
// when every unit in it is delivered and written; a playbook is super shiny
// when every section is starred, nothing failed and the plan is met.

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'

export type LedgerJob = {
  id: number
  status: JobStatus
  engine: string
  renderSeconds: number | null
  error: string | null
  /** The rendered picture, once a job is done (the gallery previews it). */
  artImageId?: number | null
}

export type ArtState =
  'delivered' | 'rendered' | 'queued' | 'failed' | 'missing'

export type LedgerUnit = {
  key: string
  title: string
  kind: NodeKind
  art: ArtState
  written: boolean
  outcomes: { written: number; expected: number }
  jobs: LedgerJob[]
  takenSeconds: number
}

export type SectionCounts = Record<ArtState, number>

export type LedgerSection = {
  id: NodeKind
  label: string
  units: LedgerUnit[]
  art: SectionCounts
  unwritten: number
  outcomes: { written: number; expected: number }
  takenSeconds: number
  remainingSeconds: number
  remainingWords: number
  starred: boolean
}

export type ProjectJobs = {
  project: string
  counts: Record<JobStatus, number>
  renderSeconds: number
  medianSeconds: number | null
  byEngine: { engine: string; count: number; seconds: number }[]
  failures: { id: number; engine: string; error: string; createdAt: string }[]
}

export type PlanGap = {
  label: string
  built: number
  planned: number
  key?: keyof Blueprint
}

export type Shine = 'none' | 'star' | 'super'

export type Ledger = {
  sections: LedgerSection[]
  units: number
  /** One estimated authored art/text slot for every still-unbuilt primary encounter. */
  unbuiltUnits: number
  plannedUnits: number
  starred: number
  art: SectionCounts
  unwritten: number
  outcomes: { written: number; expected: number }
  takenSeconds: number
  remainingSeconds: number
  remainingWords: number
  /** Encounters built of those planned (1 when the plan is met); scales every share below. */
  scope: number
  /** Half writing, half art, averaged over every beat: a written but unpainted game is half done. */
  progress: number
  /** Share of beats whose scene and outcome text are written. */
  writtenShare: number
  /** Share of independently required pictures that were verified delivered. */
  paintedShare: number
  /** Share of beats both written and painted (what stars a section). */
  finishedShare: number
  extraArt: { total: number; delivered: number }
  gaps: PlanGap[]
  discrepancies: string[]
  shine: Shine
}

export const SECTION_LABELS: Record<NodeKind, string> = {
  opening: 'Openings',
  spine: 'Story spine',
  fork: 'Draws',
  encounter: 'Encounters',
  crossroads: 'Crossroads',
  boss: 'Bosses',
  quest: 'Quests',
  follower: 'Followers',
  thread: 'Threads',
  ending: 'Endings',
}

const SECTION_ORDER: NodeKind[] = [
  'opening',
  'spine',
  'encounter',
  'fork',
  'crossroads',
  'quest',
  'follower',
  'boss',
  'thread',
  'ending',
]

/** The render lane class a Playbook Studio art lane renders on. */
export function laneClass(laneKey: string): CheckpointClassId {
  if (laneKey === 'krea2' || laneKey === 'zimage' || laneKey === 'flux2')
    return laneKey
  return 'illustrious'
}

/** The same default prompt Playbook Studio offers for a beat: title, place and its first sentence. */
/**
 * Beats whose picture lives in the image store (\`artPath\`) and was found
 * there by the ledger API: they count as painted.
 */
export function withPainted(
  book: Pick<Playbook, 'order' | 'nodes'>,
  painted: Record<string, string> | undefined,
): Pick<Playbook, 'order' | 'nodes'> {
  if (!painted || !Object.keys(painted).length) return book
  const nodes = { ...book.nodes }
  for (const [key, url] of Object.entries(painted)) {
    const node = nodes[key]
    if (node && !node.artUrl)
      nodes[key] = { ...node, artUrl: url, needsArt: false }
  }
  return { ...book, nodes }
}

/** A beat's authored art prompt, or null: prompts are written, never assembled from titles. */
export function nodeArtPrompt(node: PlaybookNode): string | null {
  return node.artPrompt?.trim() || null
}

/**
 * The Todo for beats that need a picture but have no authored prompt yet:
 * write the prompts first, as a Conductor auto_submit round, so the art is
 * made from a described picture rather than a chapter title.
 */
export function artPromptBrief(
  game: string,
  title: string,
  artProject: string,
  sectionLabel: string,
  nodes: PlaybookNode[],
): string {
  return [
    `From the Playbook Forge ledger for ${title} (Playbook Studio game "${game}"): ${nodes.length} beat${nodes.length === 1 ? '' : 's'} in ${sectionLabel} need art but have no art prompt.`,
    `Write a prompt for each as a Conductor round ledger at projects/${artProject}/art/<ROUND>.yaml with auto_submit: true, one subject per beat with its runtime asset path, and check it with python scripts/enqueue_art_requests.py <ledger> (dry run) so the live prompt contract passes.`,
    'Describe the picture in plain prose: who is there, where, what is happening, light and mood. Never use the beat title, chapter title, subtitle, case number or any lettering; state what is present rather than what is absent.',
    'Skip any beat held for consultation. Once merged, the Auto Art Generate sweep submits the round; export the renders into the game when they are DONE.',
    '',
    ...nodes.map(
      (node) =>
        `- ${node.key} "${node.title}"${node.place ? ` (${node.place})` : ''}${node.art ? ` → ${node.art}` : ''}: ${(node.body[0] ?? '').slice(0, 220)}`,
    ),
  ].join('\n')
}

export function nodeShape(node: PlaybookNode): 'scene' | 'portrait' {
  return node.kind === 'follower' ? 'portrait' : 'scene'
}

function artState(node: PlaybookNode, jobs: LedgerJob[]): ArtState {
  if (node.artUrl || !node.needsArt) return 'delivered'
  if (jobs.some((j) => j.status === 'DONE')) return 'rendered'
  if (jobs.some((j) => j.status === 'PENDING' || j.status === 'RUNNING'))
    return 'queued'
  if (jobs.some((j) => j.status === 'FAILED')) return 'failed'
  return 'missing'
}

function outcomeCount(node: PlaybookNode) {
  let expected = 0
  let written = 0
  for (const choice of node.choices) {
    if (!choice.check) continue
    // A check with no outcome text branches to other beats instead (the Zuzu Gamebook).
    if (!choice.success && !choice.failure) continue
    expected += 2
    if (choice.success?.text?.trim()) written += 1
    if (choice.failure?.text?.trim()) written += 1
  }
  return { written, expected }
}

export function ledgerUnit(
  node: PlaybookNode,
  jobs: LedgerJob[] = [],
): LedgerUnit {
  return {
    key: node.key,
    title: node.title,
    kind: node.kind,
    art: artState(node, jobs),
    written: node.body.some((line) => line.trim().length > 0),
    outcomes: outcomeCount(node),
    jobs,
    takenSeconds: jobs.reduce(
      (sum, j) => sum + (j.status === 'DONE' ? (j.renderSeconds ?? 0) : 0),
      0,
    ),
  }
}

function emptyCounts(): SectionCounts {
  return { delivered: 0, rendered: 0, queued: 0, failed: 0, missing: 0 }
}

/** How written a beat is: its scene text, then its outcomes. */
export function unitWriting(unit: LedgerUnit): number {
  const scene = unit.written ? 1 : 0
  if (!unit.outcomes.expected) return scene
  return (
    (scene + Math.min(1, unit.outcomes.written / unit.outcomes.expected)) / 2
  )
}

/** A beat's share of done: half its writing, half its art. */
export function unitProgress(unit: LedgerUnit): number {
  return unitWriting(unit) / 2 + (unit.art === 'delivered' ? 0.5 : 0)
}

export function unitComplete(unit: LedgerUnit): boolean {
  return (
    unit.art === 'delivered' &&
    unit.written &&
    unit.outcomes.written >= unit.outcomes.expected
  )
}

export function buildLedger(
  book: Pick<Playbook, 'order' | 'nodes'> &
    Partial<Pick<Playbook, 'sectionLabels'>>,
  jobsByNode: Record<string, LedgerJob[]>,
  options: {
    laneKey: string
    assumptions: Assumptions
    gaps?: PlanGap[]
    /** Additional real game art requirements outside story beats. */
    extraArt?: { total: number; delivered: number; missing?: string[] }
    /** Discrepancies the caller already knows of (unfolded edits, no adapter). */
    notes?: string[]
  },
): Ledger {
  const secondsPerImage = checkpointClass(
    laneClass(options.laneKey),
  ).secondsPerImage
  const { words } = options.assumptions
  const byKind = new Map<NodeKind, LedgerUnit[]>()
  for (const key of book.order) {
    const node = book.nodes[key]
    if (!node) continue
    const unit = ledgerUnit(node, jobsByNode[key] ?? [])
    byKind.set(node.kind, [...(byKind.get(node.kind) ?? []), unit])
  }

  const sections: LedgerSection[] = SECTION_ORDER.filter((kind) =>
    byKind.has(kind),
  ).map((kind) => {
    const units = byKind.get(kind)!
    const art = emptyCounts()
    let unwritten = 0
    const outcomes = { written: 0, expected: 0 }
    let takenSeconds = 0
    for (const unit of units) {
      art[unit.art] += 1
      if (!unit.written) unwritten += 1
      outcomes.written += Math.min(
        unit.outcomes.written,
        unit.outcomes.expected,
      )
      outcomes.expected += unit.outcomes.expected
      takenSeconds += unit.takenSeconds
    }
    const toPaint = art.missing + art.failed
    return {
      id: kind,
      label: book.sectionLabels?.[kind] ?? SECTION_LABELS[kind],
      units,
      art,
      unwritten,
      outcomes,
      takenSeconds,
      remainingSeconds: Math.round(
        toPaint * secondsPerImage * (1 + options.assumptions.rerollRate),
      ),
      remainingWords:
        unwritten * words.encounterBody +
        (outcomes.expected - outcomes.written) * words.outcomeText,
      starred: units.every(unitComplete),
    }
  })

  const art = emptyCounts()
  let unwritten = 0
  const outcomes = { written: 0, expected: 0 }
  for (const section of sections) {
    for (const state of Object.keys(art) as ArtState[])
      art[state] += section.art[state]
    unwritten += section.unwritten
    outcomes.written += section.outcomes.written
    outcomes.expected += section.outcomes.expected
  }
  const units = sections.reduce((n, s) => n + s.units.length, 0)
  const all = sections.flatMap((s) => s.units)
  const complete = all.filter(unitComplete).length
  const share = (score: (unit: LedgerUnit) => number) =>
    plannedUnits
      ? all.reduce((n, unit) => n + score(unit), 0) / plannedUnits
      : 0
  const gaps = (options.gaps ?? []).filter((gap) => gap.built < gap.planned)
  // Encounters the plan calls for but the code has not built count as not
  // started, so two finished worlds of sixteen read as two of sixteen.
  const short = gaps.find((gap) => gap.key === 'encounters')
  const scope = short ? short.built / short.planned : 1
  // A missing authored encounter is also missing its writing and image. Keep
  // those future production slots in all denominators, not just the percent.
  // Other gaps remain individually visible; they may overlap encounter slots.
  const anchorGap =
    short ??
    gaps.reduce<PlanGap | null>(
      (largest, gap) =>
        !largest || gap.planned - gap.built > largest.planned - largest.built
          ? gap
          : largest,
      null,
    )
  const unbuiltUnits = anchorGap ? anchorGap.planned - anchorGap.built : 0
  const plannedUnits = units + unbuiltUnits
  const extraArt = options.extraArt ?? { total: 0, delivered: 0, missing: [] }
  const missingExtraArt = Math.max(0, extraArt.total - extraArt.delivered)
  const pictureSlots = plannedUnits + extraArt.total
  art.delivered += extraArt.delivered
  art.missing += missingExtraArt

  const discrepancies: string[] = []
  if (unbuiltUnits)
    discrepancies.push(
      `${unbuiltUnits} planned encounter slots are not authored yet; estimate includes one picture and one scene's writing per missing slot.`,
    )
  if (art.rendered)
    discrepancies.push(
      `${art.rendered} picture${art.rendered === 1 ? ' is' : 's are'} rendered but not wired into the game.`,
    )
  if (art.failed)
    discrepancies.push(
      `${art.failed} beat${art.failed === 1 ? '' : 's'} only ever failed to render.`,
    )
  const missingBeatArt = art.missing - missingExtraArt
  if (missingBeatArt)
    discrepancies.push(
      `${missingBeatArt} beat${missingBeatArt === 1 ? ' has' : 's have'} no verified art and no completed delivery.`,
    )
  if (missingExtraArt)
    discrepancies.push(
      `${missingExtraArt} required game images outside story beats are missing (choice outcomes, emotional portraits, villain art or inventory items).`,
      ...(extraArt.missing ?? []).slice(0, 4).map((item) => `Missing: ${item}`),
    )
  if (unwritten)
    discrepancies.push(
      `${unwritten} beat${unwritten === 1 ? ' has' : 's have'} no scene text.`,
    )
  if (outcomes.written < outcomes.expected)
    discrepancies.push(
      `${outcomes.expected - outcomes.written} success or failure outcomes are unwritten.`,
    )
  for (const gap of gaps)
    discrepancies.push(
      `${gap.label}: ${gap.built} built of ${gap.planned} planned.${gap === short ? ' Progress counts the unbuilt ones as not started.' : ''}`,
    )
  discrepancies.push(...(options.notes ?? []))

  const starred = sections.filter((s) => s.starred).length
  const allStarred = sections.length > 0 && starred === sections.length && !missingExtraArt
  return {
    sections,
    units,
    unbuiltUnits,
    plannedUnits,
    starred,
    art,
    unwritten,
    outcomes,
    takenSeconds: sections.reduce((n, s) => n + s.takenSeconds, 0),
    remainingSeconds:
      sections.reduce((n, s) => n + s.remainingSeconds, 0) +
      Math.round(
        (unbuiltUnits + missingExtraArt) * secondsPerImage * (1 + options.assumptions.rerollRate),
      ),
    remainingWords:
      sections.reduce((n, s) => n + s.remainingWords, 0) +
      unbuiltUnits * words.encounterBody,
    scope,
    progress:
      (share(unitWriting) +
        (pictureSlots ? art.delivered / pictureSlots : 0)) /
      2,
    writtenShare: share(unitWriting),
    paintedShare: pictureSlots ? art.delivered / pictureSlots : 0,
    finishedShare: pictureSlots
      ? (complete + extraArt.delivered) / pictureSlots
      : 0,
    extraArt: { total: extraArt.total, delivered: extraArt.delivered },
    gaps,
    discrepancies,
    shine: allStarred && !gaps.length ? 'super' : starred > 0 ? 'star' : 'none',
  }
}

/** The units a section would send to the relay: no delivered art, nothing rendered or in flight. */
export function unitsToPaint(section: LedgerSection): LedgerUnit[] {
  return section.units.filter((u) => u.art === 'missing' || u.art === 'failed')
}

/** The units a section would send to an agent for writing. */
export function unitsToWrite(section: LedgerSection): LedgerUnit[] {
  return section.units.filter(
    (u) => !u.written || u.outcomes.written < u.outcomes.expected,
  )
}

/** Agent Todo text for a section's missing words. */
export function writingBrief(
  game: string,
  title: string,
  section: LedgerSection,
): string {
  const units = unitsToWrite(section)
  return [
    `From the Playbook Forge ledger for ${title} (Playbook Studio game "${game}"): write the missing text in ${section.label}.`,
    'Edit the authored source (or the Playbook Studio overlay), keep ids, rolls and effects, and run the game tests.',
    '',
    ...units.map((u) => {
      const parts = [
        !u.written ? 'scene text' : '',
        u.outcomes.written < u.outcomes.expected
          ? `${u.outcomes.expected - u.outcomes.written} outcome text${u.outcomes.expected - u.outcomes.written === 1 ? '' : 's'}`
          : '',
      ].filter(Boolean)
      return `- ${u.key} "${u.title}": ${parts.join(', ')}`
    }),
    '',
    `About ${section.remainingWords} words. Open /admin/playbook-forge?ledger=${game} to watch the section star.`,
  ].join('\n')
}

/** Measured factors the code has fewer of than the Conductor plan calls for. */
export function planGaps(plan: Blueprint, built: BuiltCounts): PlanGap[] {
  return FACTOR_ROWS.flatMap((row) => {
    if (row.kind !== 'stepper' || !built.measured.includes(row.key)) return []
    const have = Number(built.values[row.key] ?? 0)
    const want = Number(plan[row.key] ?? 0)
    return have < want
      ? [{ label: row.label, built: have, planned: want, key: row.key }]
      : []
  })
}

export type JobRow = LedgerJob & { createdAt: string }

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
}

/** Every ArtJob tagged to a project, rolled up: what the relay has done and what it has spent. */
export function projectJobs(project: string, rows: JobRow[]): ProjectJobs {
  const counts: Record<JobStatus, number> = {
    PENDING: 0,
    RUNNING: 0,
    DONE: 0,
    FAILED: 0,
    CANCELLED: 0,
  }
  const engines = new Map<string, { count: number; seconds: number }>()
  const done: number[] = []
  for (const row of rows) {
    counts[row.status] += 1
    if (row.status !== 'DONE' || row.renderSeconds === null) continue
    done.push(row.renderSeconds)
    const entry = engines.get(row.engine) ?? { count: 0, seconds: 0 }
    engines.set(row.engine, {
      count: entry.count + 1,
      seconds: entry.seconds + row.renderSeconds,
    })
  }
  return {
    project,
    counts,
    renderSeconds: Math.round(done.reduce((a, b) => a + b, 0)),
    medianSeconds: median(done),
    byEngine: [...engines].map(([engine, e]) => ({
      engine,
      count: e.count,
      seconds: Math.round(e.seconds),
    })),
    failures: rows
      .filter((row) => row.status === 'FAILED')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
      .map((row) => ({
        id: row.id,
        engine: row.engine,
        error: row.error ?? 'No error recorded.',
        createdAt: row.createdAt,
      })),
  }
}
