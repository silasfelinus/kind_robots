// /server/api/milestones/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { PrismaClient, type Milestone } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    if (!id) throw new Error('Invalid milestone ID.');
    const existingMilestone = await prisma.milestone.findUnique({ where: { id } });
    const milestoneData: Partial<Milestone> = await readBody(event);
    if (!existingMilestone) {
      throw new Error('Milestone not found.');
    }
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: milestoneData,
    });
    return { success: true, milestone: updatedMilestone };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to update an existing Milestone by ID
export async function updateMilestone(id: number, updatedMilestone: Partial<Milestone>): Promise<Milestone | null> {
  try {
    return await prisma.milestone.update({
      where: { id },
      data: updatedMilestone,
    });
  } catch (error: any) {
    throw errorHandler(error);
  }
}
