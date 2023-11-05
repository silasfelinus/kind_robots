// /server/api/carts/[id].delete.ts

import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const isDeleted = await deleteCart(id);
    return { success: isDeleted };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to delete a Cart by ID
export async function deleteCart(id: number): Promise<boolean> {
  try {
    const cartExists = await prisma.cart.findUnique({ where: { id } });

    if (!cartExists) {
      return false;
    }

    await prisma.cart.delete({ where: { id } });
    return true;
  } catch (error: any) {
    throw errorHandler(error);
  }
}
