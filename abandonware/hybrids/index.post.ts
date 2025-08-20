// /server/api/hybrids/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import type { Hybrid } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response

  try {
    // 🔒 Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // 🧠 Read and validate the hybrid data
    const body = await readBody<Partial<Hybrid>>(event)
    const required = [
      'name',
      'animalOne',
      'animalTwo',
      'blend',
      'promptString',
      'result',
    ]
    const missing = required.filter((key) => !body[key as keyof Hybrid])

    if (missing.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required field(s): ${missing.join(', ')}`,
      })
    }

    // 🚫 Ensure userId in body (if any) matches token
    if (body.userId && body.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID in request does not match the authenticated user.',
      })
    }

    // ✅ Create new hybrid
    const hybrid = await prisma.hybrid.create({
      data: {
        name: body.name!,
        animalOne: body.animalOne!,
        animalTwo: body.animalTwo!,
        blend: body.blend!,
        promptString: body.promptString!,
        result: body.result!,
        user: { connect: { id: authenticatedUserId } },
        ...(body.artId && { art: { connect: { id: body.artId } } }),
        ...(body.artImageId && {
          artImage: { connect: { id: body.artImageId } },
        }),
        ...(body.promptId && { prompt: { connect: { id: body.promptId } } }),
      },
    })

    response = {
      success: true,
      message: 'Hybrid created successfully.',
      data: hybrid,
      statusCode: 201,
    }
    event.node.res.statusCode = 201
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    response = {
      success: false,
      message: message || 'Failed to create hybrid',
      statusCode: statusCode || 500,
    }
  }

  return response
})
