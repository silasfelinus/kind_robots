import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, toComicIssueDto } from '@/server/utils/comicStudio'
import { COMIC_ISSUE_FIELDS, normalizeComicUpdate } from '~/utils/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'issue id')
    const issue = await prisma.comicIssue.findUnique({ where: { id } })
    if (!issue)
      throw createError({ statusCode: 404, message: 'Issue not found.' })
    const { data, errors } = normalizeComicUpdate(
      await readBody(event),
      COMIC_ISSUE_FIELDS,
    )
    if (typeof data.number === 'number' && data.number !== issue.number) {
      const clash = await prisma.comicIssue.findFirst({
        where: { seriesId: issue.seriesId, number: data.number },
        select: { id: true },
      })
      if (clash) errors.push(`Issue ${data.number} already exists.`)
    }
    if (errors.length)
      throw createError({ statusCode: 400, message: errors.join(' ') })
    const updated = await prisma.comicIssue.update({ where: { id }, data })
    return {
      success: true,
      statusCode: 200,
      message: 'Issue saved.',
      data: toComicIssueDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
