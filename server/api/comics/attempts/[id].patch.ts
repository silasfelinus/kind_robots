import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { attemptDtosForSlots, readComicId } from '@/server/utils/comicStudio'
import {
  applyComicVerdict,
  COMIC_VERDICTS,
  type ComicVerdict,
} from '~/utils/comicStudio'

type VerdictBody = { verdict?: unknown; note?: unknown }

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'attempt id')
    const attempt = await prisma.comicAttempt.findUnique({ where: { id } })
    if (!attempt)
      throw createError({ statusCode: 404, message: 'Attempt not found.' })
    const body = (await readBody<VerdictBody>(event)) ?? {}
    const writes = []
    if (body.verdict !== undefined) {
      if (!COMIC_VERDICTS.includes(body.verdict as ComicVerdict)) {
        throw createError({ statusCode: 400, message: 'Unknown verdict.' })
      }
      const siblings = await prisma.comicAttempt.findMany({
        where: { slotId: attempt.slotId },
        select: {
          id: true,
          slotId: true,
          laneKey: true,
          status: true,
          verdict: true,
          createdAt: true,
        },
      })
      const next = applyComicVerdict(siblings, id, body.verdict as ComicVerdict)
      for (const row of next) {
        const before = siblings.find((sibling) => sibling.id === row.id)
        if (before && before.verdict !== row.verdict) {
          writes.push(
            prisma.comicAttempt.update({
              where: { id: row.id },
              data: { verdict: row.verdict },
            }),
          )
        }
      }
    }
    if (body.note !== undefined) {
      if (body.note !== null && typeof body.note !== 'string') {
        throw createError({ statusCode: 400, message: 'A note must be text.' })
      }
      writes.push(
        prisma.comicAttempt.update({
          where: { id },
          data: {
            note:
              typeof body.note === 'string' && body.note.trim()
                ? body.note.slice(0, 2000)
                : null,
          },
        }),
      )
    }
    if (writes.length) await prisma.$transaction(writes)
    return {
      success: true,
      statusCode: 200,
      message: 'Verdict saved.',
      data: { attempts: await attemptDtosForSlots([attempt.slotId]) },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
