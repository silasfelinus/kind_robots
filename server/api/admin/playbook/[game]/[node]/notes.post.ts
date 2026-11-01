import { defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  normalizePlaybookNote,
  resolvePlaybookGame,
  resolvePlaybookNoteTarget,
  serializePlaybookNote,
} from '~/server/utils/playbook'

// A comment, an image flag, a submitted image or an art request on one beat,
// or a comment on a whole section or person (the Forge gallery).
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const game = resolvePlaybookGame(getRouterParam(event, 'game'))
    const nodeKey = resolvePlaybookNoteTarget(
      game,
      getRouterParam(event, 'node', { decode: true }),
    )
    const note = normalizePlaybookNote(await readBody(event))
    const row = await prisma.playbookNote.create({
      data: { ...note, gameSlug: game, nodeKey, authorId: auth.user.id },
    })
    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Note added.',
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
