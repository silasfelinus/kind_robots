import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import type {
  ColoringBookBwSource,
  ColoringBookColorSource,
  ColoringBookStudioOperation,
} from '~/types/coloringBookStudio'
import { conductorList, conductorPut } from '@/server/utils/conductor-github'

export type ColoringBookEventInput = {
  operation: ColoringBookStudioOperation
  bookSlug: string
  /** Proposal id, or `${bookSlug}-cover` for cover operations. */
  targetKey: string
  targetLabel: string
  proposalId?: string
  sourcePath?: string | null
  /** generate-bw only: color (default), version (with sourcePath), or prompt. */
  bwSource?: ColoringBookBwSource | null
  /** generate-color-proposals only: prompt (default) or version (with sourcePath). */
  colorSource?: ColoringBookColorSource | null
  force?: boolean
  note: string
  commitMessage: string
  /** Validated engine/checkpoint/LoRA (generate-color-proposals only). */
  renderSettings?: {
    engine: string
    checkpoint: string | null
    lora: string | null
    lora_strength: number | null
  } | null
}

function yamlScalar(value: string | number | null): string {
  return value === null ? 'null' : JSON.stringify(value)
}

/**
 * Write one `color-art-events/` request for Conductor's
 * process_coloring_art_events.py, refusing a second queued action for the same
 * page so two studio clicks cannot race on one queue entry.
 */
export async function assertNoQueuedColoringBookEvent(
  targetKey: string,
  targetLabel: string,
): Promise<void> {
  const eventFiles = (await conductorList('color-art-events')) ?? []
  const alreadyQueued = eventFiles.some(
    (entry) => entry.type === 'file' && entry.name.includes(`-${targetKey}-`),
  )
  if (alreadyQueued) {
    throw createError({
      statusCode: 409,
      message: `${targetLabel} already has a queued Coloring Book Studio action.`,
    })
  }
}

export async function queueColoringBookEvent(
  input: ColoringBookEventInput,
): Promise<string> {
  await assertNoQueuedColoringBookEvent(input.targetKey, input.targetLabel)

  const stamp = new Date().toISOString().replace(/[-:.]/g, '')
  const suffix = randomUUID().slice(0, 8)
  const path = `color-art-events/${stamp}-${input.targetKey}-${input.operation}-${suffix}.yaml`
  const settings = input.renderSettings
  const content = [
    'version: 1',
    `operation: ${input.operation}`,
    `book: ${input.bookSlug}`,
    ...(input.proposalId ? ['proposal_ids:', `  - ${input.proposalId}`] : []),
    ...(input.sourcePath
      ? [`source_path: ${JSON.stringify(input.sourcePath)}`]
      : []),
    ...(input.bwSource ? [`bw_source: ${input.bwSource}`] : []),
    ...(input.colorSource ? [`color_source: ${input.colorSource}`] : []),
    ...(settings
      ? [
          'render_settings:',
          `  engine: ${yamlScalar(settings.engine)}`,
          `  checkpoint: ${yamlScalar(settings.checkpoint)}`,
          `  lora: ${yamlScalar(settings.lora)}`,
          `  lora_strength: ${yamlScalar(settings.lora_strength)}`,
        ]
      : []),
    'timeout: 600',
    `force: ${input.force ? 'true' : 'false'}`,
    'requested_by: kind-robots-coloring-studio',
    'task: coloring-book/t-028',
    `note: ${JSON.stringify(input.note)}`,
    '',
  ].join('\n')

  await conductorPut(path, content, input.commitMessage)
  return path
}
