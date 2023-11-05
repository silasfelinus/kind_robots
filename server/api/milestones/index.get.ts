// /server/api/milestones/index.get.ts
import { defineEventHandler } from 'h3';
import { type Milestone } from '@prisma/client'; // Import the batch creation function
import prisma from '../utils/prisma';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async () => {
  try {
    const milestones = await prisma.milestone.findMany();
    return { success: true, milestones };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to fetch all Milestones
export async function fetchAllMilestones(): Promise<Milestone[]> {
  return await prisma.milestone.findMany();
}
