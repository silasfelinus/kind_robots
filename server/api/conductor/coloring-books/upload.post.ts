import { createError, defineEventHandler, readBody } from 'h3'
import type { ColoringBookUploadRequest } from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { conductorPut } from '@/server/utils/conductor-github'
import {
  coloringBookConfig,
  COLORING_BOOK_ROOT,
  proposalBelongsToBook,
} from '@/server/utils/coloringBookStudio'
import {
  assertNoQueuedColoringBookEvent,
  queueColoringBookEvent,
} from '@/server/utils/coloringBookEvents'

const MAX_BYTES = 12 * 1024 * 1024
const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/

function sniff(bytes: Buffer): 'png' | 'jpeg' | 'webp' | null {
  if (
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

// Upload a hand-made version (e.g. a ChatGPT render) of a page's color or B&W
// image into the Conductor set, then queue its adoption as the accepted master.
// The replaced master stays selectable in the version strip (Silas, 2026-11-04 PT).
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(
      event,
    )) as Partial<ColoringBookUploadRequest> | null
    const bookSlug = String(body?.bookSlug || '')
      .trim()
      .toLowerCase()
    const proposalId = String(body?.proposalId || '')
      .trim()
      .toLowerCase()
    const variant =
      body?.variant === 'bw' ? 'bw' : body?.variant === 'color' ? 'color' : null
    const config = coloringBookConfig(bookSlug)
    if (!config || !proposalBelongsToBook(bookSlug, proposalId) || !variant) {
      throw createError({
        statusCode: 400,
        message: 'Invalid book, proposal id, or variant.',
      })
    }

    const match = DATA_URL.exec(String(body?.dataUrl || ''))
    if (!match) {
      throw createError({
        statusCode: 400,
        message: 'Upload a PNG, JPEG, or WebP image.',
      })
    }
    const bytes = Buffer.from(match[2]!.replace(/\s/g, ''), 'base64')
    if (!bytes.length || bytes.length > MAX_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Images must be 12 MB or smaller.',
      })
    }
    const kind = sniff(bytes)
    if (!kind) {
      throw createError({
        statusCode: 400,
        message: 'That file is not a PNG, JPEG, or WebP image.',
      })
    }

    const stamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)
    const extension = kind === 'jpeg' ? 'jpg' : kind
    const relative = `uploads/${proposalId}-${variant}-${stamp}.${extension}`
    const repoPath = `${COLORING_BOOK_ROOT}/sets/${bookSlug}/${relative}`
    const label = variant === 'bw' ? 'B&W' : 'color'

    // Check before writing so a refused request leaves no orphaned upload.
    await assertNoQueuedColoringBookEvent(proposalId, proposalId)
    await conductorPut(
      repoPath,
      bytes,
      `coloring-book: upload ${proposalId} ${label} version`,
    )
    const eventPath = await queueColoringBookEvent({
      operation: variant === 'bw' ? 'accept-bw' : 'accept-color',
      bookSlug,
      targetKey: proposalId,
      targetLabel: proposalId,
      proposalId,
      sourcePath: relative,
      note: `Uploaded ${label} version adopted from the coloring studio.`,
      commitMessage: `coloring-book: adopt uploaded ${proposalId} ${label}`,
    })

    return {
      success: true,
      message: `Uploaded. ${proposalId} will switch to the new ${label} version on Conductor's next studio run.`,
      data: { bookSlug, proposalId, variant, path: relative, eventPath },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to upload the image.',
      statusCode,
    }
  }
})
