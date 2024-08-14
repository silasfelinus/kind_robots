// servers/api/products/[id].get.ts
import { defineEventHandler } from 'h3'
import type { Product } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) {
      throw new Error('Invalid ID.')
    }

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error('Product not found.')
    }

    return {
      success: true,
      product,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode,
    }
  }
})

// Function to fetch a single Product by ID
export async function fetchProductById(id: number): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { id },
  })
}
