// /server/api/products/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { type Product } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const updatedProductData: Partial<Product> = await readBody(event);
    const updatedProduct = await updateProduct(id, updatedProductData);
    return { success: true, updatedProduct };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to update an existing Product by ID
export async function updateProduct(id: number, updatedProduct: Partial<Product>): Promise<Product | null> {
  try {
    return await prisma.product.update({
      where: { id },
      data: updatedProduct,
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
