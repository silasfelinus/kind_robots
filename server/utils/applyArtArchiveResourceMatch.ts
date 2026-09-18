// /server/utils/applyArtArchiveResourceMatch.ts
//
// Applies art-archive/t-006's matchArchiveResources() candidates to real
// ArtImage/ArchiveEntry rows (art-archive/t-007). Only unique, defensible
// matches (hash or exact-name tier, with no same-tier tie) are written to
// ArtImage.checkpointResourceId / LoraResources; a 'suggested' (folder-text)
// match or an ambiguous same-tier tie is recorded in ArchiveEntry.matchSummary
// for admin review instead of applied, and unmatched evidence stays there too
// for t-021's missing-Resource backlog. An ArchiveEntry with
// resourceMatchLocked=true (an admin's manual correction, per the model's own
// doc comment) is skipped entirely -- this module never re-derives or
// overwrites a locked entry's resource fields.
//
// Idempotent by design: every call recomputes both fields from the current
// Resource pool and the entry's own already-extracted metadata, so a Resource
// being added/renamed/deactivated later is reflected on the next run without
// tracking deltas -- as long as the entry stays unlocked. An entry whose
// metadata carries no checkpoint/LoRA evidence at all is left untouched
// (skipped as 'no-evidence') rather than writing a no-op null/empty state
// every run.
import {
  matchArchiveResources,
  type ArtImageResourceMatch,
  type ResourceMatchOutcome,
  type ActiveResourcePoolDelegate,
} from './artArchiveResourceMatch'
import type { ExtractedArchiveMetadata } from './artArchiveMetadata'
import { ArchiveEntryMatchState } from '~/prisma/generated/prisma/client'

export type ArchiveEntryForMatch = {
  id: number
  artImageId: number | null
  relativePath: string
  parentFolder: string | null
  extractedMetadata: string | null
  resourceMatchLocked: boolean
}

export type FieldMatchSummary = {
  outcome: ResourceMatchOutcome
  appliedResourceId: number | null
}

export type ArchiveResourceMatchSummary = {
  checkpoint: FieldMatchSummary | null
  loras: FieldMatchSummary[]
}

export type SkippedReason = 'locked' | 'no-art-image' | 'no-metadata' | 'no-evidence'

export type ApplyMatchResult = {
  entryId: number
  applied: boolean
  skippedReason: SkippedReason | null
  matchState: ArchiveEntryMatchState | null
  summary: ArchiveResourceMatchSummary | null
  checkpointResourceId: number | null
  loraResourceIds: number[]
}

type FieldClass = 'applied' | 'ambiguous' | 'suggested' | 'unmatched'

/** A field is applied only when it has exactly one candidate and that candidate is not the weak 'suggested' tier. */
function isDefensibleUnique(outcome: ResourceMatchOutcome): number | null {
  if (outcome.candidates.length !== 1) return null
  const only = outcome.candidates[0]!
  if (only.confidence === 'suggested') return null
  return only.resourceId
}

function classifyField(outcome: ResourceMatchOutcome): FieldClass {
  if (outcome.candidates.length > 1) return 'ambiguous'
  if (outcome.candidates.length === 1) {
    return outcome.candidates[0]!.confidence === 'suggested' ? 'suggested' : 'applied'
  }
  return 'unmatched'
}

/** Ambiguous ties outrank a weak suggestion, which outranks a fully-applied match, which outranks plain unmatched evidence. */
function rollupMatchState(fields: FieldClass[]): ArchiveEntryMatchState {
  if (fields.some((f) => f === 'ambiguous')) return ArchiveEntryMatchState.AMBIGUOUS
  if (fields.some((f) => f === 'suggested')) return ArchiveEntryMatchState.SUGGESTED
  if (fields.some((f) => f === 'applied')) return ArchiveEntryMatchState.CONFIRMED
  return ArchiveEntryMatchState.UNMATCHED
}

export type ComputedArchiveResourceMatch = {
  matchState: ArchiveEntryMatchState
  summary: ArchiveResourceMatchSummary
  checkpointResourceId: number | null
  loraResourceIds: number[]
}

export function computeArchiveResourceMatch(match: ArtImageResourceMatch): ComputedArchiveResourceMatch {
  const fieldClasses: FieldClass[] = []
  if (match.checkpoint) fieldClasses.push(classifyField(match.checkpoint))
  for (const outcome of match.loras) fieldClasses.push(classifyField(outcome))

  const checkpointResourceId = match.checkpoint ? isDefensibleUnique(match.checkpoint) : null
  const loraResourceIds = [
    ...new Set(
      match.loras
        .map((outcome) => isDefensibleUnique(outcome))
        .filter((id): id is number => id !== null),
    ),
  ]

  const summary: ArchiveResourceMatchSummary = {
    checkpoint: match.checkpoint
      ? { outcome: match.checkpoint, appliedResourceId: checkpointResourceId }
      : null,
    loras: match.loras.map((outcome) => ({
      outcome,
      appliedResourceId: isDefensibleUnique(outcome),
    })),
  }

  return {
    matchState: rollupMatchState(fieldClasses),
    summary,
    checkpointResourceId,
    loraResourceIds,
  }
}

