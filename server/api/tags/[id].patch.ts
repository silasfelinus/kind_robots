import { defineEventHandler, readBody } from 'h3'
import type { Tag } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid tag ID.')

    const existingTag = await prisma.tag.findUnique({ where: { id } })
    if (!existingTag) {
      return { success: false, message: 'Tag not found.' }
    }

    const tagData: Partial<Tag> = await readBody(event)
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: tagData,
    })

    return { success: true, tag: updatedTag }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
