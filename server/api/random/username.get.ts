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
    const adjectivesList = (await prisma.randomList.findUnique({
      where: { title: 'Adjectives' }
    })) || { items: backupAdjectives }
    const nounsList = (await prisma.randomList.findUnique({ where: { title: 'Nouns' } })) || {
      items: backupNouns
    }
    const titlesList = (await prisma.randomList.findUnique({ where: { title: 'Titles' } })) || {
      items: backupTitles
    }

    // Randomly select items
    const randomAdjective =
      adjectivesList.items[Math.floor(Math.random() * adjectivesList.items.length)]
    const randomNoun = nounsList.items[Math.floor(Math.random() * nounsList.items.length)]
    const randomTitle = titlesList.items[Math.floor(Math.random() * titlesList.items.length)]

    // Generate the silly name
    const sillyName = `${randomAdjective} ${randomNoun} ${randomTitle}`

    return {
      success: true,
      sillyName
    }
  } catch (error: any) {
    return errorHandler({ error, context: 'Error in /api/randomname' })
  }
})
