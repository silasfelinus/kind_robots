export const CONDUCTOR_PROJECT_STATUSES = [
  'active',
  'continuous',
  'paused',
  'finished',
  'retired',
] as const

export const CONDUCTOR_PROJECT_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent',
] as const

export const CONDUCTOR_PROJECT_KINDS = [
  'software',
  'content',
  'proposal',
  'brainstorm',
] as const

export type ConductorProjectStatus =
  (typeof CONDUCTOR_PROJECT_STATUSES)[number]
export type ConductorProjectPriority =
  (typeof CONDUCTOR_PROJECT_PRIORITIES)[number]
export type ConductorProjectKind = (typeof CONDUCTOR_PROJECT_KINDS)[number]

export type ProjectLifecycleStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DONE'
  | 'ARCHIVED'
  | 'BRAINSTORM'
export type ProjectLifecyclePriority = 'LOW' | 'NORMAL' | 'HIGH'

export interface ConductorProjectOverride {
  slug: string
  status: ConductorProjectStatus
  priority: ConductorProjectPriority
  kind?: ConductorProjectKind
  liveUrl?: string
  channelKey?: string
  tabKey?: string
  repoUrl?: string
}

export type ConductorProjectOverridePatch = {
  status?: ConductorProjectStatus
  priority?: ConductorProjectPriority
}

const STATUS_TO_PROJECT: Record<
  ConductorProjectStatus,
  ProjectLifecycleStatus
> = {
  active: 'ACTIVE',
  continuous: 'ACTIVE',
  paused: 'PAUSED',
  finished: 'DONE',
  retired: 'ARCHIVED',
}

const STATUS_TO_CONDUCTOR: Record<
  Exclude<ProjectLifecycleStatus, 'BRAINSTORM'>,
  ConductorProjectStatus
> = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DONE: 'finished',
  ARCHIVED: 'retired',
}

const PRIORITY_TO_PROJECT: Record<
  ConductorProjectPriority,
  ProjectLifecyclePriority
> = {
  low: 'LOW',
  normal: 'NORMAL',
  high: 'HIGH',
  urgent: 'HIGH',
}

const PRIORITY_TO_CONDUCTOR: Record<
  ProjectLifecyclePriority,
  ConductorProjectPriority
> = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
}

