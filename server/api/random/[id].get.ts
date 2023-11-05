// /server/api/random/[id].get.ts
import { defineEventHandler } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const list = await prisma.randomList.findUnique({ where: { id } });
    if (!list) {
      throw new Error('List not found.');
    }
    return { success: true, list };
  } catch (error: any) {
    return errorHandler(error);
  }
});
