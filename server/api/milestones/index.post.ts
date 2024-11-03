// /server/api/milestones/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { Prisma, Milestone } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Read and validate the milestones data from the request body
    const milestonesData: Partial<Milestone>[] = await readBody(event)

    if (!Array.isArray(milestonesData)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Expected an array of milestones.',
      })
    }

    // Create milestones in batch and retrieve results
    const { createdMilestones, errors } =
      await createMilestonesBatch(milestonesData)

    // Return result based on errors presence
    if (errors.length > 0) {
      return {
        success: false,
        message: 'Some milestones could not be created.',
        errors,
      }
    }

    return {
      success: true,
      milestones: createdMilestones,
      message: 'All milestones created successfully.',
    }
  } catch (error) {
    return errorHandler(error)
  }
})

// Function to create milestones in batch and return the created records
async function createMilestonesBatch(
  milestonesData: Partial<Milestone>[],
): Promise<{ createdMilestones: Milestone[]; errors: string[] }> {
  const errors: string[] = []
  const createdMilestones: Milestone[] = []

  for (const data of milestonesData) {
    if (!isValidMilestoneData(data)) {
      errors.push(
        `Milestone with label "${data.label || 'undefined'}" is missing required fields.`,
      )
      continue
    }

    try {
      const milestone = await prisma.milestone.create({
        data: data as Prisma.MilestoneCreateInput,
      })
      createdMilestones.push(milestone)
    } catch (error) {
      errors.push(
        `Failed to create milestone with label "${data.label}". Error: ${(error as Error).message}`,
      )
    }
  }

  return { createdMilestones, errors }
}

// Helper function to check required fields for milestone creation
function isValidMilestoneData(data: Partial<Milestone>): boolean {
  return Boolean(data.label && data.message && data.triggerCode && data.icon)
}
