// /server/api/customers/index.get.ts
import type { Customer } from '@prisma/client'
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const customers = await fetchAllCustomers()
    return { success: true, customers }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch all Customers
export async function fetchAllCustomers(): Promise<Customer[]> {
  return await prisma.customer.findMany()
}
