// /server/api/users/milestones/records/[id].delete.ts
import { defineEventHandler } from 'h3';
import prisma from '../../utils/prisma';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  try {
    const recordId = Number(event.context.params?.id);

    if (!recordId || isNaN(recordId)) {
      throw new Error('Milestone Record ID is required and should be a valid number');
    }

    console.log('Attempting to delete Milestone Record with ID:', recordId); // Log the record ID

    // Delete the milestone record with the given ID
    const deletedRecord = await prisma.milestoneRecord.delete({
      where: {
        id: recordId,
      },
    });

    console.log('Milestone Record deleted successfully:', deletedRecord); // Log the result

    return { success: true, deletedRecord };
  } catch (error: unknown) {
    console.error('Error while deleting Milestone Record:', error); // Log the error
    return errorHandler(error);
  }
});
