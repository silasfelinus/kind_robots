// /server/api/items/[id].delete.ts
import { defineEventHandler, readBody } from 'h3'
import { CartItem } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    await deleteCartItem(id)
    return { success: true }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to delete a CartItem
export async function deleteCartItem(id: number): Promise<void> {
  await prisma.cartItem.delete({
    where: { id }
  })
}
