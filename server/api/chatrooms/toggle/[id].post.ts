// /server/api/chatrooms/id/[id]/toggle.ts
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      throw new TypeError('Invalid chat room ID')
    }

    const chatRoom = await prisma.chatRoom.findUnique({ where: { id } })

    if (!chatRoom) {
      throw new Error('Chat room not found')
    }

    const updatedChatRoom = await prisma.chatRoom.update({
      where: { id },
      data: { isActive: !chatRoom.isActive }
    })

    return { success: true, chatRoom: updatedChatRoom }
  } catch (error: any) {
    console.error('Error in toggling chatroom active status:', error.message)
    const { message } = errorHandler(error)
    return { success: false, message }
  }
})
