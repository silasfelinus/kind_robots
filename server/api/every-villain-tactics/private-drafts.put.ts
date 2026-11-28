import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  MAX_PRIVATE_DRAFT_BYTES,
  PRIVATE_DRAFT_SLUG,
  applyPrivateDraftCommand,
  newPrivateDraftArchive,
  parsePrivateDraftLibrary,
} from '~/utils/everyVillainTactics/privateDrafts'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to save drafts.' })
    const raw: unknown = await readBody(event)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw createError({ statusCode: 400, message: 'Invalid draft request.' })
    const input = raw as { command?: unknown; expectedRevision?: unknown }
    if (
      input.expectedRevision !== null &&
      (typeof input.expectedRevision !== 'number' ||
        !Number.isSafeInteger(input.expectedRevision) ||
        input.expectedRevision < 0)
    )
      throw createError({ statusCode: 400, message: 'Read your shelf first.' })
    const conflict = () =>
      createError({
        statusCode: 409,
        message: 'Another device saved first. Refresh your private shelf.',
      })
    const owner = { userId: user.id, gameSlug: PRIVATE_DRAFT_SLUG }
    const row = await prisma.arcadeCabinetSave.findUnique({
      where: { userId_gameSlug: owner },
      select: { payload: true, revision: true },
    })
    if ((row?.revision ?? null) !== input.expectedRevision) throw conflict()
    const previous = row
      ? parsePrivateDraftLibrary(row.payload)
      : newPrivateDraftArchive().library
    const result = applyPrivateDraftCommand(
      previous,
      input.command,
      new Date().toISOString(),
    )
    if (!result.ok)
      throw createError({ statusCode: 400, message: result.reason })
    const payload = JSON.stringify(result.library)
    if (new TextEncoder().encode(payload).byteLength > MAX_PRIVATE_DRAFT_BYTES)
      throw createError({ statusCode: 413, message: 'Private shelf is full.' })
    let revision = 0
    if (!row) {
      try {
        await prisma.arcadeCabinetSave.create({
          data: { ...owner, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') throw conflict()
        throw error
      }
    } else {
      const updated = await prisma.arcadeCabinetSave.updateMany({
        where: { ...owner, revision: row.revision },
        data: { payload, revision: { increment: 1 } },
      })
      if (updated.count !== 1) throw conflict()
      revision = row.revision + 1
    }
    return { success: true, data: { library: result.library, revision } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
