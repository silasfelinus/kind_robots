import { defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  isEmptyEdit,
  normalizePlaybookEdit,
  resolvePlaybookGame,
  resolvePlaybookNode,
  serializePlaybookEdit,
} from '~/server/utils/playbook'

type PlaybookEditBody = { content?: unknown; live?: unknown }

// Saves (or clears) one beat's overlay. An empty overlay deletes the row, which
// returns the beat to its authored text.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const game = resolvePlaybookGame(getRouterParam(event, 'game'))
    const nodeKey = resolvePlaybookNode(
      game,
      getRouterParam(event, 'node', { decode: true }),
      { editable: true },
    )
    const body = await readBody<PlaybookEditBody>(event)
    const { content, serialized } = normalizePlaybookEdit(game, body?.content)
    const live = body?.live === true

    if (isEmptyEdit(content)) {
      await prisma.playbookEdit.deleteMany({
        where: { gameSlug: game, nodeKey },
      })
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'Edit cleared; the beat is back to its authored text.',
        data: null,
        statusCode: 200,
      }
    }

    const row = await prisma.playbookEdit.upsert({
      where: { gameSlug_nodeKey: { gameSlug: game, nodeKey } },
      create: {
        gameSlug: game,
        nodeKey,
        content: serialized,
        live,
        updatedById: auth.user.id,
      },
      update: { content: serialized, live, updatedById: auth.user.id },
    })
    event.node.res.statusCode = 200
    return {
      success: true,
      message: live ? 'Edit saved and live in play.' : 'Edit saved as a draft.',
      data: serializePlaybookEdit(row),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
