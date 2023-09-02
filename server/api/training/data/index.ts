// /server/api/training/index.ts

import { TrainingData, TrainingLine } from '@prisma/client'
import prisma from '../../utils/prisma'

// Function to create new TrainingData
export async function createTrainingData(data: Partial<TrainingData>): Promise<TrainingData> {
  // Validate required fields
  if (!data.label) {
    throw new Error('Label must be provided')
  }

  // Create the new TrainingData
  return prisma.trainingData.create({
    data: {
      label: data.label
      // add other fields if necessary
    }
  })
}
export async function addTrainingLines(
  trainingDataId: number,
  lines: Partial<TrainingLine>[]
): Promise<void> {
  for (const line of lines) {
    if (line.role && line.content) {
      // Check if a TrainingLine with the same role and content already exists
      const existingLine = await prisma.trainingLine.findFirst({
        where: {
          role: line.role,
          content: line.content
        }
      })

      if (existingLine) {
        // Associate the existing TrainingLine with the current TrainingData
        await prisma.trainingData.update({
          where: { id: trainingDataId },
          data: {
            training: {
              connect: { id: existingLine.id }
            }
          }
        })
      } else {
        // Create a new TrainingLine and associate it with the current TrainingData
        await prisma.trainingLine.create({
          data: {
            role: line.role,
            content: line.content,
            TrainingData: {
              connect: { id: trainingDataId }
            }
          }
        })
      }
    } else {
      // Handle the error case or log a warning here
      console.warn('Skipped a line due to missing role or content')
    }
  }
}

// Fetch all TrainingData along with their TrainingLines
export async function fetchAllTrainingData(): Promise<TrainingData[]> {
  return prisma.trainingData.findMany({
    include: {
      training: true // Include related TrainingLines
    }
  })
}

// Delete a TrainingData record along with its TrainingLines
export async function deleteTrainingData(id: number): Promise<boolean> {
  const trainingDataExists = await prisma.trainingData.findUnique({ where: { id } })

  if (!trainingDataExists) {
    return false
  }

  await prisma.trainingData.delete({ where: { id } })
  return true
}
