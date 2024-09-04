// /server/api/users/milestones/records/[id].delete.ts
import { defineEventHandler } from 'h3';
import prisma from '../../utils/prisma';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const recordId = Number(event.context.params?.id);

    if (!recordId) {
      throw new Error('Milestone Record ID is required');
    }

    // Delete the milestone record with the given ID
    const deletedRecord = await prisma.milestoneRecord.delete({
      where: {
        id: recordId,
      },
    });

    return { success: true, deletedRecord };
  } catch (error: unknown) {
    return errorHandler(error);
  }
});
