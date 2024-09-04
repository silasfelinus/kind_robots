// /server/api/carts/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    // Fetch all carts from the database
    const carts = await prisma.cart.findMany({
      include: {
        items: true, // Optionally include related CartItems if needed
      },
    })

    return { success: true, carts }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
