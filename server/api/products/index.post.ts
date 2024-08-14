// /server/api/products/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Product } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const productData: Partial<Product> = await readBody(event)

    // Validate productData
    validateProductData(productData)

    // If all validations pass, create the new product
    const newProduct = await createProduct(productData)
    return { success: true, newProduct }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: handledError.success,
      message: handledError.message,
      statusCode: handledError.statusCode,
    }
  }
})

// Function to validate product data
function validateProductData(productData: Partial<Product>): void {
  if (!productData.title || typeof productData.title !== 'string') {
    throw new Error('Invalid product title.')
  }
  if (!productData.category || typeof productData.category !== 'string') {
    throw new Error('Invalid product category.')
  }
  if (!productData.description || typeof productData.description !== 'string') {
    throw new Error('Invalid product description.')
  }
  if (
    productData.costInPennies !== undefined &&
    (productData.costInPennies <= 0 ||
      !Number.isInteger(productData.costInPennies))
  ) {
    throw new Error('Invalid cost in pennies.')
  }
}

// Function to create a new Product
export async function createProduct(
  product: Partial<Product>,
): Promise<Product> {
  try {
    // Ensure required fields are present
    if (!product.title || typeof product.title !== 'string') {
      throw new Error('Invalid product title.')
    }
    if (!product.category || typeof product.category !== 'string') {
      throw new Error('Invalid product category.')
    }
    if (!product.description || typeof product.description !== 'string') {
      throw new Error('Invalid product description.')
    }

    return await prisma.product.create({
      data: {
        title: product.title,
        category: product.category,
        description: product.description, // Ensure this is provided
        costInPennies: product.costInPennies ?? 99,
        // Add other fields here as needed
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
