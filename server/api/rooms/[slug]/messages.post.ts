// POST /api/rooms/:slug/messages { body } -- say something in a room.
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  postRoomMessage,
  requireChatMember,
  roomFromEvent,
} from '~/server/utils/chatRooms'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireChatMember(event)
    const { room } = await roomFromEvent(event)
    if (!room.isOpen) {
      throw createError({
        statusCode: 423,
        message: 'This room is closed for now.',
      })
    }
    const body = (await readBody<{ body?: unknown }>(event)) ?? {}
    const message = await postRoomMessage(room.id, auth.user.id, body.body)
    return {
      success: true,
      statusCode: 200,
      message: 'Sent.',
      data: { id: message.id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
