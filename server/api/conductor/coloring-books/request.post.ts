import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import type {
  ColoringBookRenderRequest,
  ColoringBookStudioOperation,
} from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  conductorList,
  conductorPut,
} from '@/server/utils/conductor-github'
import {
  coloringBookConfig,
  proposalBelongsToBook,
} from '@/server/utils/coloringBookStudio'

const OPERATIONS = new Set<ColoringBookStudioOperation>([
  'generate-color-proposals',
  'accept-color',
  'generate-bw',
  'accept-bw',
  'finalize-pair',
])

const OPERATION_LABELS: Record<ColoringBookStudioOperation, string> = {
  'generate-color-proposals': 'color candidate',
  'accept-color': 'color acceptance',
  'generate-bw': 'B&W counterpart',
  'accept-bw': 'B&W acceptance',
  'finalize-pair': 'pair finalization',
}

const IMAGE_PATH = /\.(?:webp|png|jpe?g)$/i

function compact(value: string): string {
  return value.replace(/\r/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeOperation(value: unknown): ColoringBookStudioOperation {
  const operation = compact(String(value || 'generate-color-proposals')).toLowerCase()
  if (!OPERATIONS.has(operation as ColoringBookStudioOperation)) {
    throw createError({ statusCode: 400, message: 'Invalid coloring-book operation.' })
  }
  return operation as ColoringBookStudioOperation
}

function normalizeSourcePath(
  value: unknown,
  bookSlug: string,
  operation: ColoringBookStudioOperation,
): string | null {
  const raw = String(value || '').trim().replace(/\\/g, '/')
  if (!raw) return null
  if (operation !== 'accept-color' && operation !== 'accept-bw') {
    throw createError({
      statusCode: 400,
      message: 'Existing asset paths are supported only for color or B&W acceptance.',
    })
  }

  const prefix = `projects/coloring-book/sets/${bookSlug}/`
  const path = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
  if (raw.startsWith('projects/') && !raw.startsWith(prefix)) {
    throw createError({ statusCode: 400, message: 'The selected asset belongs to another set.' })
  }
  if (
    !path ||
    path.startsWith('/') ||
    path.includes(':') ||
    path.split('/').includes('..') ||
    !IMAGE_PATH.test(path)
  ) {
    throw createError({
      statusCode: 400,
      message: 'The selected asset path is not a safe image inside this book set.',
    })
  }
  return path
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event)) as Partial<ColoringBookRenderRequest> | null
    const operation = normalizeOperation(body?.operation)
    const bookSlug = compact(String(body?.bookSlug || '')).toLowerCase()
    const proposalId = compact(String(body?.proposalId || '')).toLowerCase()
    const force = body?.force === true
    const note = compact(String(body?.note || '')).slice(0, 500)

    if (!coloringBookConfig(bookSlug) || !proposalBelongsToBook(bookSlug, proposalId)) {
      throw createError({ statusCode: 400, message: 'Invalid book or proposal id.' })
    }
    const sourcePath = normalizeSourcePath(body?.sourcePath, bookSlug, operation)
    if (force && operation !== 'generate-color-proposals' && operation !== 'generate-bw') {
      throw createError({
        statusCode: 400,
        message: 'Forced revisions are supported only for color and B&W generation.',
      })
    }
    if (force && sourcePath) {
      throw createError({
        statusCode: 400,
        message: 'Existing asset adoption cannot be combined with a forced revision.',
      })
    }

    const eventFiles = (await conductorList('color-art-events')) ?? []
    const alreadyQueued = eventFiles.some(
      (entry) => entry.type === 'file' && entry.name.includes(`-${proposalId}-`),
    )
    if (alreadyQueued) {
      throw createError({
        statusCode: 409,
        message: `${proposalId} already has a queued Coloring Book Studio action.`,
      })
    }

    const requestedAt = new Date()
    const stamp = requestedAt.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z')
    const suffix = randomUUID().slice(0, 8)
    const path = `color-art-events/${stamp}-${proposalId}-${operation}-${suffix}.yaml`
    const label = OPERATION_LABELS[operation]
    const sourceLabel = sourcePath ? ` from ${sourcePath}` : ''
    const defaultNote = force
      ? `${proposalId} ${label} revision requested from the production studio.`
      : `${proposalId} ${label}${sourceLabel} requested from the production studio.`
    const content = [
      'version: 1',
      `operation: ${operation}`,
      `book: ${bookSlug}`,
      'proposal_ids:',
      `  - ${proposalId}`,
      ...(sourcePath ? [`source_path: ${JSON.stringify(sourcePath)}`] : []),
      'timeout: 600',
      `force: ${force ? 'true' : 'false'}`,
      'requested_by: kind-robots-coloring-studio',
      'task: coloring-book/t-028',
      `note: ${JSON.stringify(note || defaultNote)}`,
      '',
    ].join('\n')

    await conductorPut(
      path,
      content,
      `coloring-book: request ${proposalId} ${label}${force ? ' revision' : sourceLabel}`,
    )

    return {
      success: true,
      message: `${proposalId} ${label}${force ? ' revision' : sourceLabel} queued in Conductor.`,
      data: {
        operation,
        bookSlug,
        proposalId,
        sourcePath,
        force,
        eventPath: path,
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to request a coloring-book action.',
      statusCode,
    }
  }
})
