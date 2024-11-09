// /server/api/milestones/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import type { Prisma, Milestone } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

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
    const { data, errors } =
      await createMilestonesBatch(milestonesData)

    // Prepare the response based on the presence of errors
    if (errors.length > 0) {
      response = {
        success: false,
        message: 'Some milestones could not be created.',
        data, // Ensure `data` is always returned as an array
        errors,
        statusCode: 400,
      }
    } else {
      response = {
        success: true,
        message: 'All milestones created successfully.',
        data: createdMilestones, // Ensure `data` is an array
        statusCode: 201,
      }
    }
    event.node.res.statusCode = response.statusCode
  } catch (error) {
    const handledError = errorHandler(error)
    console.error('Error creating milestones:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create milestones.',
      data: [], // Ensure `data` is always returned as an array, even on error
      statusCode: event.node.res.statusCode,
    }
  }

  return response
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
