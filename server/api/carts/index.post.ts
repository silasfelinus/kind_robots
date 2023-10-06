// /server/api/carts/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import { Cart } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const cartData: Partial<Cart> = await readBody(event)
    const newCart = await createCart(cartData)
    return { success: true, newCart }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to create a new Cart
export async function createCart(cart: Partial<Cart>): Promise<Cart> {
  try {
    // Validate customerId
    if (!Number.isInteger(cart.customerId) || cart.customerId <= 0) {
      throw new Error('Invalid customerId.')
    }

    const customerExists = await prisma.customer.findUnique({ where: { id: cart.customerId } })
    if (!customerExists) {
      throw new Error('Customer does not exist.')
    }

    return await prisma.cart.create({
      data: {
        customerId: cart.customerId
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
