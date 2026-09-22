// /server/utils/artArchiveResourceMatch.ts
//
// Confidence-ranked matching from legacy archive generation metadata
// (art-archive/t-004's ExtractedArchiveMetadata) to active Kind Robots
// Resource rows (art-archive/t-006). This module only proposes candidates
// with evidence and confidence -- it never writes anything. t-007 applies
// unique, defensible matches; t-021 backlogs whatever this reports as
// unmatched.
//
// Legacy files carry no Kind Robots Resource id, so "embedded ids" (the
// task note's top-priority tier) means the embedded content hash
// (A1111's "Model hash:") -- a hash is a much stronger identity signal than
// a freely-retyped name, so it outranks every name-based tier below it.
// Below that: an exact match against Resource.localPath/name/customLabel,
// then the same names normalized (path/extension/case/separator-insensitive,
// e.g. 'realisticVisionV51.safetensors' vs 'realisticVisionV51'). Below
// that: a Resource's own name/label appearing as a substring of the
// archive's folder/file path -- explicitly a suggestion tier, since a short
// or common name can collide by coincidence.
//
// A tier is only consulted when the tier(s) above it produced zero matches.
// Multiple matches within the winning tier are all returned (never narrowed
// to one) so an ambiguous tie is visible to the caller instead of an
// arbitrary pick silently winning.
//
// This never reads or reasons about isMature/isPublic on either side: a
// Resource's maturity is not selected here, and archive ArtImage/
// ArtCollection privacy is forced unconditionally by t-005's importer,
// independent of resource provenance. Structural contract, not documentation
// only -- see utils/scripts/verifyArtArchiveResourceMatch.test.ts.
import path from 'node:path'
import { ResourceType } from '~/prisma/generated/prisma/client'
import { narrowToPngMetadata, type ExtractedArchiveMetadata } from './artArchiveMetadata'

export type ResourceMatchConfidence = 'hash' | 'exact' | 'suggested'

export type ResourceMatchCandidate = {
  resourceId: number
  confidence: ResourceMatchConfidence
  evidence: string
}

export type UnmatchedModelEvidence = {
  name: string | null
  hash: string | null
  weight: number | null
}

export type ResourceMatchOutcome = {
  /** Every candidate at the single highest-confidence tier that matched anything; empty if none did. */
  candidates: ResourceMatchCandidate[]
  /** Set only when candidates is empty but real embedded evidence existed to match against. */
  unmatched: UnmatchedModelEvidence | null
}

export type ArtImageResourceMatch = {
  /** null when the file carried no embedded checkpoint name/hash at all. */
  checkpoint: ResourceMatchOutcome | null
  /** One entry per embedded LoRA token found (A1111 `<lora:name:weight>` / ComfyUI LoRA loader nodes). */
  loras: ResourceMatchOutcome[]
}

export type ResourceMatchFileSummary = {
  /** True when this file's checkpoint and/or any LoRA slot carried real embedded evidence. */
  hasMatchEvidence: boolean
  /** Count of outcomes (checkpoint + each LoRA) that had evidence but resolved to no candidate. */
  unmatchedCount: number
  /** Count of matched candidates at each confidence tier, across the checkpoint and all LoRAs. */
  confidenceCounts: Record<ResourceMatchConfidence, number>
}

export type ResourceMatchAggregate = {
  filesWithMatchEvidence: number
  unmatchedModels: number
  confidenceCounts: Record<ResourceMatchConfidence, number>
}

function emptyConfidenceCounts(): Record<ResourceMatchConfidence, number> {
  return { hash: 0, exact: 0, suggested: 0 }
}

/**
 * Reduce one file's checkpoint/LoRA match outcomes into the counts every caller
 * (CLI, admin import endpoint, admin dry-run endpoint) needs to report -- kept as
 * one pure function so "matched"/"unmatched" can't silently drift between call
 * sites as matchArchiveResources() evolves (art-archive/t-037).
 */
