// /server/api/customers/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { Customer } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedCustomerData: Partial<Customer> = await readBody(event)
    const updatedCustomer = await updateCustomer(id, updatedCustomerData)
    return { success: true, updatedCustomer }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to update an existing Customer by ID
export async function updateCustomer(
  id: number,
  updatedCustomer: Partial<Customer>
): Promise<Customer | null> {
  try {
    return await prisma.customer.update({
      where: { id },
      data: updatedCustomer
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
