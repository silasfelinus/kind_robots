// /server/api/products/index.get.ts

import { defineEventHandler } from 'h3';
import { type Product } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async () => {
  try {
    const products = await fetchAllProducts();
    return { success: true, products };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to fetch all Products
export async function fetchAllProducts(): Promise<Product[]> {
  return await prisma.product.findMany();
}
