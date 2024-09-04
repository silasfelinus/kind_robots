import { defineEventHandler, readBody } from 'h3';
import type { Prisma, Milestone } from '@prisma/client';
import { errorHandler } from '../utils/error'; 
import prisma from '../utils/prisma';

export default defineEventHandler(async (event) => {
  try {
    // Read and parse JSON body from the event
    const milestonesData = await readBody(event);

    // Validate if the data received is an array
    if (!Array.isArray(milestonesData)) {
      return {
        success: false,
        message: 'Invalid JSON body. Expected an array of milestones.',
      };
    }

    // Validate each milestoneData object in the array
    for (const milestoneData of milestonesData) {
      if (
        !milestoneData.label ||
        !milestoneData.message ||
        !milestoneData.triggerCode ||
        !milestoneData.icon
      ) {
        return {
          success: false,
          message: 'Each milestone must have a label, message, triggerCode, and an icon.',
        };
      }
    }

    // Call the batch creation function and unpack the results
    const { createdMilestones, errors } = await createMilestonesBatch(milestonesData);

    // Check if any errors occurred during the batch creation
    if (errors.length > 0) {
      return {
        success: false,
        message: 'Some milestones could not be created.',
        errors,
      };
    }

    return { success: true, milestones: createdMilestones }; // Return the newly created milestones
  } catch (error: unknown) {
    // Use centralized error handling
    return errorHandler(error);
  }
});

// Function to create Milestones in batch and return the created records
export async function createMilestonesBatch(
  milestonesData: Partial<Milestone>[],
): Promise<{ createdMilestones: Milestone[]; errors: string[] }> {
  const errors: string[] = [];
  const createdMilestones: Milestone[] = [];

  // Validate and filter the milestones
  const validMilestonesData: Prisma.MilestoneCreateInput[] = milestonesData
    .filter((milestoneData) => {
      if (
        !milestoneData.label ||
        !milestoneData.message ||
        !milestoneData.triggerCode ||
        !milestoneData.icon
      ) {
        errors.push(`Milestone with label ${milestoneData.label || 'undefined'} is incomplete.`);
        return false;
      }
      return true;
    })
    .map((milestoneData) => milestoneData as Prisma.MilestoneCreateInput);

  // Create the milestones one by one and collect the created records
  for (const data of validMilestonesData) {
    try {
      const milestone = await prisma.milestone.create({
        data,
      });
      createdMilestones.push(milestone);
    } catch (error) {
      errors.push(`Failed to create milestone with label ${data.label}. Error: ${(error as Error).message}`);
    }
  }

  // Return the created milestones and any errors encountered
  return { createdMilestones, errors };
}
