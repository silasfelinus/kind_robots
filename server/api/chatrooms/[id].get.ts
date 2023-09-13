// /server/api/chatrooms/[id].get.ts
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) {
      throw new Error('Invalid chat room ID.')
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id },
      include: { messages: true } // Including messages related to the chat room
    })

    if (!chatRoom) {
      throw new Error(`Chat room with id ${id} does not exist.`)
    }

    return { success: true, data: chatRoom }
  } catch (error: any) {
    console.error('Error in getting chatroom:', error.message)
    const { message } = errorHandler(error)
    return { success: false, message }
  }
})
