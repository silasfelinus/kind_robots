// /server/api/carts/[id].post.ts

import { defineEventHandler, readBody } from 'h3';
import { type CartItem } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const cartId = Number(event.context.params?.id);
    const cartItemData: Partial<CartItem> = await readBody(event);

    // Validate cartId
    if (!Number.isInteger(cartId) || cartId <= 0) {
      throw new Error('Invalid cartId.');
    }
    const cartExists = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cartExists) {
      throw new Error('Cart does not exist.');
    }

    // Validate productId
    if (
      !Number.isInteger(cartItemData.productId) ||
      cartItemData.productId === undefined ||
      cartItemData.productId <= 0
    ) {
      throw new Error('Invalid productId.');
    }
    const productExists = await prisma.product.findUnique({ where: { id: cartItemData.productId } });
    if (!productExists) {
      throw new Error('Product does not exist.');
    }

    // Validate quantity
    if (cartItemData.quantity && (cartItemData.quantity <= 0 || !Number.isInteger(cartItemData.quantity))) {
      throw new Error('Invalid quantity.');
    }

    // Add the cartId to the cartItemData
    cartItemData.cartId = cartId;

    const newCartItem = await createCartItem(cartItemData);
    return { success: true, newCartItem };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to create a new CartItem
export async function createCartItem(cartItem: Partial<CartItem>): Promise<CartItem> {
  try {
    if (!cartItem.cartId || !cartItem.productId) {
      throw new Error('we need cartID and/or productId');
    }
    return await prisma.cartItem.create({
      data: {
        cartId: cartItem.cartId,
        productId: cartItem.productId,
        quantity: cartItem.quantity || 1,
      },
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
