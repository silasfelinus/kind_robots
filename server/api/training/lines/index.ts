import { TrainingLine, Prisma } from '@prisma/client' // Adjust the path as needed
import prisma from '../../utils/prisma'

// Function to create a new TrainingLine
export async function createTrainingLine(line: Partial<TrainingLine>): Promise<TrainingLine> {
  // Validate required fields
  if (!line.role || !line.content) {
    throw new Error('Both role and content must be provided')
  }

  // Create the new TrainingLine
  return prisma.trainingLine.create({
    data: {
      role: line.role,
      content: line.content
      // Add other fields if necessary
    }
  })
}

// Function to update an existing TrainingLine by ID
export async function updateTrainingLine(
  id: number,
  updatedLine: Partial<TrainingLine>
): Promise<TrainingLine | null> {
  return prisma.trainingLine.update({
    where: { id },
    data: updatedLine
  })
}

// Function to delete a TrainingLine by ID
export async function deleteTrainingLine(id: number): Promise<boolean> {
  const lineExists = await prisma.trainingLine.findUnique({ where: { id } })

  if (!lineExists) {
    return false
  }

  await prisma.trainingLine.delete({ where: { id } })
  return true
}

// Function to fetch all TrainingLines
export async function fetchAllTrainingLines(): Promise<TrainingLine[]> {
  return prisma.trainingLine.findMany()
}

// Function to fetch a single TrainingLine by ID
export async function fetchTrainingLineById(id: number): Promise<TrainingLine | null> {
  return prisma.trainingLine.findUnique({
    where: { id }
  })
}

export async function createTrainingLinesBatch(
  linesData: Partial<TrainingLine>[]
): Promise<{ count: number; lines: TrainingLine[]; errors: string[] }> {
  const errors: string[] = []

  // Validate and filter the lines
  const data: Prisma.TrainingLineCreateManyInput[] = linesData
    .filter((lineData) => {
      if (!lineData.role || !lineData.content) {
        errors.push(
          `Line with role ${lineData.role} and content ${lineData.content} is incomplete.`
        )
        return false
      }
      return true
    })
    .map((lineData) => lineData as Prisma.TrainingLineCreateManyInput)

  // Create the lines in a batch
  const result = await prisma.trainingLine.createMany({
    data,
    skipDuplicates: true // Skip duplicate records based on constraints
  })

  // Fetch the newly created lines
  const lines = await prisma.trainingLine.findMany()

  return { count: result.count, lines, errors }
}

export type { TrainingLine }
