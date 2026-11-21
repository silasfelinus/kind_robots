// /utils/artJobQueueGroups.ts
//
// Groups PENDING ArtJobs by the name the queue card shows as its title, so an
// admin can see what the backlog is made of and move a whole group at once
// ("send every hybridizer job to the back").
//
// The group name is the card title minus its per-job fallback: payload
// `title` / `label` / `name`, then `projectSlug`. artJobTitle() ends with
// `ArtJob #<id>`, which would make every untitled job its own group of one, so
// those collect under UNTITLED_ART_JOB_GROUP instead.
//
// Some features give each entity its own indexed slug (Hybridizer revisions
// use `hybridizer:<64-hex fusion id>` so version history is one index lookup).
// Those slugs are load-bearing and stay as-is in the database; for grouping
// only, a `<family>:<long hex id>` slug collapses to `<family>`, so the
// backlog shows one "hybridizer" group instead of one group per fusion.
//
// The server never loads full payloads to compute this (they hold whole ComfyUI
// workflows); it extracts just the three keys as JSON fragments. Those arrive as
// raw JSON text on MariaDB and may arrive already decoded elsewhere, so
// decodeJsonFragment accepts both before the same scalar rule the card uses runs.
//
// No database import, so the DB-free contract tests can exercise it.
import { directPayloadScalar } from './artJobFields'

export const UNTITLED_ART_JOB_GROUP = 'Untitled'
export const MAX_ART_JOB_GROUP_NAME_LENGTH = 255

export type ArtJobGroupSourceRow = {
  id: number | bigint
  priority: number | bigint
  projectSlug: string | null
  title?: unknown
  label?: unknown
  name?: unknown
}

export type ArtJobQueueGroup = {
  name: string
  count: number
  minPriority: number
  maxPriority: number
  oldestJobId: number
  newestJobId: number
}

export type ArtJobQueueGroupSummary = {
  groups: ArtJobQueueGroup[]
  totalJobs: number
  minPriority: number | null
  maxPriority: number | null
}

export function decodeJsonFragment(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// A per-entity suffix: a colon, then a hex id of at least 16 characters
// (fusion ids are SHA-256). Short or non-hex suffixes are real names and stay.
const ENTITY_SLUG_SUFFIX = /:[a-f0-9]{16,}$/i

export function artJobSlugGroupName(
  projectSlug: string | null | undefined,
): string {
  const slug = projectSlug?.trim() ?? ''
  const family = slug.replace(ENTITY_SLUG_SUFFIX, '')
  return family || slug
}

export function artJobGroupName(row: ArtJobGroupSourceRow): string {
  const titled = directPayloadScalar(
    {
      id: Number(row.id),
      payload: {
        title: decodeJsonFragment(row.title),
        label: decodeJsonFragment(row.label),
        name: decodeJsonFragment(row.name),
      },
    },
    ['title', 'label', 'name'],
  )
  return (
    titled || artJobSlugGroupName(row.projectSlug) || UNTITLED_ART_JOB_GROUP
  )
}

export function summarizeArtJobQueueGroups(
  rows: ArtJobGroupSourceRow[],
): ArtJobQueueGroupSummary {
  const byName = new Map<string, ArtJobQueueGroup>()

  for (const row of rows) {
    const id = Number(row.id)
    const priority = Number(row.priority)
    const name = artJobGroupName(row)
    const group = byName.get(name)

    if (!group) {
      byName.set(name, {
        name,
        count: 1,
        minPriority: priority,
        maxPriority: priority,
        oldestJobId: id,
        newestJobId: id,
      })
      continue
    }

    group.count += 1
    group.minPriority = Math.min(group.minPriority, priority)
    group.maxPriority = Math.max(group.maxPriority, priority)
    group.oldestJobId = Math.min(group.oldestJobId, id)
    group.newestJobId = Math.max(group.newestJobId, id)
  }

  const groups = [...byName.values()].sort(
    (a, b) =>
      b.maxPriority - a.maxPriority ||
      b.count - a.count ||
      a.name.localeCompare(b.name),
  )

  return {
    groups,
    totalJobs: rows.length,
    minPriority: groups.length
      ? Math.min(...groups.map((group) => group.minPriority))
      : null,
    maxPriority: groups.length
      ? Math.max(...groups.map((group) => group.maxPriority))
      : null,
  }
}

export function artJobIdsInGroup(
  rows: ArtJobGroupSourceRow[],
  name: string,
): number[] {
  return rows
    .filter((row) => artJobGroupName(row) === name)
    .map((row) => Number(row.id))
}

export type ArtJobGroupNameParse =
  | { ok: true; name: string }
  | { ok: false; message: string }

export function parseArtJobGroupName(value: unknown): ArtJobGroupNameParse {
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name || name.length > MAX_ART_JOB_GROUP_NAME_LENGTH) {
    return {
      ok: false,
      message: `Group must be a job name of 1 to ${MAX_ART_JOB_GROUP_NAME_LENGTH} characters.`,
    }
  }
  return { ok: true, name }
}

export function formatArtJobPriorityRange(
  minPriority: number | null,
  maxPriority: number | null,
): string {
  if (minPriority === null || maxPriority === null) return '—'
  if (minPriority === maxPriority) return String(minPriority)
  return `${minPriority} to ${maxPriority}`
}
