// /server/utils/conductorRoadmap.ts
//
// Parsing and progress math for conductor's projects/<slug>/roadmap.yaml.
// Extracted from server/api/conductor/projects.get.ts so the logic is
// importable by a standalone verifier (utils/scripts/verifyConductorProgressParity.ts)
// without dragging in h3 or the Nuxt alias resolver.
//
// The progress formula here is the mirror of conductor's
// scripts/build_status.py::compute_progress. Both surfaces must agree: this
// endpoint is the only thing the workspace reads, so any divergence shows up
// as a project sitting at 0% on the site while conductor's STATUS.md reports
// it complete.

import { parse as parseYaml } from 'yaml'

export interface ConductorMilestone {
  id: string
  title: string
  weight: number
  status: string
}

export interface ConductorTask {
  id: string
  milestone: string
  title: string
  status: string
  owner: string | null
  passes: number
  stakes?: string
  gateHuman: boolean
  note?: string
  dependsOn?: string | string[] | null
  approvedByHuman?: boolean
  updated?: string | null
}

export interface ParsedRoadmap {
  name: string
  kind: string
  goal: string | undefined
  milestones: ConductorMilestone[]
  tasks: ConductorTask[]
  notesFromSilas: string | undefined
}

export function computeProgress(
  milestones: ConductorMilestone[],
  tasks: ConductorTask[] = [],
): number {
  let total = 0
  let done = 0
  for (const milestone of milestones) {
    total += milestone.weight
    if (milestone.status === 'done') done += milestone.weight
    else if (milestone.status === 'in-progress') done += milestone.weight * 0.5
  }
  if (total > 0 && done > 0) return Math.round((done / total) * 100)

  // Milestones are uninformative — either absent, or every one still
  // `not-started`. Agents close tasks reliably but rarely flip milestone
  // status, so a fully-delivered project (davinci, newsfeed, challenge-center:
  // all 100% by task count) would otherwise render as 0%. Fall back to the
  // task-completion ratio, exactly as build_status.py does.
  if (tasks.length) {
    const doneTasks = tasks.filter((task) => task.status === 'done').length
    return Math.round((doneTasks / tasks.length) * 100)
  }
  return 0
}

// Conductor's roadmaps are written by hand, by `yq`, and by PyYAML dumps, so
// they use every legal YAML spelling of the same structure. Parsing them with a
// real parser rather than line regexes is not a refactor for tidiness — the
// previous hand-rolled reader silently returned partial data on three shapes
// that are common in the live repo:
//
//   * blank lines between sequence items (davinci: 1 of 4 milestones, 1 of 16 tasks)
//   * sequences at column 0 rather than indented two spaces (lora-ingestion: 0 of 6 tasks)
//   * double-quoted multi-line scalars instead of `>`/`|` blocks, which PyYAML
//     emits for text containing escapes (challenge-center: 0 of 20 tasks — the
//     reader fell through the quoted `notes_from_silas` and never recovered)
//
// It never threw; it just reported fewer tasks than exist, which reads
// downstream as a smaller, less-complete project. 30 of 44 roadmaps were
// affected.
function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  return text || undefined
}

function bool(value: unknown): boolean {
  return value === true || value === 'true'
}

// Roadmaps use snake_case; the ConductorTask shape this repo exposes is
// camelCase. Accept either spelling on the way in.
function pick(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

function toMilestone(raw: unknown): ConductorMilestone | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const source = raw as Record<string, unknown>
  const id = str(source.id)
  if (!id) return null
  // build_status.py uses `m.get("weight", 10)`, which defaults only when the key
  // is absent. `Number(weight) || 10` instead coerced an explicit `weight: 0`
  // to 10 — brainstorm's sole milestone is `weight: 0, status: in-progress`, so
  // this repo scored it 50% where conductor scored 0%.
  const weight = Number(source.weight)
  return {
    id,
    title: str(source.title) ?? id,
    weight: Number.isFinite(weight) ? weight : 10,
    status: str(source.status) ?? 'not-started',
  }
}

function toTask(raw: unknown): ConductorTask | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const source = raw as Record<string, unknown>
  const id = str(source.id)
  if (!id) return null

  const rawDependsOn = pick(source, 'dependsOn', 'depends_on')
  const owner = str(source.owner)

  return {
    id,
    milestone: str(source.milestone) ?? '',
    title: str(source.title) ?? id,
    status: str(source.status) ?? 'ready',
    // A roadmap may write `owner: null` explicitly; both that and a literal
    // "null" string mean unowned.
    owner: !owner || owner === 'null' ? null : owner,
    passes: Number(source.passes) || 0,
    stakes: str(source.stakes),
    gateHuman: bool(pick(source, 'gateHuman', 'gate_human')),
    note: str(source.note),
    dependsOn: Array.isArray(rawDependsOn)
      ? rawDependsOn.map((entry) => String(entry).trim())
      : (str(rawDependsOn) ?? null),
    approvedByHuman: bool(pick(source, 'approvedByHuman', 'approved_by_human')),
    updated: str(source.updated) ?? null,
  }
}

export function parseRoadmapYaml(text: string): ParsedRoadmap {
  const empty: ParsedRoadmap = {
    name: '',
    kind: 'software',
    goal: undefined,
    milestones: [],
    tasks: [],
    notesFromSilas: undefined,
  }

  let doc: unknown
  try {
    doc = parseYaml(text)
  } catch {
    // A malformed roadmap must not take the whole endpoint down — the caller
    // already treats an unreadable roadmap as an empty one and keeps the
    // project visible from its registry entry alone.
    return empty
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return empty
  const source = doc as Record<string, unknown>

  const milestones = Array.isArray(source.milestones)
    ? source.milestones
        .map(toMilestone)
        .filter((entry): entry is ConductorMilestone => entry !== null)
    : []
  const tasks = Array.isArray(source.tasks)
    ? source.tasks
        .map(toTask)
        .filter((entry): entry is ConductorTask => entry !== null)
    : []

  return {
    name: str(source.project) ?? '',
    kind: str(source.kind) ?? 'software',
    goal: str(source.goal),
    milestones,
    tasks,
    notesFromSilas: str(pick(source, 'notesFromSilas', 'notes_from_silas')),
  }
}