export type ArtImageResourceWriteDelegate = {
  update: (args: {
    where: { id: number }
    data: { checkpointResourceId: number | null; LoraResources: { set: { id: number }[] } }
  }) => PromiseLike<unknown>
}

export type ArchiveEntryWriteDelegate = {
  update: (args: {
    where: { id: number }
    data: { matchState: ArchiveEntryMatchState; matchSummary: string }
  }) => PromiseLike<unknown>
}

function skipped(entryId: number, reason: SkippedReason): ApplyMatchResult {
  return {
    entryId,
    applied: false,
    skippedReason: reason,
    matchState: null,
    summary: null,
    checkpointResourceId: null,
    loraResourceIds: [],
  }
}

/**
 * Applies one ArchiveEntry's resource match to its ArtImage + ArchiveEntry
 * rows. Never throws on a locked/unlinked/evidence-free entry -- callers
 * (the batch runner, the CLI) decide how to report skips.
 */
export async function applyArchiveEntryResourceMatch(
  entry: ArchiveEntryForMatch,
  resource: ActiveResourcePoolDelegate,
  artImage: ArtImageResourceWriteDelegate,
  archiveEntry: ArchiveEntryWriteDelegate,
): Promise<ApplyMatchResult> {
  if (entry.resourceMatchLocked) return skipped(entry.id, 'locked')
  if (!entry.artImageId) return skipped(entry.id, 'no-art-image')
  if (!entry.extractedMetadata) return skipped(entry.id, 'no-metadata')

  let metadata: ExtractedArchiveMetadata
  try {
    metadata = JSON.parse(entry.extractedMetadata)
  } catch {
    return skipped(entry.id, 'no-metadata')
  }

  const rawMatch = await matchArchiveResources(metadata, entry.relativePath, entry.parentFolder ?? '', resource)
  if (!rawMatch.checkpoint && rawMatch.loras.length === 0) return skipped(entry.id, 'no-evidence')

  const { matchState, summary, checkpointResourceId, loraResourceIds } = computeArchiveResourceMatch(rawMatch)

  await artImage.update({
    where: { id: entry.artImageId },
    data: {
      checkpointResourceId,
      LoraResources: { set: loraResourceIds.map((id) => ({ id })) },
    },
  })
  await archiveEntry.update({
    where: { id: entry.id },
    data: { matchState, matchSummary: JSON.stringify(summary) },
  })

  return {
    entryId: entry.id,
    applied: true,
    skippedReason: null,
    matchState,
    summary,
    checkpointResourceId,
    loraResourceIds,
  }
}

export type ArchiveEntryPoolDelegate = {
  findMany: (args: {
    where: { resourceMatchLocked: false; artImageId: { not: null }; extractedMetadata: { not: null }; isActive: true }
    select: {
      id: true
      artImageId: true
      relativePath: true
      parentFolder: true
      extractedMetadata: true
      resourceMatchLocked: true
    }
  }) => PromiseLike<ArchiveEntryForMatch[]>
}

export type ApplyRunDelegates = {
  archiveEntryPool: ArchiveEntryPoolDelegate
  resource: ActiveResourcePoolDelegate
  runOne: (
    entry: ArchiveEntryForMatch,
  ) => Promise<ApplyMatchResult>
}

/**
 * Finds every unlocked, imported ArchiveEntry with extracted metadata and
 * applies its resource match. Each entry's writes run through `runOne` so
 * the real caller (server/utils/prisma) can wrap each entry in its own
 * transaction while this function stays free of any concrete Prisma import.
 */
export async function applyArchiveResourceMatches(delegates: ApplyRunDelegates): Promise<ApplyMatchResult[]> {
  const entries = await delegates.archiveEntryPool.findMany({
    where: { resourceMatchLocked: false, artImageId: { not: null }, extractedMetadata: { not: null }, isActive: true },
    select: {
      id: true,
      artImageId: true,
      relativePath: true,
      parentFolder: true,
      extractedMetadata: true,
      resourceMatchLocked: true,
    },
  })

  const results: ApplyMatchResult[] = []
  for (const entry of entries) results.push(await delegates.runOne(entry))
  return results
}
