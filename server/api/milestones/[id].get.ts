// server/api/milstones/[id].get.ts
import { defineEventHandler } from 'h3';
import { type Milestone } from '@prisma/client';
import { errorHandler } from '../utils/error';
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    console.log('Event Context Params:', event.context.params);

    const milestone = await fetchMilestoneById(id);
    return { success: true, milestone };
  } catch (error: any) {
    return errorHandler(error);
  }
});

// Function to fetch a single Milestone by ID
export async function fetchMilestoneById(id: number): Promise<Milestone | null> {
  return await prisma.milestone.findUnique({
    where: { id },
  });
}
