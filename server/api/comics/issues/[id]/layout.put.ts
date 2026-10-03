import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, toComicIssueDto } from '@/server/utils/comicStudio'
import {
  comicLayoutAttemptIds,
  comicPlacedSlotIds,
  normalizeComicIssueLayout,
} from '~/utils/comicLayouts'

type LayoutBody = { baseVersion?: unknown; layout?: unknown }

const MAX_LAYOUT_BYTES = 512 * 1024

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'issue id')
    const issue = await prisma.comicIssue.findUnique({ where: { id } })
    if (!issue)
      throw createError({ statusCode: 404, message: 'Issue not found.' })
    const body = (await readBody<LayoutBody>(event)) ?? {}
    if (Number(body.baseVersion) !== issue.layoutVersion) {
      event.node.res.statusCode = 409
      return {
        success: false,
        statusCode: 409,
        message:
          'The pages changed somewhere else. Reloaded the latest version.',
        data: toComicIssueDto(issue),
      }
    }
    const layout = normalizeComicIssueLayout(body.layout)
    const serialized = JSON.stringify(layout)
    if (serialized.length > MAX_LAYOUT_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'This issue layout is too large to save.',
      })
    }
    const slotIds = [...comicPlacedSlotIds(layout)]
    const attemptIds = [...comicLayoutAttemptIds(layout)]
    const [slots, attempts] = await Promise.all([
      slotIds.length
        ? prisma.comicSlot.count({
            where: { id: { in: slotIds }, seriesId: issue.seriesId },
          })
        : 0,
      attemptIds.length
        ? prisma.comicAttempt.count({
            where: {
              id: { in: attemptIds },
              Slot: { seriesId: issue.seriesId },
            },
          })
        : 0,
    ])
    if (slots !== slotIds.length || attempts !== attemptIds.length) {
      throw createError({
        statusCode: 400,
        message: 'Every panel and its art must belong to this series.',
      })
    }
    const updated = await prisma.comicIssue.update({
      where: { id },
      data: { layout: serialized, layoutVersion: { increment: 1 } },
    })
    return {
      success: true,
      statusCode: 200,
      message: 'Pages saved.',
      data: toComicIssueDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
