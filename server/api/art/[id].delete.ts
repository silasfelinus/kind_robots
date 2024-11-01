import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    console.log('Verification Result:', verificationResult) // DEBUG: Log verification result
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const artEntry = await prisma.art.findUnique({ where: { id } })
    if (!artEntry) {
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${id} does not exist.`,
      })
    }

    if (artEntry.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this art entry.',
      })
    }

    await prisma.art.delete({ where: { id } })

    return {
      success: true,
      message: `Art entry with ID ${id} deleted successfully.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.log('Error Handled:', handledError) // DEBUG: Log error details
    return {
      success: false,
      message:
        handledError.message || `Failed to delete art entry with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
