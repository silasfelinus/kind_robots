// server/api/conductor/projects.get.ts
// Conductor's project-overrides.yaml is the lifecycle registry; roadmap.yaml is
// the task/progress source. This endpoint joins both without inventing projects
// from every historical directory in the repository.
import { createError, defineEventHandler, setHeader } from 'h3'
import {
  conductorPriorityToProjectPriority,
  conductorStatusToProjectStatus,
  parseConductorProjectOverrides,
  type ConductorProjectPriority,
  type ConductorProjectStatus,
  type ProjectLifecyclePriority,
  type ProjectLifecycleStatus,
} from '@/server/utils/conductorProjectRegistry'
import {
  computeProgress,
  parseRoadmapYaml,
  type ConductorMilestone,
  type ConductorTask,
  type ParsedRoadmap,
} from '@/server/utils/conductorRoadmap'

const GITHUB_API = 'https://api.github.com'
const OWNER = 'silasfelinus'
const REPO = 'conductor'
const CONDUCTOR_RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main`
const PROJECT_IMAGE_BASE = `${CONDUCTOR_RAW_BASE}/projects/images`

// Re-exported so existing consumers keep importing these from the endpoint
// module they already reference (conductor-page.vue, the gallery pages).
export type { ConductorMilestone, ConductorTask }

export interface ConductorProjectAssets {
  imagePath: string
  cardPath: string
  heroPath: string
}

export interface ConductorProject {
  slug: string
  name: string
  kind: string
  status?: ProjectLifecycleStatus
  priority?: ProjectLifecyclePriority
  conductorStatus?: ConductorProjectStatus
  conductorPriority?: ConductorProjectPriority
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
      status = line
        .replace(/^status:\s*/, '')
        .replace(/#.*/, '')
        .trim()
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

    if (!overrideFile.content)
      throw new Error('project-overrides.yaml is empty')
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
          let parsed: ParsedRoadmap = {
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
            progress: computeProgress(parsed.milestones, parsed.tasks),
            ...conductorProjectAssets(override.slug, imageShas),
            ...(parsed.notesFromSilas
              ? { notesFromSilas: parsed.notesFromSilas }
              : {}),
            ...(parsed.goal ? { goal: parsed.goal } : {}),
            ...(override.liveUrl ? { liveUrl: override.liveUrl } : {}),
            ...(override.channelKey ? { channelKey: override.channelKey } : {}),
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
