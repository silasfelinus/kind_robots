//server/api/components/folders.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const folders = await prisma.component.findMany({
      select: {
        folderName: true,
      },
      distinct: ['folderName'], // Ensure unique folder names
    })

    const folderNames = folders.map((folder) => folder.folderName)

    return {
      success: true,
      folderNames,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
