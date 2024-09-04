// /server/api/items/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const cartItem = await getCartItemById(id)

    if (!cartItem) {
      return { success: false, message: 'CartItem not found', statusCode: 404 }
    }

    return { success: true, cartItem }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to retrieve a CartItem by ID
export async function getCartItemById(id: number) {
  return await prisma.cartItem.findUnique({
    where: { id },
  })
}
