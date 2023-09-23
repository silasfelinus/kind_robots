import { Milestone, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Milestone
export async function createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
  try {
    // Validate required fields
    if (!milestone.label || !milestone.message || !milestone.triggerCode || !milestone.icon) {
      throw new Error('Label, message, triggerCode, and icon must be provided')
    }

    // Create the new Milestone
    return await prisma.milestone.create({
      data: {
        label: milestone.label,
        message: milestone.message,
        triggerCode: milestone.triggerCode,
        icon: milestone.icon,
        karma: milestone.karma || 0,
        isRepeatable: milestone.isRepeatable || false
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to update an existing Milestone by ID
export async function updateMilestone(
  id: number,
  updatedMilestone: Partial<Milestone>
): Promise<Milestone | null> {
  try {
    return await prisma.milestone.update({
      where: { id },
      data: updatedMilestone
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to delete a Milestone by ID
export async function deleteMilestone(id: number): Promise<boolean> {
  try {
    const milestoneExists = await prisma.milestone.findUnique({ where: { id } })

    if (!milestoneExists) {
      return false
    }

    await prisma.milestone.delete({ where: { id } })
    return true
  } catch (error: any) {
    throw errorHandler(error)
  }
}

// Function to fetch all Milestones
export async function fetchAllMilestones(): Promise<Milestone[]> {
  return await prisma.milestone.findMany()
}

// Function to fetch a single Milestone by ID
export async function fetchMilestoneById(id: number): Promise<Milestone | null> {
  return await prisma.milestone.findUnique({
    where: { id }
  })
}

// Function to create Milestones in batch
export async function createMilestonesBatch(
  milestonesData: Partial<Milestone>[]
): Promise<{ count: number; milestones: Milestone[]; errors: string[] }> {
  const errors: string[] = []

  // Validate and filter the milestones
  const data: Prisma.MilestoneCreateManyInput[] = milestonesData
    .filter((milestoneData) => {
      if (
        !milestoneData.label ||
        !milestoneData.message ||
        !milestoneData.triggerCode ||
        !milestoneData.icon
      ) {
        errors.push(`Milestone with label ${milestoneData.label} is incomplete.`)
        return false
      }
      return true
    })
    .map((milestoneData) => milestoneData as Prisma.MilestoneCreateManyInput)

  // Create the milestones in a batch
  const result = await prisma.milestone.createMany({
    data,
    skipDuplicates: true // Skip duplicate records based on constraints
  })

  // Fetch the newly created milestones
  const milestones = await prisma.milestone.findMany()

  return { count: result.count, milestones, errors }
}

export type { Milestone }
