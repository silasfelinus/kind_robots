// DELETE /api/rooms/messages/:id -- the author or an admin hides a message.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { hideRoomMessage, requireChatMember } from '~/server/utils/chatRooms'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireChatMember(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid message id.' })
    }
    await hideRoomMessage(id, { id: auth.user.id, isAdmin: auth.isAdmin })
    return {
      success: true,
      statusCode: 200,
      message: 'Message removed.',
      data: { id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
