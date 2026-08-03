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

export type { ConductorMilestone, ConductorTask }

const DEFAULT_SOURCE_REPO = 'silasfelinus/conductor'
const DEFAULT_SOURCE_REF = 'main'
const PROJECT_IMAGE_DIRECTORY = 'projects/images'

export interface ConductorProjectionSnapshot {
  version: 1
  sourceRepo: string
  sourceRef: string
  sourceCommitSha: string
  generatedAt: string
  registryYaml: string
  roadmaps: Record<string, string>
  pitches: Record<string, string>
  imageVersions: Record<string, string>
}

export interface ConductorProjectDisplay {
  title?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  liveUrl?: string | null
  channelKey?: string | null
  tabKey?: string | null
  repoUrl?: string | null
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

export interface ConductorProjectionMeta {
  sourceRepo: string
  sourceRef: string
  sourceCommitSha: string
  generatedAt: string
  syncedAt: string
  status: 'ready' | 'missing'
}

export interface ConductorData {
  projects: ConductorProject[]
  pitches: ConductorPitch[]
  fetchedAt: string
  registryCount: number
  projection: ConductorProjectionMeta
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  )
}

export function assertConductorProjectionSnapshot(
  value: unknown,
): asserts value is ConductorProjectionSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Conductor projection payload must be an object')
  }

  const source = value as Record<string, unknown>
  if (source.version !== 1) {
    throw new Error('Conductor projection version must be 1')
  }
  if (source.sourceRepo !== DEFAULT_SOURCE_REPO) {
    throw new Error(`Conductor projection sourceRepo must be ${DEFAULT_SOURCE_REPO}`)
  }
  if (source.sourceRef !== DEFAULT_SOURCE_REF) {
    throw new Error(`Conductor projection sourceRef must be ${DEFAULT_SOURCE_REF}`)
  }
  if (
    typeof source.sourceCommitSha !== 'string' ||
    !/^[a-f0-9]{7,64}$/i.test(source.sourceCommitSha)
  ) {
    throw new Error('Conductor projection sourceCommitSha is invalid')
  }
  if (
    typeof source.generatedAt !== 'string' ||
    !Number.isFinite(Date.parse(source.generatedAt))
  ) {
    throw new Error('Conductor projection generatedAt is invalid')
  }
  if (typeof source.registryYaml !== 'string' || !source.registryYaml.trim()) {
    throw new Error('Conductor projection registryYaml is required')
  }
  if (!isStringRecord(source.roadmaps)) {
    throw new Error('Conductor projection roadmaps must be a string map')
  }
  if (!isStringRecord(source.pitches)) {
    throw new Error('Conductor projection pitches must be a string map')
  }
  if (!isStringRecord(source.imageVersions)) {
    throw new Error('Conductor projection imageVersions must be a string map')
  }
}

function projectImageBase(snapshot: ConductorProjectionSnapshot): string {
  return `https://raw.githubusercontent.com/${snapshot.sourceRepo}/${snapshot.sourceRef}/${PROJECT_IMAGE_DIRECTORY}`
}

function versionedImageUrl(
  snapshot: ConductorProjectionSnapshot,
  filename: string,
): string {
  const base = `${projectImageBase(snapshot)}/${filename}`
  const version = snapshot.imageVersions[filename]
  return version ? `${base}?v=${version.slice(0, 12)}` : base
}

function conductorProjectAssets(
  snapshot: ConductorProjectionSnapshot,
  slug: string,
): ConductorProjectAssets {
  return {
    imagePath: versionedImageUrl(snapshot, `${slug}-icon.webp`),
    cardPath: versionedImageUrl(snapshot, `${slug}-card.webp`),
    heroPath: versionedImageUrl(snapshot, `${slug}-hero.webp`),
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

function parsedRoadmap(
  snapshot: ConductorProjectionSnapshot,
  slug: string,
): ParsedRoadmap {
  const roadmap = snapshot.roadmaps[slug]
  if (!roadmap) {
    return {
      name: '',
      kind: 'software',
      goal: undefined,
      milestones: [],
      tasks: [],
      notesFromSilas: undefined,
    }
  }
  return parseRoadmapYaml(roadmap)
}

function defined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export function buildConductorData(
  snapshot: ConductorProjectionSnapshot,
  displays: ReadonlyMap<string, ConductorProjectDisplay> = new Map(),
  syncedAt = snapshot.generatedAt,
): ConductorData {
  const registry = parseConductorProjectOverrides(snapshot.registryYaml)
  const projects = registry.map((override) => {
    const parsed = parsedRoadmap(snapshot, override.slug)
    const display = displays.get(override.slug)
    const fallbackAssets = conductorProjectAssets(snapshot, override.slug)
    const liveUrl = defined(display?.liveUrl) ?? defined(override.liveUrl)
    const channelKey = defined(display?.channelKey) ?? defined(override.channelKey)
    const tabKey = defined(display?.tabKey) ?? defined(override.tabKey)
    const repoUrl = defined(display?.repoUrl) ?? defined(override.repoUrl)

    return {
      slug: override.slug,
      name: defined(display?.title) ?? defined(parsed.name) ?? override.slug,
      kind: override.kind || parsed.kind || 'software',
      status: conductorStatusToProjectStatus(override.status),
      priority: conductorPriorityToProjectPriority(override.priority),
      conductorStatus: override.status,
      conductorPriority: override.priority,
      milestones: parsed.milestones,
      tasks: parsed.tasks,
      progress: computeProgress(parsed.milestones, parsed.tasks),
      imagePath: defined(display?.imagePath) ?? fallbackAssets.imagePath,
      cardPath: defined(display?.cardPath) ?? fallbackAssets.cardPath,
      heroPath: defined(display?.heroPath) ?? fallbackAssets.heroPath,
      ...(parsed.notesFromSilas
        ? { notesFromSilas: parsed.notesFromSilas }
        : {}),
      ...(parsed.goal ? { goal: parsed.goal } : {}),
      ...(liveUrl ? { liveUrl } : {}),
      ...(channelKey ? { channelKey } : {}),
      ...(tabKey ? { tabKey } : {}),
      ...(repoUrl ? { repoUrl } : {}),
    } satisfies ConductorProject
  })

  const pitches = Object.entries(snapshot.pitches)
    .filter(([filename]) => filename.endsWith('.md') && filename !== 'README.md')
    .map(([filename, text]) => parsePitch(filename, text))
    .sort((left, right) => right.date.localeCompare(left.date))

  return {
    projects,
    pitches,
    fetchedAt: syncedAt,
    registryCount: registry.length,
    projection: {
      sourceRepo: snapshot.sourceRepo,
      sourceRef: snapshot.sourceRef,
      sourceCommitSha: snapshot.sourceCommitSha,
      generatedAt: snapshot.generatedAt,
      syncedAt,
      status: 'ready',
    },
  }
}

export function missingConductorData(
  now = new Date().toISOString(),
): ConductorData {
  return {
    projects: [],
    pitches: [],
    fetchedAt: now,
    registryCount: 0,
    projection: {
      sourceRepo: DEFAULT_SOURCE_REPO,
      sourceRef: DEFAULT_SOURCE_REF,
      sourceCommitSha: '',
      generatedAt: now,
      syncedAt: now,
      status: 'missing',
    },
  }
}
