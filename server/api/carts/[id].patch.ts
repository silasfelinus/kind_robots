// /server/api/carts/[id].patch.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Get cartId from the request params
    const cartId = Number(event.context.params?.id)
    if (!Number.isInteger(cartId) || cartId <= 0) {
      return { success: false, message: 'Invalid cart ID.', statusCode: 400 }
    }

    // Parse the request body to get the data to update
    const updateData = await readBody(event)

    // Validate the update data (in this case, only customerId is allowed)
    if (!updateData.customerId || typeof updateData.customerId !== 'number') {
      return {
        success: false,
        message: 'Invalid or missing customerId.',
        statusCode: 400,
      }
    }

    // Check if the cart exists
    const existingCart = await prisma.cart.findUnique({
      where: { id: cartId },
    })
    if (!existingCart) {
      return { success: false, message: 'Cart not found.', statusCode: 404 }
    }

    // Update the cart with the provided data
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        customerId: updateData.customerId,
      },
    })

    // Return the updated cart information
    return { success: true, updatedCart }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
