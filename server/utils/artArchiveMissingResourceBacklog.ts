import type { ArchiveResourceMatchSummary, FieldMatchSummary } from './applyArtArchiveResourceMatch'
import type { ResourceMatchCandidate, UnmatchedModelEvidence } from './artArchiveResourceMatch'
import type { ExtractedArchiveMetadata } from './artArchiveMetadata'

export type MissingArchiveResourceType = 'CHECKPOINT' | 'LORA'

export type ArchiveBacklogEntry = {
  id: number
  artImageId: number | null
  relativePath: string
  extractedMetadata: string | null
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

function unresolvedEvidence(field: FieldMatchSummary, raw: UnmatchedModelEvidence | null): UnmatchedModelEvidence | null {
  if (field.appliedResourceId !== null) return null
  return field.outcome.unmatched ?? raw
}

function addField(
  backlog: Map<string, MissingArchiveResource>,
  resourceType: MissingArchiveResourceType,
  field: FieldMatchSummary,
  raw: UnmatchedModelEvidence | null,
  example: MissingArchiveResourceExample,
): void {
  const evidence = unresolvedEvidence(field, raw)
  if (!evidence?.name && !evidence?.hash) return

  const key = backlogKey(resourceType, evidence)
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
    name: evidence.name,
    hash: evidence.hash,
    weight: evidence.weight,
    occurrenceCount: 1,
    candidates: [...field.outcome.candidates],
    examples: [example],
  })
}

function rawEvidence(metadataText: string | null): { checkpoint: UnmatchedModelEvidence | null; loras: UnmatchedModelEvidence[] } {
  if (!metadataText) return { checkpoint: null, loras: [] }
  try {
    const metadata = JSON.parse(metadataText) as ExtractedArchiveMetadata
    // Structured checkpoint/LoRA evidence exists only on the PNG variant.
    // JPEG/WebP metadata is still preserved by the scanner, but its free-form
    // EXIF/XMP/comments are not safe to reinterpret as model identifiers here.
    if (!metadata.supported || metadata.format !== 'png') {
      return { checkpoint: null, loras: [] }
    }
    const source = metadata.a1111 ?? metadata.comfy
    if (!source) return { checkpoint: null, loras: [] }
    return {
      checkpoint: source.checkpoint || ('checkpointHash' in source && source.checkpointHash)
        ? { name: source.checkpoint, hash: 'checkpointHash' in source ? source.checkpointHash : null, weight: null }
        : null,
      loras: source.loraTokens.map((token: { name: string; weight: number | null }) => ({ name: token.name, hash: null, weight: token.weight ?? null })),
    }
  } catch {
    return { checkpoint: null, loras: [] }
  }
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

    const raw = rawEvidence(entry.extractedMetadata)
    const example = { archiveEntryId: entry.id, artImageId: entry.artImageId, relativePath: entry.relativePath }
    if (summary.checkpoint) addField(backlog, 'CHECKPOINT', summary.checkpoint, raw.checkpoint, example)
    for (const [index, lora] of (summary.loras ?? []).entries()) addField(backlog, 'LORA', lora, raw.loras[index] ?? null, example)
  }

  return [...backlog.values()].sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.key.localeCompare(b.key))
}

export type ArchiveBacklogPoolDelegate = {
  findMany: (args: {
    where: { isActive: true; matchSummary: { not: null } }
    select: { id: true; artImageId: true; relativePath: true; extractedMetadata: true; matchSummary: true }
  }) => PromiseLike<ArchiveBacklogEntry[]>
}

export async function queryMissingArchiveResourceBacklog(archiveEntry: ArchiveBacklogPoolDelegate): Promise<MissingArchiveResource[]> {
  const entries = await archiveEntry.findMany({
    where: { isActive: true, matchSummary: { not: null } },
    select: { id: true, artImageId: true, relativePath: true, extractedMetadata: true, matchSummary: true },
  })
  return buildMissingArchiveResourceBacklog(entries)
}
