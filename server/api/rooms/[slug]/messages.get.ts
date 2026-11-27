// GET /api/rooms/:slug/messages?after=<id> -- poll a live group chat room.
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  listRoomMessages,
  requireChatMember,
  roomFromEvent,
} from '~/server/utils/chatRooms'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireChatMember(event)
    const { spec, room } = await roomFromEvent(event)
    const after = Number(getQuery(event).after)
    const messages = await listRoomMessages(
      room.id,
      { id: auth.user.id, isAdmin: auth.isAdmin },
      Number.isSafeInteger(after) && after > 0 ? after : null,
    )
    setHeader(event, 'Cache-Control', 'private, no-store')
    return {
      success: true,
      statusCode: 200,
      message: 'Messages loaded.',
      data: {
        room: {
          slug: spec.slug,
          title: spec.title,
          welcome: spec.welcome,
          isOpen: room.isOpen,
        },
        messages,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