function cleanYamlScalar(value: string): string {
  const withoutComment = value.replace(/\s+#.*$/, '').trim()
  if (
    (withoutComment.startsWith('"') && withoutComment.endsWith('"')) ||
    (withoutComment.startsWith("'") && withoutComment.endsWith("'"))
  ) {
    return withoutComment.slice(1, -1).trim()
  }
  return withoutComment
}

function isStatus(value: string): value is ConductorProjectStatus {
  return CONDUCTOR_PROJECT_STATUSES.includes(value as ConductorProjectStatus)
}

function isPriority(value: string): value is ConductorProjectPriority {
  return CONDUCTOR_PROJECT_PRIORITIES.includes(
    value as ConductorProjectPriority,
  )
}

function isKind(value: string): value is ConductorProjectKind {
  return CONDUCTOR_PROJECT_KINDS.includes(value as ConductorProjectKind)
}

export function conductorStatusToProjectStatus(
  status: ConductorProjectStatus,
): ProjectLifecycleStatus {
  return STATUS_TO_PROJECT[status]
}

export function projectStatusToConductorStatus(
  status: ProjectLifecycleStatus,
): ConductorProjectStatus | null {
  if (status === 'BRAINSTORM') return null
  return STATUS_TO_CONDUCTOR[status]
}

export function conductorPriorityToProjectPriority(
  priority: ConductorProjectPriority,
): ProjectLifecyclePriority {
  return PRIORITY_TO_PROJECT[priority]
}

export function projectPriorityToConductorPriority(
  priority: ProjectLifecyclePriority,
): ConductorProjectPriority {
  return PRIORITY_TO_CONDUCTOR[priority]
}

export function parseConductorProjectOverrides(
  content: string,
): ConductorProjectOverride[] {
  const entries: ConductorProjectOverride[] = []
  let current: Partial<ConductorProjectOverride> | null = null

  const flush = () => {
    if (!current?.slug) return
    entries.push({
      slug: current.slug,
      status: current.status ?? 'active',
      priority: current.priority ?? 'normal',
      ...(current.kind ? { kind: current.kind } : {}),
      ...(current.liveUrl ? { liveUrl: current.liveUrl } : {}),
      ...(current.channelKey ? { channelKey: current.channelKey } : {}),
      ...(current.tabKey ? { tabKey: current.tabKey } : {}),
      ...(current.repoUrl ? { repoUrl: current.repoUrl } : {}),
    })
  }

  for (const line of content.split(/\r?\n/)) {
    const slugMatch = line.match(/^\s{2}-\s+slug:\s*(.+)$/)
    if (slugMatch?.[1]) {
      flush()
      current = {
        slug: cleanYamlScalar(slugMatch[1]),
        status: 'active',
        priority: 'normal',
      }
      continue
    }

    if (!current) continue
    const fieldMatch = line.match(/^\s{4}([A-Za-z][\w-]*):\s*(.*)$/)
    if (!fieldMatch?.[1]) continue
    const key = fieldMatch[1]
    const value = cleanYamlScalar(fieldMatch[2] ?? '')
    if (!value) continue

    if (key === 'status' && isStatus(value)) current.status = value
    else if (key === 'priority' && isPriority(value)) current.priority = value
    else if (key === 'kind' && isKind(value)) current.kind = value
    else if (key === 'liveUrl') current.liveUrl = value
    else if (key === 'channelKey') current.channelKey = value
    else if (key === 'tabKey') current.tabKey = value
    else if (key === 'repoUrl') current.repoUrl = value
  }

  flush()
  return entries
}

function replaceFieldLine(line: string, key: string, value: string): string {
  const commentIndex = line.indexOf(' #')
  const comment = commentIndex >= 0 ? line.slice(commentIndex) : ''
  return `    ${key}: ${value}${comment}`
}

export function updateConductorProjectOverride(
  content: string,
  slug: string,
  patch: ConductorProjectOverridePatch,
): string {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(`Invalid Conductor project slug: ${slug}`)
  }

  const lines = content.replace(/\r/g, '').split('\n')
  const start = lines.findIndex((line) => {
    const match = line.match(/^\s{2}-\s+slug:\s*(.+)$/)
    return match?.[1] ? cleanYamlScalar(match[1]) === slug : false
  })

  if (start < 0) {
    const next = [...lines]
    while (next.length && !next[next.length - 1]) next.pop()
    next.push('', `  - slug: ${slug}`)
    next.push(`    status: ${patch.status ?? 'active'}`)
    next.push(`    priority: ${patch.priority ?? 'normal'}`)
    return `${next.join('\n')}\n`
  }

  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s{2}-\s+slug:/.test(lines[index] ?? '')) {
      end = index
      break
    }
  }

  const applyField = (
    key: keyof ConductorProjectOverridePatch,
    value: string | undefined,
  ) => {
    if (!value) return
    const fieldIndex = lines.findIndex(
      (line, index) =>
        index > start &&
        index < end &&
        new RegExp(`^\\s{4}${key}:`).test(line),
    )
    if (fieldIndex >= 0) {
      lines[fieldIndex] = replaceFieldLine(lines[fieldIndex] ?? '', key, value)
      return
    }

    const insertionOffset = key === 'status' ? 1 : 2
    lines.splice(Math.min(start + insertionOffset, end), 0, `    ${key}: ${value}`)
    end += 1
  }

  applyField('status', patch.status)
  applyField('priority', patch.priority)
  return `${lines.join('\n').replace(/\n+$/, '')}\n`
}