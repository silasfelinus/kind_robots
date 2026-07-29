// server/api/conductor/projects.get.ts
// Conductor's project-overrides.yaml is the lifecycle registry; roadmap.yaml is
// the task/progress source. This endpoint joins both without inventing projects
// from every historical directory in the repository.
import { createError, defineEventHandler, setHeader } from 'h3'
import {
  conductorPriorityToProjectPriority,
  conductorStatusToProjectStatus,
  parseConductorProjectOverrides,
  type ConductorProjectKind,
  type ConductorProjectPriority,
  type ConductorProjectStatus,
  type ProjectLifecyclePriority,
  type ProjectLifecycleStatus,
} from '@/server/utils/conductorProjectRegistry'

const GITHUB_API = 'https://api.github.com'
const OWNER = 'silasfelinus'
const REPO = 'conductor'
const CONDUCTOR_RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main`
const PROJECT_IMAGE_BASE = `${CONDUCTOR_RAW_BASE}/projects/images`

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

export interface ConductorProjectAssets {
  imagePath: string
  cardPath: string
  heroPath: string
}

export interface ConductorProject {
  slug: string
  name: string
  kind: string
  status: ProjectLifecycleStatus
  priority: ProjectLifecyclePriority
  conductorStatus: ConductorProjectStatus
  conductorPriority: ConductorProjectPriority
  milestones: ConductorMilestone[]
  tasks: ConductorTask[]
  progress: number
  imagePath: string
  cardPath: string
  heroPath: string
  notesFromSilas?: string
  goal?: string
  liveUrl?: string
  channelKey?: string
  tabKey?: string
  repoUrl?: string
}

export interface ConductorPitch {
  slug: string
  date: string
  title: string
  status: string
  projectTarget: string
  idea: string
  whyDoIt: string
  effort: string
}

export interface ConductorData {
  projects: ConductorProject[]
  pitches: ConductorPitch[]
  fetchedAt: string
  registryCount: number
}

type GithubContentEntry = {
  name: string
  type: string
  sha?: string
  content?: string
}

async function githubFetch(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'kind-robots-workspace/2.0',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    },
  )
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json()
}

function b64decode(b64: string): string {
  return Buffer.from(b64.replace(/\n/g, ''), 'base64').toString('utf-8')
}

function versionedImageUrl(
  filename: string,
  imageShas: ReadonlyMap<string, string>,
): string {
  const base = `${PROJECT_IMAGE_BASE}/${filename}`
  const sha = imageShas.get(filename)
  return sha ? `${base}?v=${sha.slice(0, 12)}` : base
}

function conductorProjectAssets(
  slug: string,
  imageShas: ReadonlyMap<string, string>,
): ConductorProjectAssets {
  return {
    imagePath: versionedImageUrl(`${slug}-icon.webp`, imageShas),
    cardPath: versionedImageUrl(`${slug}-card.webp`, imageShas),
    heroPath: versionedImageUrl(`${slug}-hero.webp`, imageShas),
  }
}

function computeProgress(milestones: ConductorMilestone[]): number {
  if (!milestones.length) return 0
  let total = 0
  let done = 0
  for (const milestone of milestones) {
    total += milestone.weight
    if (milestone.status === 'done') done += milestone.weight
    else if (milestone.status === 'in-progress') done += milestone.weight * 0.5
  }
  return total > 0 ? Math.round((done / total) * 100) : 0
}

function parseRoadmapYaml(text: string) {
  const lines = text.split('\n')
  const result = {
    name: '',
    kind: 'software',
    goal: undefined as string | undefined,
    milestones: [] as ConductorMilestone[],
    tasks: [] as ConductorTask[],
    notesFromSilas: undefined as string | undefined,
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
        buffer.push(lines[index]!.replace(/^  /, ''))
        index += 1
      }
      const value = buffer.join('\n').trim()
      if (blockMatch[1] === 'goal') result.goal = value || undefined
      else result.notesFromSilas = value || undefined
      continue
    }

    if (/^milestones:/.test(line)) {
      index += 1
      while (index < lines.length && /^  - /.test(lines[index]!)) {
        const milestone: Record<string, unknown> = {}
        parseBlockItem(lines[index]!, milestone)
        index += 1
        while (index < lines.length && /^    /.test(lines[index]!)) {
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
      while (index < lines.length && /^  - /.test(lines[index]!)) {
        const task: Record<string, unknown> = {}
        parseBlockItem(lines[index]!, task)
        index += 1
        while (index < lines.length && /^    /.test(lines[index]!)) {
          const taskLine = lines[index]!
          const blockScalar = taskLine.match(/^    ([\w-]+):\s*[>|]\s*$/)
          if (blockScalar?.[1]) {
            const key = blockScalar[1].replace(
              /-([a-z])/g,
              (_, letter: string) => letter.toUpperCase(),
            )
            index += 1
            const buffer: string[] = []
            while (index < lines.length && /^      /.test(lines[index]!)) {
              buffer.push(lines[index]!.replace(/^      /, '').trimEnd())
              index += 1
            }
            task[key] = buffer.join(' ').trim()
            continue
          }
          if (/^    depends_on:\s*$/.test(taskLine)) {
            index += 1
            const items: string[] = []
            while (index < lines.length && /^      - /.test(lines[index]!)) {
              items.push(lines[index]!.replace(/^      - /, '').trim())
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
  parseKV(line.replace(/^  - /, '').trim(), target)
}

function parseKV(raw: string, target: Record<string, unknown>) {
  const match = raw.match(/^([\w-]+):\s*(.*)$/)
  if (!match?.[1]) return
  const key = match[1].replace(
    /-([a-z])/g,
    (_, letter: string) => letter.toUpperCase(),
  )
  target[key] = (match[2] ?? '').replace(/^["']|["']$/g, '').trim()
}

function parsePitch(filename: string, text: string): ConductorPitch {
  const date = filename.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] ?? ''
  const slug = filename.replace(/\.md$/, '')
  let title = slug
  let status = 'awaiting-silas'
  let projectTarget = ''
  let idea = ''
  let whyDoIt = ''
  let effort = ''
  let section = ''

  for (const line of text.split('\n')) {
    if (/^#\s*Pitch:/.test(line)) {
      title = line.replace(/^#\s*Pitch:\s*/, '').trim()
      continue
    }
    if (/^project-target:/.test(line)) {
      projectTarget = line.replace(/^project-target:\s*/, '').trim()
      continue
    }
    if (/^status:/.test(line)) {
      status = line.replace(/^status:\s*/, '').replace(/#.*/, '').trim()
      continue
    }
    if (/^##\s*The idea/i.test(line)) section = 'idea'
    else if (/^##\s*Why/i.test(line)) section = 'why'
    else if (/^##\s*Rough effort/i.test(line)) section = 'effort'
    else if (/^##/.test(line)) section = ''
    else if (section === 'idea' && line.trim())
      idea += `${idea ? ' ' : ''}${line.trim()}`
    else if (section === 'why' && line.trim())
      whyDoIt += `${whyDoIt ? ' ' : ''}${line.trim()}`
    else if (section === 'effort' && line.trim()) {
      effort = line.trim()
      section = ''
    }
  }

  return { slug, date, title, status, projectTarget, idea, whyDoIt, effort }
}

export default defineEventHandler(async (event): Promise<ConductorData> => {
  try {
    const [overrideFile, pitchesDir, imagesDir] = await Promise.all([
      githubFetch('project-overrides.yaml') as Promise<GithubContentEntry>,
      githubFetch('pitches') as Promise<GithubContentEntry[]>,
      githubFetch('projects/images') as Promise<GithubContentEntry[]>,
    ])

    if (!overrideFile.content) throw new Error('project-overrides.yaml is empty')
    const registry = parseConductorProjectOverrides(
      b64decode(overrideFile.content),
    )
    const imageShas = new Map(
      imagesDir
        .filter((entry) => entry.type === 'file' && entry.sha)
        .map((entry) => [entry.name, entry.sha!] as const),
    )
    const pitchFilenames = pitchesDir
      .filter(
        (entry) =>
          entry.type === 'file' &&
          entry.name.endsWith('.md') &&
          entry.name !== 'README.md',
      )
      .map((entry) => entry.name)

    const [rawProjects, rawPitches] = await Promise.all([
      Promise.all(
        registry.map(async (override) => {
          let parsed: ReturnType<typeof parseRoadmapYaml> = {
            name: '',
            kind: override.kind || 'software',
            goal: undefined,
            milestones: [],
            tasks: [],
            notesFromSilas: undefined,
          }
          try {
            const file = (await githubFetch(
              `projects/${override.slug}/roadmap.yaml`,
            )) as GithubContentEntry
            if (file.content) parsed = parseRoadmapYaml(b64decode(file.content))
          } catch {
            // A lifecycle entry remains visible even if its historical roadmap
            // is absent; the registry, not directory existence, defines projects.
          }

          return {
            slug: override.slug,
            name: parsed.name || override.slug,
            kind: override.kind || parsed.kind || 'software',
            status: conductorStatusToProjectStatus(override.status),
            priority: conductorPriorityToProjectPriority(override.priority),
            conductorStatus: override.status,
            conductorPriority: override.priority,
            milestones: parsed.milestones,
            tasks: parsed.tasks,
            progress: computeProgress(parsed.milestones),
            ...conductorProjectAssets(override.slug, imageShas),
            ...(parsed.notesFromSilas
              ? { notesFromSilas: parsed.notesFromSilas }
              : {}),
            ...(parsed.goal ? { goal: parsed.goal } : {}),
            ...(override.liveUrl ? { liveUrl: override.liveUrl } : {}),
            ...(override.channelKey
              ? { channelKey: override.channelKey }
              : {}),
            ...(override.tabKey ? { tabKey: override.tabKey } : {}),
            ...(override.repoUrl ? { repoUrl: override.repoUrl } : {}),
          } satisfies ConductorProject
        }),
      ),
      Promise.all(
        pitchFilenames.map(async (filename) => {
          try {
            const file = (await githubFetch(
              `pitches/${filename}`,
            )) as GithubContentEntry
            return file.content
              ? parsePitch(filename, b64decode(file.content))
              : null
          } catch {
            return null
          }
        }),
      ),
    ])

    setHeader(
      event,
      'Cache-Control',
      'private, max-age=15, stale-while-revalidate=45',
    )
    return {
      projects: rawProjects,
      pitches: rawPitches.filter(
        (pitch): pitch is ConductorPitch => pitch !== null,
      ),
      fetchedAt: new Date().toISOString(),
      registryCount: registry.length,
    }
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: `Conductor fetch failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    })
  }
})
