// /server/api/chatrooms/id/[id].post.ts
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) {
      return { success: false, message: 'Chat room ID is missing or invalid' }
    }

    const { content, sender } = await readBody(event)

    // Check if the chat room is inactive
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id }
    })

    if (!chatRoom) {
      return { success: false, message: 'Chat room not found' }
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        sender,
        chatRoomId: id
      }
    })

    return { success: true, data: newMessage }
  } catch (error: any) {
    console.error('Error in adding message:', error.message)
    const { message } = errorHandler(error)
    return { success: false, message }
  }
})