export function summarizeResourceMatch(matches: ArtImageResourceMatch): ResourceMatchFileSummary {
  const outcomes = [matches.checkpoint, ...matches.loras].filter(
    (outcome): outcome is ResourceMatchOutcome => outcome !== null,
  )
  const confidenceCounts = emptyConfidenceCounts()
  let unmatchedCount = 0
  for (const outcome of outcomes) {
    if (outcome.candidates.length > 0) {
      for (const candidate of outcome.candidates) confidenceCounts[candidate.confidence] += 1
    } else if (outcome.unmatched) {
      unmatchedCount += 1
    }
  }
  return { hasMatchEvidence: outcomes.length > 0, unmatchedCount, confidenceCounts }
}

/** Sum per-file summaries from {@link summarizeResourceMatch} into a scan-wide total. */
export function aggregateResourceMatchSummaries(
  summaries: Iterable<ResourceMatchFileSummary>,
): ResourceMatchAggregate {
  const totals: ResourceMatchAggregate = {
    filesWithMatchEvidence: 0,
    unmatchedModels: 0,
    confidenceCounts: emptyConfidenceCounts(),
  }
  for (const summary of summaries) {
    if (summary.hasMatchEvidence) totals.filesWithMatchEvidence += 1
    totals.unmatchedModels += summary.unmatchedCount
    for (const tier of Object.keys(totals.confidenceCounts) as ResourceMatchConfidence[]) {
      totals.confidenceCounts[tier] += summary.confidenceCounts[tier]
    }
  }
  return totals
}

type ActiveResourceRow = {
  id: number
  resourceType: ResourceType
  name: string
  customLabel: string | null
  localPath: string | null
  hash: string | null
}

export type ActiveResourcePoolDelegate = {
  findMany: (args: {
    where: { resourceType: { in: ResourceType[] }; isActive: true }
    select: {
      id: true
      resourceType: true
      name: true
      customLabel: true
      localPath: true
      hash: true
    }
  }) => PromiseLike<ActiveResourceRow[]>
}

const LORA_TYPES: ResourceType[] = [ResourceType.LORA, ResourceType.LYCORIS]
const MIN_SUGGESTED_SUBSTRING_LENGTH = 4

