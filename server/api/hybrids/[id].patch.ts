// /server/api/hybrids/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id || id <= 0) throw createError({ statusCode: 400, message: 'Invalid hybrid ID' })

  try {
    const body = await readBody(event)

    const updated = await prisma.hybrid.update({
      where: { id },
      data: {
        name: body.name,
        result: body.result,
        promptString: body.promptString,
        artId: body.artId,
        artImageId: body.artImageId,
        promptId: body.promptId,
      },
    })

    return {
      success: true,
      message: 'Hybrid updated successfully.',
      data: updated,
      statusCode: 200,
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