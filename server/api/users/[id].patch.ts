// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import { hashPassword, validatePassword, verifyJwtToken } from '../auth'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { User } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let userId: number | null = null

  try {
    // Parse and validate the user ID from the URL params
    userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid User ID.',
      })
    }

    // Extract and validate the JWT token
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
    if (!verificationResult || verificationResult.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this user.',
      })
    }

    // Fetch the existing user to ensure it exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!existingUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found.',
      })
    }

    // Parse the incoming request body as partial User data, excluding password
    const data: Partial<User> = await readBody(event)

    // Handle password update if present in request data
    const updateData: Partial<User> = { ...data }
    if ('password' in data) {
      const passwordValidation = validatePassword(data.password as string)
      if (!passwordValidation.isValid) {
        throw createError({
          statusCode: 400,
          message: passwordValidation.message,
        })
      }
      updateData.password = await hashPassword(data.password as string)
    }

    // Update the user in the database with the provided fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return {
      success: true,
      user: updatedUser,
      message: 'User updated successfully.',
    }
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: `Updating user with ID ${userId}`,
    })
  }
})
