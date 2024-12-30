// /server/api/chats/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Chat } from '@prisma/client'

type ChatsResponse = {
  success: boolean
  message?: string
  data: Chat[]
  statusCode?: number
}

export default defineEventHandler(async (): Promise<ChatsResponse> => {
  let response: ChatsResponse
  try {
    // Fetch all chats
    const data: Chat[] = await prisma.chat.findMany()

    // Return success response with chats data
    response = {
      success: true,
      data,
      message: 'Chats fetched successfully.',
      statusCode: 200,
    }
  } catch (error) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error)
    response = {
      success: false,
      data: [], // Ensure data is an empty array on failure
      message: handledError.message || 'Failed to fetch chats.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
