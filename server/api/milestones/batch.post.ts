// /server/api/milestones/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error' // Import centralized error handler
import { createMilestonesBatch } from './' // Import the batch creation function

export default defineEventHandler(async (event) => {
  try {
    // Read and parse JSON body from the event
    const milestonesData = await readBody(event)

    // Validate if the data received is an array
    if (!Array.isArray(milestonesData)) {
      return { success: false, message: 'Invalid JSON body. Expected an array of milestones.' }
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
          message: 'Each milestone must have a label, message, triggerCode, and an icon.'
        }
      }
    }

    // Call the batch creation function and unpack the results
    const { count, milestones, errors } = await createMilestonesBatch(milestonesData)

    // Check if any errors occurred during the batch creation
    if (errors.length > 0) {
      return { success: false, message: 'Some milestones could not be created.', errors }
    }

    return { success: true, count, milestones }
  } catch (error: any) {
    // Use centralized error handling
    return errorHandler(error)
  }
})
