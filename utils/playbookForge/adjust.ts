import type { Design } from './designs'
import { openingCombos } from './estimate'
import { FACTOR_ROWS, displayValue } from './factors'
import type { Blueprint } from './types'

// Adjustments typed on a game's ledger: plan numbers changed, named elements
// added, and a note. They stay in this browser as the working plan and are
// posted as a comment on the game's GitHub master issue, which is where the
// agents read a project's direction (conductor docs/agents/master-issues.yaml).

export const ADDITION_KINDS = [
  { id: 'follower', label: 'Follower', factor: 'followers' },
  { id: 'villain', label: 'Villain', factor: 'villains' },
  { id: 'quest', label: 'Quest', factor: 'quests' },
  { id: 'encounter', label: 'Encounter', factor: 'encounters' },
  { id: 'place', label: 'Place', factor: 'locations' },
  { id: 'ending', label: 'Ending', factor: 'endings' },
  { id: 'other', label: 'Other', factor: null },
] as const satisfies readonly {
  id: string
  label: string
  factor: keyof Blueprint | null
}[]

export type AdditionKind = (typeof ADDITION_KINDS)[number]['id']

/** A design added on a game's ledger; posted with the next adjustment. */
export type PlanAddition = Design & {
  /** The issue comment it was posted in. */
  postedUrl?: string
}

export type PlanEdit = {
  overrides: Partial<Blueprint>
  additions: PlanAddition[]
  note: string
  posts: { url: string; at: string }[]
}

export const EMPTY_PLAN_EDIT: PlanEdit = {
  overrides: {},
  additions: [],
  note: '',
  posts: [],
}

/** Master issues from conductor docs/agents/master-issues.yaml, by Conductor slug. */
export const PLAYBOOK_ISSUES: Record<string, number> = {
  'comet-city-academy': 4181,
  'game-of-captains': 4182,
  'memory-dungeon': 4136,
  'emperor-of-dust': 4142,
  'weird-humboldt': 4145,
  'zuzu-gamebook': 4139,
  'zuzu-shifting-lands': 3917,
}

export const PLAYBOOK_ISSUE_REPO = 'silasfelinus/kind_robots'

export function issueTitleFor(title: string): string {
  return `${title}: Playbook Forge adjustments`
}

/** The plan with this browser's edits: changed numbers, plus one per added element. */
export function applyPlanEdit(
  plan: Blueprint,
  edit: PlanEdit | null | undefined,
): Blueprint {
  if (!edit) return plan
  const next: Blueprint = { ...plan, ...edit.overrides }
  for (const addition of edit.additions) {
    const factor = ADDITION_KINDS.find((k) => k.id === addition.kind)?.factor
    if (factor) next[factor] = Number(next[factor] ?? 0) + 1
  }
  return next
}

export type PlanChange = { label: string; from: string; to: string }

export function planChanges(
  plan: Blueprint,
  overrides: Partial<Blueprint>,
): PlanChange[] {
  const after = { ...plan, ...overrides }
  return FACTOR_ROWS.filter(
    (row) => row.key in overrides && plan[row.key] !== after[row.key],
  ).map((row) => ({
    label: row.label,
    from: displayValue(row, plan),
    to: displayValue(row, after),
  }))
}

/** One line on how openings fan out into endings, for the post and the panel. */
export function combosLine(b: Blueprint): string {
  const c = openingCombos(b)
  const heroes = `${c.heroes} hero${c.heroes === 1 ? '' : 'es'}`
  const parties = `${c.parties} part${c.parties === 1 ? 'y' : 'ies'}`
  const endings =
    b.endingVersions === 'per-hero'
      ? `${b.endings} endings × ${c.heroes} hero versions = ${c.endingVersions} written`
      : `${c.endingVersions} endings, the same for every hero`
  const extra = [
    c.partyScenes
      ? `${c.parties} party adventures (${c.partyScenes} scenes)`
      : '',
    c.partyEndings ? `${c.partyEndings} party endings` : '',
    c.villainEndings ? `${c.villainEndings} villain endings` : '',
    c.epilogueLines ? `${c.epilogueLines} follower epilogue lines` : '',
  ].filter(Boolean)
  return `${heroes} × ${parties} = ${c.openings} openings; ${endings}${extra.length ? `; ${extra.join('; ')}` : ''}.`
}

export type AdjustmentPost = {
  slug: string
  title: string
  note: string
  changes: PlanChange[]
  additions: {
    kind: string
    title: string
    note: string
    source?: string
    prompt?: string
  }[]
  combos: string
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/** Checks a posted adjustment; returns the clean post or the reason it was refused. */
export function readAdjustment(raw: unknown): AdjustmentPost | string {
  if (!raw || typeof raw !== 'object') return 'An adjustment is required.'
  const body = raw as Record<string, unknown>
  const slug = text(body.slug, 81)
  if (!SLUG.test(slug)) return 'A playbook slug is required.'
  const title = text(body.title, 120)
  if (!title) return 'A playbook title is required.'
  const list = (value: unknown) => (Array.isArray(value) ? value : [])
  const changes = list(body.changes)
    .slice(0, 80)
    .map((c: Record<string, unknown>) => ({
      label: text(c?.label, 80),
      from: text(c?.from, 40),
      to: text(c?.to, 40),
    }))
    .filter((c) => c.label)
  const additions = list(body.additions)
    .slice(0, 50)
    .map((a: Record<string, unknown>) => ({
      kind: text(a?.kind, 20) || 'other',
      title: text(a?.title, 120),
      note: text(a?.note, 1200),
      source: text(a?.source, 200) || undefined,
      prompt: text(a?.prompt, 1200) || undefined,
    }))
    .filter((a) => a.title)
  const note = text(body.note, 8000)
  if (!note && !changes.length && !additions.length)
    return 'Type an adjustment, change a number or add an element first.'
  return {
    slug,
    title,
    note,
    changes,
    additions,
    combos: text(body.combos, 400),
  }
}

/** The issue comment. Markdown table cells and headings are kept to plain text. */
export function adjustmentComment(post: AdjustmentPost, by: string): string {
  const cell = (value: string) => value.replace(/[|\n]/g, ' ')
  const lines = [`## Playbook Forge adjustment: ${post.title}`, '']
  if (post.note) lines.push(post.note, '')
  if (post.changes.length) {
    lines.push(
      '### Plan numbers',
      '',
      '| Factor | Was | Now |',
      '| --- | --- | --- |',
    )
    for (const c of post.changes)
      lines.push(`| ${cell(c.label)} | ${cell(c.from)} | ${cell(c.to)} |`)
    lines.push('')
  }
  if (post.additions.length) {
    lines.push('### Elements to add', '')
    for (const a of post.additions) {
      const kind = ADDITION_KINDS.find((k) => k.id === a.kind)?.label ?? a.kind
      lines.push(
        `- **${kind}: ${a.title}**${a.note ? `: ${a.note.replace(/\n+/g, ' ')}` : ''}${a.source ? ` _(from ${a.source})_` : ''}`,
      )
      if (a.prompt)
        lines.push(`  - Art prompt: ${a.prompt.replace(/\n+/g, ' ')}`)
    }
    lines.push('')
  }
  if (post.combos) lines.push(`**Openings and endings:** ${post.combos}`, '')
  lines.push(
    '---',
    `_Posted by ${by} from the Playbook Forge ledger (\`${post.slug}\`). Agents: fold this into the Conductor plan for the project before building._`,
  )
  return lines.join('\n')
}
