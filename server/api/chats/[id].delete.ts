import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const isDeleted = await deleteProduct(id);
    return { success: isDeleted };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to delete a Product by ID
export async function deleteProduct(id: number): Promise<boolean> {
  try {
    const productExists = await prisma.product.findUnique({ where: { id } });

    if (!productExists) {
      return false;
    }

    await prisma.product.delete({ where: { id } });
    return true;
  } catch (error: any) {
    throw errorHandler(error);
  }
}
