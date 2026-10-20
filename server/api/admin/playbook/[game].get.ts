import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  resolvePlaybookGame,
  serializePlaybookEdit,
  serializePlaybookNote,
} from '~/server/utils/playbook'

// Playbook Manager (conductor weird-humboldt t-033): every saved overlay and note for one game.
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const game = resolvePlaybookGame(getRouterParam(event, 'game'))
    const [edits, notes] = await Promise.all([
      prisma.playbookEdit.findMany({ where: { gameSlug: game } }),
      prisma.playbookNote.findMany({
        where: { gameSlug: game },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
    ])
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Playbook fetched.',
      data: {
        game,
        edits: edits.map(serializePlaybookEdit),
        notes: notes.map(serializePlaybookNote),
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
