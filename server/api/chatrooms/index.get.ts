import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        isActive: true
      }
    })
    return { success: true, data: chatRooms }
  } catch (error: any) {
    console.error('Error in fetching chatrooms:', error.message)
    const { message } = errorHandler(error)
    return { success: false, message }
  }
})