function normalizeBasename(value: string): string {
  const posixValue = value.replace(/\\/g, '/')
  return path.posix
    .basename(posixValue)
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function exactNameCandidates(row: ActiveResourceRow): string[] {
  return [row.name, row.customLabel, row.localPath].filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
}

function normalizedNameCandidates(row: ActiveResourceRow): string[] {
  return [...new Set(exactNameCandidates(row).map(normalizeBasename))]
}

function toCandidates(
  rows: ActiveResourceRow[],
  confidence: ResourceMatchConfidence,
  evidence: string,
): ResourceMatchCandidate[] {
  return rows.map((row) => ({ resourceId: row.id, confidence, evidence }))
}

function matchCandidates(
  name: string | null,
  hash: string | null,
  folderText: string,
  pool: ActiveResourceRow[],
): ResourceMatchCandidate[] {
  if (hash) {
    const hashMatches = pool.filter((r) => r.hash && r.hash.toLowerCase() === hash.toLowerCase())
    if (hashMatches.length) return toCandidates(hashMatches, 'hash', `hash match: ${hash}`)
  }

  if (name) {
    const exactMatches = pool.filter((r) => exactNameCandidates(r).includes(name))
    if (exactMatches.length) {
      return toCandidates(exactMatches, 'exact', `exact name match: '${name}'`)
    }

    const normalized = normalizeBasename(name)
    const basenameMatches = pool.filter((r) => normalizedNameCandidates(r).includes(normalized))
    if (basenameMatches.length) {
      return toCandidates(basenameMatches, 'exact', `normalized basename match: '${normalized}'`)
    }
  }

  if (folderText) {
    const haystack = folderText.toLowerCase()
    const substringMatches = pool.filter((r) =>
      normalizedNameCandidates(r).some(
        (n) => n.length >= MIN_SUGGESTED_SUBSTRING_LENGTH && haystack.includes(n),
      ),
    )
    if (substringMatches.length) {
      return toCandidates(substringMatches, 'suggested', 'archive path contains resource name/label')
    }
  }

  return []
}

function resolveOutcome(
  name: string | null,
  hash: string | null,
  weight: number | null,
  folderText: string,
  pool: ActiveResourceRow[],
): ResourceMatchOutcome {
  const candidates = matchCandidates(name, hash, folderText, pool)
  return {
    candidates,
    unmatched: candidates.length === 0 ? { name, hash, weight } : null,
  }
}

/**
 * Matches one archive file's extracted generation metadata against active
 * CHECKPOINT and LORA/LYCORIS Resources. Only PNG carries structured
 * checkpoint/LoRA fields today (art-archive/t-004's A1111/ComfyUI parsers);
 * JPEG/WebP's raw EXIF/XMP/COM text has no structured model fields yet, so
 * this returns no evidence for those formats rather than guessing at
 * unstructured text.
 */
/**
 * One shared read of the active Resource pool for a whole scan.
 *
 * matchArchiveResources() calls findMany() itself, which is right for a single
 * file and catastrophic for an archive: the admin dry-run and import endpoints
 * map it over EVERY scanned file through an unbounded Promise.all, so a run
 * issued one full checkpoint+LoRA table load per file, concurrently, and held
 * them all in memory at once. On Alexandria that killed the container outright
 * -- `docker exec` returned 137 (SIGKILL) with no HTTP response, because the
 * server died mid-scan rather than answering (art-archive/t-041, 2026-09-22).
 *
 * The pool is identical for every file in a run, so this memoizes the first
 * read and hands the same rows to all of them. The matcher itself is unchanged
 * and still takes a plain delegate, so single-file callers keep their old
 * behavior.
 */
export function createCachedResourcePool(
  delegate: ActiveResourcePoolDelegate,
): ActiveResourcePoolDelegate {
  let inFlight: Promise<ActiveResourceRow[]> | null = null
  return {
    findMany: (args) => {
      inFlight ??= Promise.resolve(delegate.findMany(args))
      return inFlight
    },
  }
}

export async function matchArchiveResources(
  metadata: ExtractedArchiveMetadata,
  relativePath: string,
  parentFolder: string,
  resource: ActiveResourcePoolDelegate,
): Promise<ArtImageResourceMatch> {
  const empty: ArtImageResourceMatch = { checkpoint: null, loras: [] }
  const png = narrowToPngMetadata(metadata)
  if (!png) return empty

  const source = png.a1111 ?? png.comfy
  if (!source) return empty

  const checkpointName = source.checkpoint
  const checkpointHash = 'checkpointHash' in source ? source.checkpointHash : null
  const loraTokens = source.loraTokens

  if (!checkpointName && !checkpointHash && loraTokens.length === 0) return empty

  const pool = await resource.findMany({
    where: { resourceType: { in: [ResourceType.CHECKPOINT, ...LORA_TYPES] }, isActive: true },
    select: { id: true, resourceType: true, name: true, customLabel: true, localPath: true, hash: true },
  })
  const checkpointPool = pool.filter((r) => r.resourceType === ResourceType.CHECKPOINT)
  const loraPool = pool.filter((r) => LORA_TYPES.includes(r.resourceType))
  const folderText = `${parentFolder} ${relativePath}`

  const checkpoint =
    checkpointName || checkpointHash
      ? resolveOutcome(checkpointName, checkpointHash, null, folderText, checkpointPool)
      : null

  const loras = loraTokens.map((token) =>
    resolveOutcome(token.name, null, token.weight ?? null, folderText, loraPool),
  )

  return { checkpoint, loras }
}
