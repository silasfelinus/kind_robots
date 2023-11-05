// /server/api/random/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    const updatedListData = await readBody(event);

    // Validate updatedListData
    if (updatedListData.title && typeof updatedListData.title !== 'string') {
      throw new Error('Title must be a string.');
    }

    if (updatedListData.items && !Array.isArray(updatedListData.items)) {
      throw new Error('Items must be an array.');
    }

    // Update the list
    const updatedList = await prisma.randomList.update({
      where: { id },
      data: {
        ...updatedListData,
        items: updatedListData.items ? JSON.stringify(updatedListData.items) : undefined,
      },
    });

    return { success: true, updatedList };
  } catch (error: any) {
    return errorHandler(error);
  }
});
