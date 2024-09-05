// /server/api/items/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Fetch all cart items
    const cartItems = await getAllCartItems()

    if (!cartItems || cartItems.length === 0) {
      return { success: false, message: 'No cart items found', statusCode: 404 }
    }

    return { success: true, cartItems }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to retrieve all CartItems
export async function getAllCartItems() {
  return await prisma.cartItem.findMany() // Fetches all cart items
}
