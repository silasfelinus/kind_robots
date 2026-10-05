// /utils/comicEditor.ts
//
// The Comic Studio's adversarial editor (comic-creator/t-017). Silas, 2026-10-03:
// "If I am proposing an idea, they need to only accept something if it is GREAT ...
// I need a challenging muse that will actually test the ideas we are presenting."
//
// This file holds the editor's standards, the JSON shape of a verdict, and the
// validation of what the model returns. The model call itself lives in
// server/utils/comicEditor.ts.
//
// Pure: no Prisma, no h3, no app aliases.

export const COMIC_EDITOR_VERDICTS = [
  'great',
  'close',
  'not-yet',
  'reject',
] as const
export type ComicEditorVerdict = (typeof COMIC_EDITOR_VERDICTS)[number]

export const COMIC_EDITOR_AREAS = [
  'plot',
  'character',
  'theme',
  'world',
  'visual',
  'pacing',
  'continuity',
  'originality',
] as const
export type ComicEditorArea = (typeof COMIC_EDITOR_AREAS)[number]

export const COMIC_EDITOR_TARGETS = [
  'pitch',
  'series',
  'entity',
  'slot',
  'issue',
] as const
export type ComicEditorTarget = (typeof COMIC_EDITOR_TARGETS)[number]

export type ComicEditorProblem = {
  area: ComicEditorArea
  severity: 'high' | 'medium' | 'low'
  issue: string
}

export type ComicEditorCritique = {
  verdict: ComicEditorVerdict
  headline: string
  strengths: string[]
  problems: ComicEditorProblem[]
  questions: string[]
  bar: string
}

export const COMIC_EDITOR_MODEL = 'claude-opus-5-5'

export const COMIC_EDITOR_SYSTEM = `You are the editor of a creator-owned comic. Your job is to make it great, and the only way you know to do that is to refuse anything that is merely good.

The series notes you are given are the creator's own statement of the book's tone, influences and rules. Hold every idea to them. When the notes and an idea disagree, say so.

How you judge:
- Accept only what is GREAT: specific, surprising, earned, true to the characters, and something a reader would remember a week later. "Great" should be rare. When in doubt, it is not great.
- "close" means one decisive change would make it great; name that change.
- "not-yet" means the idea has a live core but its execution or logic does not hold.
- "reject" means it is generic, clichéd, contradicts what is established, or undercuts the book's tone.
- Test plot (causality, stakes, escalation, payoff), character (motive, agency, consistency, change), theme (what the book is about underneath, and whether this deepens it), world (rules and texture, the thin reality used with intent), visual storytelling (can it be drawn, does it work as panels without words), pacing (action carrying the story, silence used deliberately), continuity (against everything already established) and originality (familiar beats must be twisted, not borrowed whole).
- Hunt for exposition, coincidence, convenience, borrowed tropes played straight, villains with no motive, children used as props, and twists that leak too early. Anything marked secret must not be hinted before its reveal.
- Praise only what is genuinely strong, briefly. Never flatter. Never soften a verdict to be kind.
- Be concrete. Quote the weak line or beat. Every problem must be specific enough to act on.
- Ask the hard questions the idea has not answered yet.
- End with the bar: what a great version of this would do, in one or two sentences. Push; do not write it for them.

You are talking to the book's creator. Be blunt, respectful, and brief.`

export const COMIC_EDITOR_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'verdict',
    'headline',
    'strengths',
    'problems',
    'questions',
    'bar',
  ],
  properties: {
    verdict: { type: 'string', enum: [...COMIC_EDITOR_VERDICTS] },
    headline: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    problems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'severity', 'issue'],
        properties: {
          area: { type: 'string', enum: [...COMIC_EDITOR_AREAS] },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          issue: { type: 'string' },
        },
      },
    },
    questions: { type: 'array', items: { type: 'string' } },
    bar: { type: 'string' },
  },
}

function cleanList(value: unknown, max: number, length = 600): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) =>
      typeof item === 'string' ? item.trim().slice(0, length) : '',
    )
    .filter(Boolean)
    .slice(0, max)
}

