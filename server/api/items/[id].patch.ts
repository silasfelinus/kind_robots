// /server/api/items/[id].patch.ts

import { defineEventHandler, readBody } from 'h3'
import type { CartItem } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedData: Partial<CartItem> = await readBody(event)
    const updatedItem = await updateCartItem(id, updatedData)
    return { success: true, updatedItem }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update a CartItem
export async function updateCartItem(
  id: number,
  updatedData: Partial<CartItem>,
): Promise<CartItem> {
  return await prisma.cartItem.update({
    where: { id },
    data: updatedData,
  })
}
