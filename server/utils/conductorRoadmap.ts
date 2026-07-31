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

export function parseRoadmapYaml(text: string): ParsedRoadmap {
  const lines = text.split('\n')
  const result: ParsedRoadmap = {
    name: '',
    kind: 'software',
    goal: undefined,
    milestones: [],
    tasks: [],
    notesFromSilas: undefined,
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index]!
    if (!line.trim() || line.trim().startsWith('#')) {
      index += 1
      continue
    }

    const scalar = line.match(/^(project|kind):\s*(.+)$/)
    if (scalar) {
      const value = scalar[2]!.replace(/^["']|["']$/g, '').trim()
      if (scalar[1] === 'project') result.name = value
      else result.kind = value
      index += 1
      continue
    }

    const blockMatch = line.match(/^(goal|notes_from_silas):\s*[>|]\s*$/)
    if (blockMatch?.[1]) {
      const buffer: string[] = []
      index += 1
      while (
        index < lines.length &&
        (lines[index]!.startsWith('  ') || lines[index] === '')
      ) {
        buffer.push(lines[index]!.replace(/^ {2}/, ''))
        index += 1
      }
      const value = buffer.join('\n').trim()
      if (blockMatch[1] === 'goal') result.goal = value || undefined
      else result.notesFromSilas = value || undefined
      continue
    }

    if (/^milestones:/.test(line)) {
      index += 1
      while (index < lines.length && /^ {2}- /.test(lines[index]!)) {
        const milestone: Record<string, unknown> = {}
        parseBlockItem(lines[index]!, milestone)
        index += 1
        while (index < lines.length && /^ {4}/.test(lines[index]!)) {
          parseKV(lines[index]!.trim(), milestone)
          index += 1
        }
        if (milestone.id) {
          result.milestones.push({
            id: String(milestone.id),
            title: String(milestone.title || milestone.id),
            weight: Number(milestone.weight) || 10,
            status: String(milestone.status || 'not-started'),
          })
        }
      }
      continue
    }

    if (/^tasks:/.test(line)) {
      index += 1
      while (index < lines.length && /^ {2}- /.test(lines[index]!)) {
        const task: Record<string, unknown> = {}
        parseBlockItem(lines[index]!, task)
        index += 1
        while (index < lines.length && /^ {4}/.test(lines[index]!)) {
          const taskLine = lines[index]!
          const blockScalar = taskLine.match(/^ {4}([\w-]+):\s*[>|]\s*$/)
          if (blockScalar?.[1]) {
            const key = blockScalar[1].replace(
              /-([a-z])/g,
              (_, letter: string) => letter.toUpperCase(),
            )
            index += 1
            const buffer: string[] = []
            while (index < lines.length && /^ {6}/.test(lines[index]!)) {
              buffer.push(lines[index]!.replace(/^ {6}/, '').trimEnd())
              index += 1
            }
            task[key] = buffer.join(' ').trim()
            continue
          }
          if (/^ {4}depends_on:\s*$/.test(taskLine)) {
            index += 1
            const items: string[] = []
            while (index < lines.length && /^ {6}- /.test(lines[index]!)) {
              items.push(lines[index]!.replace(/^ {6}- /, '').trim())
              index += 1
            }
            task.dependsOn = items
            continue
          }
          parseKV(taskLine.trim(), task)
          index += 1
        }

        if (task.id) {
          const rawDependsOn = task.dependsOn ?? task.depends_on
          result.tasks.push({
            id: String(task.id),
            milestone: String(task.milestone || ''),
            title: String(task.title || task.id),
            status: String(task.status || 'ready'),
            owner:
              task.owner === 'null' || task.owner == null
                ? null
                : String(task.owner),
            passes: Number(task.passes) || 0,
            stakes: task.stakes ? String(task.stakes) : undefined,
            gateHuman:
              task.gateHuman === 'true' ||
              task.gateHuman === true ||
              task.gate_human === 'true' ||
              task.gate_human === true,
            note: task.note ? String(task.note) : undefined,
            dependsOn: Array.isArray(rawDependsOn)
              ? rawDependsOn.map(String)
              : rawDependsOn
                ? String(rawDependsOn)
                : null,
            approvedByHuman:
              task.approvedByHuman === 'true' ||
              task.approvedByHuman === true ||
              task.approved_by_human === 'true' ||
              task.approved_by_human === true,
            updated: task.updated ? String(task.updated) : null,
          })
        }
      }
      continue
    }

    index += 1
  }

  return result
}

function parseBlockItem(line: string, target: Record<string, unknown>) {
  parseKV(line.replace(/^ {2}- /, '').trim(), target)
}

function parseKV(raw: string, target: Record<string, unknown>) {
  const match = raw.match(/^([\w-]+):\s*(.*)$/)
  if (!match?.[1]) return
  const key = match[1].replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  )
  target[key] = (match[2] ?? '').replace(/^["']|["']$/g, '').trim()
}
