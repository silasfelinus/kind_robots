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

export type PlanGap = { label: string; built: number; planned: number }

export type Shine = 'none' | 'star' | 'super'

export type Ledger = {
  sections: LedgerSection[]
  units: number
  starred: number
  art: SectionCounts
  unwritten: number
  outcomes: { written: number; expected: number }
  takenSeconds: number
  remainingSeconds: number
  remainingWords: number
  progress: number
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
export function nodeArtPrompt(node: PlaybookNode): string {
  const first = node.body[0]?.split(/(?<=\.)\s/)[0] ?? ''
  return (
    [node.title, node.place].filter(Boolean).join(', ') +
    (first ? `. ${first}` : '')
  )
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

export function unitComplete(unit: LedgerUnit): boolean {
  return (
    unit.art === 'delivered' &&
    unit.written &&
    unit.outcomes.written >= unit.outcomes.expected
  )
}

export function buildLedger(
  book: Pick<Playbook, 'order' | 'nodes'>,
  jobsByNode: Record<string, LedgerJob[]>,
  options: {
    laneKey: string
    assumptions: Assumptions
    gaps?: PlanGap[]
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
      label: SECTION_LABELS[kind],
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
  const complete = sections.reduce(
    (n, s) => n + s.units.filter(unitComplete).length,
    0,
  )
  const gaps = (options.gaps ?? []).filter((gap) => gap.built < gap.planned)

  const discrepancies: string[] = []
  if (art.rendered)
    discrepancies.push(
      `${art.rendered} picture${art.rendered === 1 ? ' is' : 's are'} rendered but not wired into the game.`,
    )
  if (art.failed)
    discrepancies.push(
      `${art.failed} beat${art.failed === 1 ? '' : 's'} only ever failed to render.`,
    )
  if (art.missing)
    discrepancies.push(
      `${art.missing} beat${art.missing === 1 ? ' has' : 's have'} no art and no job.`,
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
      `${gap.label}: ${gap.built} built of ${gap.planned} planned.`,
    )
  discrepancies.push(...(options.notes ?? []))

  const starred = sections.filter((s) => s.starred).length
  const allStarred = sections.length > 0 && starred === sections.length
  return {
    sections,
    units,
    starred,
    art,
    unwritten,
    outcomes,
    takenSeconds: sections.reduce((n, s) => n + s.takenSeconds, 0),
    remainingSeconds: sections.reduce((n, s) => n + s.remainingSeconds, 0),
    remainingWords: sections.reduce((n, s) => n + s.remainingWords, 0),
    progress: units ? complete / units : 0,
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
    return have < want ? [{ label: row.label, built: have, planned: want }] : []
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
