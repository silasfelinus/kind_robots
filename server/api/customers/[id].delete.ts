// /server/api/customers/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteCustomer(id)
    return { success: isDeleted }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Customer by ID
export async function deleteCustomer(id: number): Promise<boolean> {
  try {
    const customerExists = await prisma.customer.findUnique({ where: { id } })

    if (!customerExists) {
      return false
    }

    await prisma.customer.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