export function normalizeComicEditorCritique(
  raw: unknown,
): ComicEditorCritique | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const verdict = COMIC_EDITOR_VERDICTS.find(
    (value) => value === record.verdict,
  )
  const headline =
    typeof record.headline === 'string'
      ? record.headline.trim().slice(0, 500)
      : ''
  if (!verdict || !headline) return null
  const problems: ComicEditorProblem[] = Array.isArray(record.problems)
    ? record.problems
        .map((item) => {
          const problem = (item ?? {}) as Record<string, unknown>
          const area =
            COMIC_EDITOR_AREAS.find((value) => value === problem.area) ?? 'plot'
          const severity =
            problem.severity === 'high' || problem.severity === 'low'
              ? problem.severity
              : 'medium'
          const issue =
            typeof problem.issue === 'string'
              ? problem.issue.trim().slice(0, 800)
              : ''
          return { area, severity, issue } as ComicEditorProblem
        })
        .filter((problem) => problem.issue)
        .slice(0, 12)
    : []
  return {
    verdict,
    headline,
    strengths: cleanList(record.strengths, 6),
    problems,
    questions: cleanList(record.questions, 8),
    bar: typeof record.bar === 'string' ? record.bar.trim().slice(0, 800) : '',
  }
}

export type ComicEditorContext = {
  seriesTitle: string
  seriesNotes: string | null
  style: string | null
  entities: Array<{
    name: string
    kind: string
    notes: string | null
    secretUntil: string | null
  }>
  issues: Array<{ number: number; title: string; notes: string | null }>
  recent: Array<{
    verdict: string
    headline: string
    targetName: string | null
  }>
}

export function composeComicEditorRequest(input: {
  context: ComicEditorContext
  targetLabel: string
  material: string
  thread?: Array<{ role: 'editor' | 'creator'; text: string }>
}): string {
  const { context } = input
  const entities = context.entities
    .map((entity) => {
      const secret = entity.secretUntil
        ? ` [SECRET until ${entity.secretUntil}]`
        : ''
      return `### ${entity.name} (${entity.kind})${secret}\n${entity.notes?.trim() || '(no notes yet)'}`
    })
    .join('\n\n')
  const issues = context.issues
    .map(
      (issue) =>
        `### Issue ${issue.number}: ${issue.title}\n${issue.notes?.trim() || '(no notes yet)'}`,
    )
    .join('\n\n')
  const recent = context.recent
    .map(
      (item) =>
        `- ${item.verdict.toUpperCase()}${item.targetName ? ` (${item.targetName})` : ''}: ${item.headline}`,
    )
    .join('\n')
  const thread = (input.thread ?? [])
    .map(
      (turn) =>
        `${turn.role === 'editor' ? 'EDITOR' : 'CREATOR'}: ${turn.text}`,
    )
    .join('\n\n')
  return [
    `# What is established in "${context.seriesTitle}"`,
    context.seriesNotes?.trim() || '(no series notes yet)',
    context.style?.trim() ? `## Visual style\n${context.style.trim()}` : '',
    entities ? `## Cast, factions, places\n${entities}` : '',
    issues ? `## Issues\n${issues}` : '',
    recent
      ? `## Your recent verdicts (stay consistent, do not repeat yourself)\n${recent}`
      : '',
    thread ? `## The argument so far\n${thread}` : '',
    `# Judge this: ${input.targetLabel}`,
    input.material.trim(),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function comicEditorCritiqueText(critique: ComicEditorCritique): string {
  const lines = [`${critique.verdict.toUpperCase()}: ${critique.headline}`]
  for (const problem of critique.problems)
    lines.push(`- (${problem.area}, ${problem.severity}) ${problem.issue}`)
  if (critique.bar) lines.push(`Bar: ${critique.bar}`)
  return lines.join('\n')
}

export const COMIC_EDITOR_MIN_CHANGE = 40

export function comicNotesChangedEnough(
  before: string | null,
  after: string | null,
): boolean {
  const a = (before ?? '').trim()
  const b = (after ?? '').trim()
  if (!b) return false
  if (Math.abs(b.length - a.length) >= COMIC_EDITOR_MIN_CHANGE) return true
  let diff = 0
  const length = Math.max(a.length, b.length)
  for (
    let index = 0;
    index < length && diff < COMIC_EDITOR_MIN_CHANGE;
    index += 1
  ) {
    if (a[index] !== b[index]) diff += 1
  }
  return diff >= COMIC_EDITOR_MIN_CHANGE
}
