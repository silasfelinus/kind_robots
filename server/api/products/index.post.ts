// /server/api/products/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { type Product } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const productData: Partial<Product> = await readBody(event)

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
      productData.costInPennies !== undefined &&
      (productData.costInPennies <= 0 || !Number.isInteger(productData.costInPennies))
    ) {
      throw new Error('Invalid cost in pennies.')
    }

    // If all validations pass, create the new product
    const newProduct = await createProduct(productData)
    return { success: true, newProduct }
  } catch (error: any) {
    return errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
})

// Function to create a new Product
export async function createProduct(product: Partial<Product>): Promise<Product> {
  try {
    // Explicit type checking for required fields
    if (!product.title || typeof product.title !== 'string') {
      throw new Error('Invalid product title.')
    }
    if (!product.category || typeof product.category !== 'string') {
      throw new Error('Invalid product category.')
    }

    return await prisma.product.create({
      data: {
        title: product.title,
        category: product.category,
        costInPennies: product.costInPennies ?? 99
        // Add other fields here as needed
      }
    })
  } catch (error: any) {
    throw errorHandler({ success: false, message: error.message, statusCode: 500 })
  }
}
