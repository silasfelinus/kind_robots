// server/api/utils/folderNames.ts

import { promises as fs } from 'fs'
import path from 'path'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  try {
    const componentPath = path.resolve(process.cwd(), 'components/content')
    const folderNames = await fs.readdir(componentPath)
    const folders = []

    for (const folderName of folderNames) {
      const folderPath = path.join(componentPath, folderName)
      const stat = await fs.stat(folderPath)

      if (stat.isDirectory()) {
        folders.push(folderName)
      }
    }

    return { response: folders } // Make sure to return the folders array
  } catch (error) {
    console.error('Failed to fetch folder names:', error)
    return { response: 'Failed to fetch folder names' } // Return an error message
  }
})
