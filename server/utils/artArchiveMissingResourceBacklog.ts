import type { ArchiveResourceMatchSummary, FieldMatchSummary } from './applyArtArchiveResourceMatch'
import type { ResourceMatchCandidate, UnmatchedModelEvidence } from './artArchiveResourceMatch'

export type MissingArchiveResourceType = 'CHECKPOINT' | 'LORA'

export type ArchiveBacklogEntry = {
  id: number
  artImageId: number | null
  relativePath: string
  matchSummary: string | null
}

export type MissingArchiveResourceExample = {
  archiveEntryId: number
  artImageId: number | null
  relativePath: string
}

export type MissingArchiveResource = {
  key: string
  resourceType: MissingArchiveResourceType
  name: string | null
  hash: string | null
  weight: number | null
  occurrenceCount: number
  candidates: ResourceMatchCandidate[]
  examples: MissingArchiveResourceExample[]
}

const MAX_EXAMPLES = 5

function normalizeName(value: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/\\/g, '/').split('/').pop()!.replace(/\.[a-z0-9]+$/i, '').replace(/[\s_-]+/g, '')
}

function backlogKey(resourceType: MissingArchiveResourceType, evidence: UnmatchedModelEvidence): string {
  const hash = evidence.hash?.trim().toLowerCase() ?? ''
  return `${resourceType}:${hash ? `hash:${hash}` : `name:${normalizeName(evidence.name)}`}`
}

function unresolvedEvidence(field: FieldMatchSummary): UnmatchedModelEvidence | null {
  if (field.appliedResourceId !== null) return null
  if (field.outcome.unmatched) return field.outcome.unmatched
  return { name: null, hash: null, weight: null }
}

function addField(
  backlog: Map<string, MissingArchiveResource>,
  resourceType: MissingArchiveResourceType,
  field: FieldMatchSummary,
  example: MissingArchiveResourceExample,
): void {
  const evidence = unresolvedEvidence(field)
  if (!evidence) return

  const fallbackName = field.outcome.candidates.length ? `candidate:${field.outcome.candidates.map((candidate) => candidate.resourceId).join(',')}` : null
  const effectiveEvidence = evidence.name || evidence.hash ? evidence : { ...evidence, name: fallbackName }
  if (!effectiveEvidence.name && !effectiveEvidence.hash) return

  const key = backlogKey(resourceType, effectiveEvidence)
  const existing = backlog.get(key)
  if (existing) {
    existing.occurrenceCount += 1
    for (const candidate of field.outcome.candidates) {
      if (!existing.candidates.some((item) => item.resourceId === candidate.resourceId && item.confidence === candidate.confidence)) existing.candidates.push(candidate)
    }
    if (existing.examples.length < MAX_EXAMPLES && !existing.examples.some((item) => item.archiveEntryId === example.archiveEntryId)) existing.examples.push(example)
    return
  }

  backlog.set(key, {
    key,
    resourceType,
    name: effectiveEvidence.name,
    hash: effectiveEvidence.hash,
    weight: effectiveEvidence.weight,
    occurrenceCount: 1,
    candidates: [...field.outcome.candidates],
    examples: [example],
  })
}

export function buildMissingArchiveResourceBacklog(entries: ArchiveBacklogEntry[]): MissingArchiveResource[] {
  const backlog = new Map<string, MissingArchiveResource>()

  for (const entry of entries) {
    if (!entry.matchSummary) continue
    let summary: ArchiveResourceMatchSummary
    try {
      summary = JSON.parse(entry.matchSummary) as ArchiveResourceMatchSummary
    } catch {
      continue
    }

    const example = { archiveEntryId: entry.id, artImageId: entry.artImageId, relativePath: entry.relativePath }
    if (summary.checkpoint) addField(backlog, 'CHECKPOINT', summary.checkpoint, example)
    for (const lora of summary.loras ?? []) addField(backlog, 'LORA', lora, example)
  }

  return [...backlog.values()].sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.key.localeCompare(b.key))
}

export type ArchiveBacklogPoolDelegate = {
  findMany: (args: {
    where: { isActive: true; matchSummary: { not: null } }
    select: { id: true; artImageId: true; relativePath: true; matchSummary: true }
  }) => PromiseLike<ArchiveBacklogEntry[]>
}

export async function queryMissingArchiveResourceBacklog(archiveEntry: ArchiveBacklogPoolDelegate): Promise<MissingArchiveResource[]> {
  const entries = await archiveEntry.findMany({
    where: { isActive: true, matchSummary: { not: null } },
    select: { id: true, artImageId: true, relativePath: true, matchSummary: true },
  })
  return buildMissingArchiveResourceBacklog(entries)
}
