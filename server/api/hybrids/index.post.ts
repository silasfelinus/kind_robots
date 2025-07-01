// /server/api/hybrids/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const required = [
      'name',
      'animalOne',
      'animalTwo',
      'blend',
      'promptString',
      'result',
    ]
    for (const field of required) {
      if (!body[field]) {
        throw createError({
          statusCode: 400,
          message: `Missing required field: ${field}`,
        })
      }
    }

    const hybrid = await prisma.hybrid.create({
      data: {
        name: body.name,
        animalOne: body.animalOne,
        animalTwo: body.animalTwo,
        blend: body.blend,
        promptString: body.promptString,
        result: body.result,
        userId: body.userId || null,
        artId: body.artId || null,
        artImageId: body.artImageId || null,
        promptId: body.promptId || null,
      },
    })

    return {
      success: true,
      message: 'Hybrid created successfully.',
      data: hybrid,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    return {
      success: false,
      message: handled.message,
      statusCode: handled.statusCode || 500,
    }
  }
})
