// server/api/random/username.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

// Backup lists
const backupAdjectives = ['Happy', 'Sad', 'Angry']
const backupNouns = ['Cat', 'Dog', 'Fish']
const backupTitles = ['Mr.', 'Mrs.', 'Dr.']

export default defineEventHandler(async () => {
  try {
    // Fetch lists from the database
    const adjectivesList = await prisma.randomList.findUnique({ where: { title: 'Adjectives' } })
    const nounsList = await prisma.randomList.findUnique({ where: { title: 'Nouns' } })
    const titlesList = await prisma.randomList.findUnique({ where: { title: 'Titles' } })

    // Use backup lists if not found
    const randomAdjective = getRandomItem((adjectivesList?.items as string[]) || backupAdjectives)
    const randomNoun = getRandomItem((nounsList?.items as string[]) || backupNouns)
    const randomTitle = getRandomItem((titlesList?.items as string[]) || backupTitles)

    // Generate the silly name
    const sillyName = `${randomAdjective} ${randomNoun} ${randomTitle}`

    return {
      success: true,
      sillyName,
    }
  }
  catch (error: any) {
    return errorHandler({ error, context: 'Error in /api/randomname' })
  }
})

// Helper function to get a random item from an array
function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
