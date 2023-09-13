// /server/api/chatrooms/post.ts
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { name, host, description, image, theme, nsfw } = await readBody(event)

    // Ensuring the host exists before creating a chat room
    const hostExists = await prisma.user.findUnique({ where: { username: host } })
    if (!hostExists) {
      throw new Error('Host does not exist')
    }

    const newChatRoom = await prisma.chatRoom.create({
      data: {
        name,
        host,
        description,
        image,
        theme,
        nsfw
      }
    })

    return { success: true, data: newChatRoom }
  } catch (error: any) {
    console.error('Error in adding chatroom:', error.message)
    const { message, statusCode } = errorHandler(error)
    return { success: false, message: `Failed to create a new chat room: ${message}`, statusCode }
  }
})
