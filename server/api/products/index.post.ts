// /server/api/products/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { Product } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const productData: Partial<Product> = await readBody(event)

    // Validate name
    if (!productData.name || typeof productData.name !== 'string') {
      throw new Error('Invalid product name.')
    }

    // Validate title
    if (!productData.title || typeof productData.title !== 'string') {
      throw new Error('Invalid product title.')
    }

    // Validate category
    if (!productData.category || typeof productData.category !== 'string') {
      throw new Error('Invalid product category.')
    }

    // Validate costInPennies
    if (
      productData.costInPennies &&
      (productData.costInPennies <= 0 || !Number.isInteger(productData.costInPennies))
    ) {
      throw new Error('Invalid cost in pennies.')
    }

    const newProduct = await createProduct(productData)
    return { success: true, newProduct }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to create a new Product
export async function createProduct(product: Partial<Product>): Promise<Product> {
  try {
    if (!product.name || !product.title) {
      throw new Error('we need a name and title')
    }
    return await prisma.product.create({
      data: {
        name: product.name,
        title: product.title,
        category: product.category,
        costInPennies: product.costInPennies || 99
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
