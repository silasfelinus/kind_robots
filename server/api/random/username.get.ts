// /server/api/random/username.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Backup lists
const backupAdjectives = ['Happy', 'Sad', 'Angry']
const backupNouns = ['Cat', 'Dog', 'Fish']
const backupTitles = ['Mr.', 'Mrs.', 'Dr.']

export default defineEventHandler(async () => {
  let sillyName: string

  try {
    // Fetch lists from the database
    const adjectivesList = await prisma.randomList.findFirst({
      where: { title: 'Adjectives' },
    })
    const nounsList = await prisma.randomList.findFirst({
      where: { title: 'Nouns' },
    })
    const titlesList = await prisma.randomList.findFirst({
      where: { title: 'Titles' },
    })

    // Parse the JSON strings into arrays, or use backup lists if not found or parsing fails
    const randomAdjective = getRandomItem(
      parseItems(adjectivesList?.items) || backupAdjectives,
    )
    const randomNoun = getRandomItem(
      parseItems(nounsList?.items) || backupNouns,
    )
    const randomTitle = getRandomItem(
      parseItems(titlesList?.items) || backupTitles,
    )

    // Generate the silly name
    sillyName = `${randomAdjective} ${randomNoun} ${randomTitle}`

    return {
      success: true,
      data: { sillyName }, // Wrap the silly name in data
      message: 'Silly name generated successfully.',
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || 'Failed to generate silly name.',
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Helper function to parse JSON strings
function parseItems(items: string | undefined): string[] | null {
  try {
    return items ? JSON.parse(items) : null
  } catch (error) {
    console.error('Failed to parse items:', error)
    return null
  }
}

// Helper function to get a random item from an array
function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
