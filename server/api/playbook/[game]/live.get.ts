import { defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { parseStoredEdit, resolvePlaybookGame } from '~/server/utils/playbook'

// Public: the Playbook Manager edits an admin has marked live, keyed by beat.
// The game applies them over its authored text; drafts never leave the admin page.
export default defineEventHandler(async (event) => {
  try {
    const game = resolvePlaybookGame(getRouterParam(event, 'game'))
    const rows = await prisma.playbookEdit.findMany({
      where: { gameSlug: game, live: true },
      select: { nodeKey: true, content: true },
    })
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Live playbook edits fetched.',
      data: Object.fromEntries(
        rows.map((row) => [row.nodeKey, parseStoredEdit(row.content)]),
      ),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
