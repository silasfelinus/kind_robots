// /server/api/carts/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const cartId = Number(event.context.params?.id) // Changed to access 'id'
    if (isNaN(cartId)) {
      return { success: false, message: 'Invalid cart ID.', statusCode: 400 }
    }

    // Fetch the cart to ensure it exists
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!cart) {
      return { success: false, message: 'Cart not found.', statusCode: 404 }
    }

    // Fetch cart items
    const items = await fetchCartItems(cartId)

    return {
      success: true,
      cart,
      items,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all CartItems for a specific Cart
export async function fetchCartItems(cartId: number) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId },
    })
    return cartItems
  } catch (error: unknown) {
    // Log the actual error to help with debugging
    console.error('Error fetching cart items:', error)
    throw new Error('Database error: Failed to fetch cart items.')
  }
}
