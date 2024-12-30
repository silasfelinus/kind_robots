// server/api/art/image/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async () => {
  try {
    console.log('inside art images global  fetch')
    const data = await prisma.artImage.findMany()

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No art images found.',
      }
    }

    console.log('finished fetch')

    // Return the found art images wrapped in a data object
    return { success: true, data }
  } catch (error) {
    return errorHandler(error)
  }
})
