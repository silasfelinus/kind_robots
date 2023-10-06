// /server/api/customers/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import { Customer } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const customerData: Partial<Customer> = await readBody(event)
    const newCustomer = await createCustomer(customerData)
    return { success: true, newCustomer }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Function to create a new Customer
export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  try {
    return await prisma.customer.create({
      data: {
        email: customer.email || '',
        name: customer.name || null
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
