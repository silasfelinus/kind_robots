// /server/utils/buildArchiveEnqueuePayload.ts
//
// Pure builder for art-archive/t-016: turns an imported ArtImage's stored
// prompt/settings/resource provenance into a base ArtJob payload, then
// merges in the chosen ArchiveActionPreset via t-025's
// applyArchivePresetToPayload. Imported ArtImages have no original ArtJob of
// their own to re-run, so this is what lets the curation board's preset
// targets (t-015, deferred pending this adapter) actually enqueue a normal
// durable ArtJob instead of a second render path.
//
// No Prisma import: pure payload logic, unit-testable without a live
// DATABASE_URL, matching applyArchivePresetToPayload.ts's own split. The
// caller (the enqueue endpoint) is responsible for loading the ArtImage and
// preset rows and for the actual prisma.artJob.create call.
import type { ArchivePresetActionType } from './artArchivePresetModifiers'
import { applyArchivePresetToPayload } from './applyArchivePresetToPayload'
import type { ArtJobPayloadRecord } from './artJobPayload'

export type ArchiveSourceArtImage = {
  promptString: string | null
  negativePrompt: string | null
  checkpoint: string | null
  checkpointResourceId: number | null
  cfg: number | null
  cfgHalf: boolean | null
  sampler: string | null
  seed: number | null
  steps: number | null
  isPublic: boolean | null
  isMature: boolean | null
  designer: string | null
}

export class ArchiveEnqueueError extends Error {}

/**
 * Builds the merged ArtJob payload for regenerating/replacing one archive
 * entry's imported art. Throws `ArchiveEnqueueError` when the source
 * ArtImage has no promptString to build from -- there is nothing a preset
 * merge can do with an empty base.
 *
 * The result is tagged with `archiveEntryId`/`archivePresetId`/`actionType`
 * (matching how enqueue.post.ts already tags narrativeContext/
 * brainstormContext onto a payload) purely for provenance/traceability;
 * these are not consumed by any engine workflow builder. `actionType` is
 * tagged independently of `archivePresetId` (art-archive/t-034) so a report
 * or the job-status board can read it directly from the durable payload
 * instead of re-resolving it through the ArchiveActionPreset row, which can
 * later be edited or deleted out from under an already-queued job.
 */
export function buildArchiveEnqueuePayload(input: {
  archiveEntryId: number
  presetId: number
  actionType: ArchivePresetActionType
  modifiers: Record<string, unknown>
  artImage: ArchiveSourceArtImage
}): ArtJobPayloadRecord {
  const { archiveEntryId, presetId, actionType, modifiers, artImage } = input

  const promptString = artImage.promptString?.trim() || ''
  if (!promptString) {
    throw new ArchiveEnqueueError(
      `Archive entry #${archiveEntryId}'s imported ArtImage has no promptString to build a job from.`,
    )
  }

  const basePayload: ArtJobPayloadRecord = {
    promptString,
    negativePrompt: artImage.negativePrompt ?? '',
    checkpoint: artImage.checkpoint ?? null,
    checkpointResourceId: artImage.checkpointResourceId ?? null,
    cfg: artImage.cfg ?? null,
    cfgHalf: artImage.cfgHalf ?? false,
    sampler: artImage.sampler ?? null,
    seed: artImage.seed ?? null,
    steps: artImage.steps ?? null,
    save: {
      isPublic: artImage.isPublic ?? true,
      isMature: artImage.isMature ?? true,
      designer: artImage.designer ?? null,
      artCollectionIds: [],
    },
  }

  const merged = applyArchivePresetToPayload(actionType, modifiers, basePayload)
  merged.archiveEntryId = archiveEntryId
  merged.archivePresetId = presetId
  merged.actionType = actionType
  return merged
}
