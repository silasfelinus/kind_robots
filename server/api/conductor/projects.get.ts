// server/api/conductor/projects.get.ts
// Fetches Conductor project data (roadmaps + pitches) from GitHub and returns parsed JSON.
import { defineEventHandler, createError } from 'h3'

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
  milestones: ConductorMilestone[]
  tasks: ConductorTask[]
  progress: number
  imagePath: string
  cardPath: string
  heroPath: string
  notesFromSilas?: string
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
}

async function githubFetch(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'kind-robots-workspace/1.0',
      ...(token ? { Authorization: `token ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`)
  return res.json()
}

function b64decode(b64: string): string {
  return Buffer.from(b64.replace(/\n/g, ''), 'base64').toString('utf-8')
}

function conductorProjectAssets(slug: string): ConductorProjectAssets {
  return {
    imagePath: `${PROJECT_IMAGE_BASE}/${slug}-icon.webp`,
    cardPath: `${PROJECT_IMAGE_BASE}/${slug}-card.webp`,
    heroPath: `${PROJECT_IMAGE_BASE}/${slug}-hero.webp`,
  }
}

function computeProgress(milestones: ConductorMilestone[]): number {
  if (!milestones.length) return 0
  let total = 0
  let done = 0
  for (const m of milestones) {
    total += m.weight
    if (m.status === 'done') done += m.weight
    else if (m.status === 'in-progress') done += m.weight * 0.5
  }
  return total > 0 ? Math.round((done / total) * 100) : 0
}

function parseRoadmapYaml(text: string): Omit<ConductorProject, 'slug' | 'progress' | keyof ConductorProjectAssets> {
  const lines = text.split('\n')
  const result = {
    name: '',
    kind: 'software',
    milestones: [] as ConductorMilestone[],
    tasks: [] as ConductorTask[],
    notesFromSilas: undefined as string | undefined,
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]!

    if (!line.trim() || line.trim().startsWith('#')) { i++; continue }

    const scalar = line.match(/^(project|kind):\s*(.+)$/)
    if (scalar) {
      const val = scalar[2]!.replace(/^["']|["']$/g, '').trim()
      if (scalar[1] === 'project') result.name = val
      else result.kind = val
      i++; continue
    }

    if (/^notes_from_silas:\s*\|/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && (lines[i]!.startsWith('  ') || lines[i] === '')) {
        buf.push(lines[i]!.replace(/^  /, ''))
        i++
      }
      result.notesFromSilas = buf.join('\n').trim()
      continue
    }

    if (/^milestones:/.test(line)) {
      i++
      while (i < lines.length && /^  - /.test(lines[i]!)) {
        const m: Partial<ConductorMilestone> = {}
        parseBlockItem(lines, i, m as Record<string, unknown>)
        i++
        while (i < lines.length && /^    /.test(lines[i]!)) {
          parseKV(lines[i]!.trim(), m as Record<string, unknown>)
          i++
        }
        if (m.id) {
          result.milestones.push({
            id: m.id as string,
            title: (m.title as string) || (m.id as string),
            weight: Number(m.weight) || 10,
            status: (m.status as string) || 'not-started',
          })
        }
      }
      continue
    }

    if (/^tasks:/.test(line)) {
      i++
      while (i < lines.length && /^  - /.test(lines[i]!)) {
        const t: Record<string, unknown> = {}
        parseBlockItem(lines, i, t)
        i++
        while (i < lines.length && /^    /.test(lines[i]!)) {
          const tline = lines[i]!
          // Block scalar (note: > or note: |) — capture content instead of skipping
          const blockScalarMatch = tline.match(/^    ([\w-]+):\s*[>|]\s*$/)
          if (blockScalarMatch) {
            const rawKey = blockScalarMatch[1]!
            const camelKey = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
            i++
            const buf: string[] = []
            while (i < lines.length && /^      /.test(lines[i]!)) {
              buf.push(lines[i]!.replace(/^      /, '').trimEnd())
              i++
            }
            t[camelKey] = buf.join(' ').trim()
            continue
          }
          // Block sequence for depends_on: followed by - items
          if (/^    depends_on:\s*$/.test(tline)) {
            i++
            const items: string[] = []
            while (i < lines.length && /^      - /.test(lines[i]!)) {
              items.push(lines[i]!.replace(/^      - /, '').trim())
              i++
            }
            t['dependsOn'] = items
            continue
          }
          parseKV(tline.trim(), t)
          i++
        }
        if (t['id']) {
          const rawDependsOn = t['dependsOn'] ?? t['depends_on']
          const dependsOn: string | string[] | null =
            Array.isArray(rawDependsOn)
              ? rawDependsOn
              : typeof rawDependsOn === 'string' && rawDependsOn
                ? rawDependsOn
                : null
          result.tasks.push({
            id: t['id'] as string,
            milestone: (t['milestone'] as string) || '',
            title: (t['title'] as string) || (t['id'] as string),
            status: (t['status'] as string) || 'ready',
            owner: t['owner'] === 'null' || t['owner'] == null ? null : (t['owner'] as string),
            passes: Number(t['passes']) || 0,
            stakes: t['stakes'] as string | undefined,
            gateHuman: t['gateHuman'] === 'true' || t['gateHuman'] === true || t['gate_human'] === 'true' || t['gate_human'] === true,
            note: t['note'] as string | undefined,
            dependsOn,
            approvedByHuman: t['approvedByHuman'] === 'true' || t['approvedByHuman'] === true || t['approved_by_human'] === 'true' || t['approved_by_human'] === true,
            updated: (t['updated'] as string | null | undefined) ?? null,
          })
        }
      }
      continue
    }

    i++
  }

  return result
}

function parseBlockItem(lines: string[], i: number, obj: Record<string, unknown>) {
  const first = lines[i]!.replace(/^  - /, '').trim()
  parseKV(first, obj)
}

function parseKV(raw: string, obj: Record<string, unknown>) {
  const m = raw.match(/^([\w-]+):\s*(.*)$/)
  if (!m) return
  const key = m[1]!.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  const val = m[2]!.replace(/^["']|["']$/g, '').trim()
  obj[key] = val
}

function parsePitch(filename: string, text: string): ConductorPitch {
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/)
  const date = dateMatch?.[1] ?? ''
  const slug = filename.replace(/\.md$/, '')

  let title = slug
  let status = 'awaiting-silas'
  let projectTarget = ''
  let idea = ''
  let whyDoIt = ''
  let effort = ''
  let section = ''

  for (const line of text.split('\n')) {
    if (/^#\s*Pitch:/.test(line)) { title = line.replace(/^#\s*Pitch:\s*/, '').trim(); continue }
    if (/^project-target:/.test(line)) { projectTarget = line.replace(/^project-target:\s*/, '').trim(); continue }
    if (/^status:/.test(line)) { status = line.replace(/^status:\s*/, '').replace(/#.*/, '').trim(); continue }
    if (/^##\s*The idea/i.test(line)) { section = 'idea'; continue }
    if (/^##\s*Why/i.test(line)) { section = 'why'; continue }
    if (/^##\s*Rough effort/i.test(line)) { section = 'effort'; continue }
    if (/^##/.test(line)) { section = ''; continue }
    if (section === 'idea' && line.trim()) idea += (idea ? ' ' : '') + line.trim()
    else if (section === 'why' && line.trim()) whyDoIt += (whyDoIt ? ' ' : '') + line.trim()
    else if (section === 'effort' && line.trim()) { effort = line.trim(); section = '' }
  }

  return { slug, date, title, status, projectTarget, idea, whyDoIt, effort }
}

export default defineEventHandler(async (): Promise<ConductorData> => {
  try {
    const [projectsDir, pitchesDir] = await Promise.all([
      githubFetch('projects') as Promise<Array<{ name: string; type: string }>>,
      githubFetch('pitches') as Promise<Array<{ name: string; type: string }>>,
    ])

    const projectSlugs = projectsDir
      .filter((e) => e.type === 'dir' && !e.name.startsWith('_'))
      .map((e) => e.name)

    const pitchFilenames = pitchesDir
      .filter((e) => e.type === 'file' && e.name.endsWith('.md') && e.name !== 'README.md')
      .map((e) => e.name)

    const [rawProjects, rawPitches] = await Promise.all([
      Promise.all(
        projectSlugs.map(async (slug) => {
          try {
            const file = (await githubFetch(`projects/${slug}/roadmap.yaml`)) as { content?: string }
            if (!file.content) return null
            const parsed = parseRoadmapYaml(b64decode(file.content))
            return {
              slug,
              ...parsed,
              ...conductorProjectAssets(slug),
              name: parsed.name || slug,
              progress: computeProgress(parsed.milestones),
            } satisfies ConductorProject
          } catch {
            return null
          }
        }),
      ),
      Promise.all(
        pitchFilenames.map(async (filename) => {
          try {
            const file = (await githubFetch(`pitches/${filename}`)) as { content?: string }
            if (!file.content) return null
            return parsePitch(filename, b64decode(file.content))
          } catch {
            return null
          }
        }),
      ),
    ])

    return {
      projects: rawProjects.filter((p): p is ConductorProject => p !== null),
      pitches: rawPitches.filter((p): p is ConductorPitch => p !== null),
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: `Conductor fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})
