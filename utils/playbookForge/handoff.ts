import { FACTOR_ROWS, displayValue } from './factors'
import { checkpointClass } from './calibration'
import { formatCount, formatDuration } from './estimate'
import { sparkLines } from './facets'
import type { Blueprint, Forecast } from './types'

// What the forge sends to Conductor: a readable summary for the agent and
// Silas, then the exact blueprint as JSON between markers that
// scripts/new_playbook.py --blueprint reads.

export const BLUEPRINT_START = '<!-- playbook-blueprint -->'
export const BLUEPRINT_END = '<!-- /playbook-blueprint -->'

export type PlanChange = {
  key: keyof Blueprint
  label: string
  from: string
  to: string
}

export function planDiff(before: Blueprint, after: Blueprint): PlanChange[] {
  return FACTOR_ROWS.filter((row) => before[row.key] !== after[row.key]).map(
    (row) => ({
      key: row.key,
      label: row.label,
      from: displayValue(row, before),
      to: displayValue(row, after),
    }),
  )
}

function forecastLines(f: Forecast, b: Blueprint): string[] {
  return [
    `Tier: ${f.tier ?? 'over every cap'}${f.overBudget.length ? ` (over: ${f.overBudget.join(', ')})` : ''}`,
    `Images: ${f.totalImages} on ${checkpointClass(b.checkpoint).label}, about ${formatDuration(f.renderSeconds)} of render time`,
    `Words: about ${formatCount(f.totalWords)}`,
    `Agent sessions: about ${f.sessions}; seeded QA playthroughs: ${f.qaRuns}`,
    ...f.notes.map((note) => `Note: ${note}`),
  ]
}

function blueprintJson(b: Blueprint): string {
  return [
    BLUEPRINT_START,
    '```json',
    JSON.stringify(b, null, 2),
    '```',
    BLUEPRINT_END,
  ].join('\n')
}

/** Project.pitch for a new playbook; the scaffold Todo carries it to Conductor. */
export function blueprintPitch(b: Blueprint, f: Forecast): string {
  return [
    `${b.title}: a playbook forged in /admin/playbook-forge.`,
    b.idea,
    '',
    ...sparkLines(b.sparks ?? []),
    '',
    ...(b.designs?.length
      ? [
          'Designs (authored art prompts):',
          ...b.designs.map(
            (d) =>
              `- ${d.kind}: ${d.title}${d.prompt ? ` — ${d.prompt}` : ' — prompt to write'}`,
          ),
          '',
        ]
      : []),
    `Start it with: python scripts/new_playbook.py ${b.slug} "${b.title}" --blueprint <this pitch>`,
    `then in kind_robots: npm run playbook:new -- ${b.slug} "${b.title}"`,
    '',
    ...forecastLines(f, b),
    '',
    blueprintJson(b),
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')
}

/** Todo description for a revised plan on an existing playbook. */
export function blueprintBrief(
  b: Blueprint,
  f: Forecast,
  changes: PlanChange[],
): string {
  return [
    `Silas revised the plan for ${b.title} (${b.slug}) in the Playbook Forge.`,
    'Update the project roadmap goal and tasks in Conductor to match, then build toward it.',
    '',
    changes.length
      ? 'Changes:'
      : 'No factor changed; re-confirm the plan as it stands.',
    ...changes.map((c) => `- ${c.label}: ${c.from} → ${c.to}`),
    '',
    'Forecast for the revised plan:',
    ...forecastLines(f, b),
    '',
    blueprintJson(b),
  ].join('\n')
}

/** Reads a blueprint back out of a pitch or Todo description. */
export function parseBlueprint(text: string): Blueprint | null {
  const start = text.indexOf(BLUEPRINT_START)
  const end = text.indexOf(BLUEPRINT_END, start)
  if (start < 0 || end < 0) return null
  const body = text
    .slice(start + BLUEPRINT_START.length, end)
    .replace(/```json|```/g, '')
    .trim()
  try {
    const parsed: unknown = JSON.parse(body)
    return parsed && typeof parsed === 'object' ? (parsed as Blueprint) : null
  } catch {
    return null
  }
}
