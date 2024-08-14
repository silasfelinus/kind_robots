// servers/api/customers/[id].get.ts
import { defineEventHandler } from 'h3'
import type { Customer } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) {
      throw new Error('Invalid ID.')
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('Customer not found.')
    }

    return {
      success: true,
      customer,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      statusCode,
    }
  }
})

// Function to fetch a single Customer by ID
export async function fetchCustomerById(id: number): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { id },
  })
}
