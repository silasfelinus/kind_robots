import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { serializePlaybookNote } from '~/server/utils/playbook'

// Resolve or reopen a Playbook note. Notes are never deleted, so the history stays.
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0)
      throw createError({ statusCode: 400, message: 'Note id is required.' })
    const body = await readBody<{ resolved?: unknown }>(event)
    const row = await prisma.playbookNote.update({
      where: { id },
      data: { resolved: body?.resolved === true },
    })
    event.node.res.statusCode = 200
    return {
      success: true,
      message: row.resolved ? 'Note resolved.' : 'Note reopened.',
      data: serializePlaybookNote(row),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
