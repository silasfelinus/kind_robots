// /server/api/customers/userId/[userId].get.ts
import { defineEventHandler } from 'h3';
import prisma from '../../utils/prisma';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.userId);
    const customer = await fetchCustomerByUserId(userId);
    if (customer) {
      return { success: true, customer };
    } else {
      return { success: false, message: 'Customer not found' };
    }
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to fetch a Customer by UserId
export async function fetchCustomerByUserId(userId: number) {
  try {
    return await prisma.customer.findFirst({
      where: {
        userId,
      },
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
