import { createError, defineEventHandler, readBody } from 'h3'
import type {
  ColoringBookBwSource,
  ColoringBookRenderRequest,
  ColoringBookStudioOperation,
} from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { queueColoringBookEvent } from '@/server/utils/coloringBookEvents'
import { resolveColoringRenderSettings } from '@/server/utils/coloringBookRenderOptions'
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
  'generate-cover',
  'accept-cover',
  'finalize-cover',
])

const COVER_OPERATIONS = new Set<ColoringBookStudioOperation>([
  'generate-cover',
  'accept-cover',
  'finalize-cover',
])

const OPERATION_LABELS: Record<ColoringBookStudioOperation, string> = {
  'generate-color-proposals': 'color candidate',
  'accept-color': 'color acceptance',
  'generate-bw': 'B&W counterpart',
  'accept-bw': 'B&W acceptance',
  'finalize-pair': 'pair finalization',
  'generate-cover': 'cover candidate',
  'accept-cover': 'cover acceptance',
  'finalize-cover': 'cover finalization',
}

const IMAGE_PATH = /\.(?:webp|png|jpe?g)$/i

const BW_SOURCES = new Set<ColoringBookBwSource>(['color', 'version', 'prompt'])

const BW_SOURCE_LABELS: Record<ColoringBookBwSource, string> = {
  color: 'from the accepted color',
  version: 'from the selected version',
  prompt: 'fresh from the prompt',
}

function normalizeBwSource(
  value: unknown,
  operation: ColoringBookStudioOperation,
): ColoringBookBwSource | null {
  if (value === undefined || value === null || value === '') return null
  if (operation !== 'generate-bw') {
    throw createError({
      statusCode: 400,
      message: 'A B&W source applies only to B&W generation.',
    })
  }
  const source = compact(String(value)).toLowerCase()
  if (!BW_SOURCES.has(source as ColoringBookBwSource)) {
    throw createError({
      statusCode: 400,
      message: 'B&W source must be color, version, or prompt.',
    })
  }
  return source as ColoringBookBwSource
}

function compact(value: string): string {
  return value.replace(/\r/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeOperation(value: unknown): ColoringBookStudioOperation {
  const operation = compact(
    String(value || 'generate-color-proposals'),
  ).toLowerCase()
  if (!OPERATIONS.has(operation as ColoringBookStudioOperation)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid coloring-book operation.',
    })
  }
  return operation as ColoringBookStudioOperation
}

function normalizeSourcePath(
  value: unknown,
  bookSlug: string,
  operation: ColoringBookStudioOperation,
  bwSource: ColoringBookBwSource | null,
): string | null {
  const raw = String(value || '')
    .trim()
    .replace(/\\/g, '/')
  if (!raw) return null
  const acceptance =
    operation === 'accept-color' ||
    operation === 'accept-bw' ||
    operation === 'accept-cover'
  if (!acceptance && !(operation === 'generate-bw' && bwSource === 'version')) {
    throw createError({
      statusCode: 400,
      message:
        'Existing asset paths are supported only for acceptance, or a B&W made from a selected version.',
    })
  }

  const prefix = `projects/coloring-book/sets/${bookSlug}/`
  const path = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
  if (raw.startsWith('projects/') && !raw.startsWith(prefix)) {
    throw createError({
      statusCode: 400,
      message: 'The selected asset belongs to another set.',
    })
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
      message:
        'The selected asset path is not a safe image inside this book set.',
    })
  }
  return path
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(
      event,
    )) as Partial<ColoringBookRenderRequest> | null
    const operation = normalizeOperation(body?.operation)
    const coverOperation = COVER_OPERATIONS.has(operation)
    const bookSlug = compact(String(body?.bookSlug || '')).toLowerCase()
    const proposalId = compact(String(body?.proposalId || '')).toLowerCase()
    const force = body?.force === true
    const note = compact(String(body?.note || '')).slice(0, 500)
    const config = coloringBookConfig(bookSlug)

    if (!config) {
      throw createError({
        statusCode: 400,
        message: 'Invalid coloring-book slug.',
      })
    }
    if (!coverOperation && !proposalBelongsToBook(bookSlug, proposalId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid book or proposal id.',
      })
    }
    if (coverOperation && proposalId) {
      throw createError({
        statusCode: 400,
        message:
          'Cover operations target the selected book and do not accept a proposal id.',
      })
    }

    const bwSource = normalizeBwSource(body?.bwSource, operation)
    const sourcePath = normalizeSourcePath(
      body?.sourcePath,
      bookSlug,
      operation,
      bwSource,
    )
    if (bwSource === 'version' && !sourcePath) {
      throw createError({
        statusCode: 400,
        message: 'Choose which color or B&W version the new B&W starts from.',
      })
    }
    if (
      force &&
      operation !== 'generate-color-proposals' &&
      operation !== 'generate-bw' &&
      operation !== 'generate-cover'
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Forced revisions are supported only for color, B&W, and cover generation.',
      })
    }
    if (force && sourcePath && operation !== 'generate-bw') {
      throw createError({
        statusCode: 400,
        message:
          'Existing asset adoption cannot be combined with a forced revision.',
      })
    }

    if (body?.renderSettings && operation !== 'generate-color-proposals') {
      throw createError({
        statusCode: 400,
        message: 'Render settings apply only to color generation.',
      })
    }
    const renderSettings = body?.renderSettings
      ? await resolveColoringRenderSettings(body.renderSettings)
      : null

    const targetKey = coverOperation ? `${bookSlug}-cover` : proposalId
    const targetLabel = coverOperation ? `${config.title} cover` : proposalId
    const label = OPERATION_LABELS[operation]
    const sourceLabel = sourcePath ? ` from ${sourcePath}` : ''
    const bwLabel =
      bwSource && bwSource !== 'version' ? ` ${BW_SOURCE_LABELS[bwSource]}` : ''
    const defaultNote = force
      ? `${targetLabel} ${label} revision${bwLabel}${sourceLabel} requested from the production studio.`
      : `${targetLabel} ${label}${sourceLabel} requested from the production studio.`
    const path = await queueColoringBookEvent({
      operation,
      bookSlug,
      targetKey,
      targetLabel,
      proposalId: coverOperation ? undefined : proposalId,
      sourcePath,
      bwSource,
      force,
      note: note || defaultNote,
      renderSettings,
      commitMessage: `coloring-book: request ${targetLabel} ${label}${force ? ' revision' : ''}${bwLabel}${sourceLabel}`,
    })

    return {
      success: true,
      message: `${targetLabel} ${label}${force ? ' revision' : ''}${bwLabel}${sourceLabel} queued in Conductor.`,
      data: {
        operation,
        bookSlug,
        proposalId: coverOperation ? undefined : proposalId,
        sourcePath,
        bwSource,
        force,
        renderSettings,
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
