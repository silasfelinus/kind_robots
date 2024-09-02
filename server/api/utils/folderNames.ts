// /server/api/utils/folderNames.ts

import { promises as fs } from 'fs'
import path from 'path'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  try {
    const componentPath = path.resolve(process.cwd(), 'components/content')
    console.log('Resolved component path:', componentPath); // Log the resolved path

    const folderNames = await fs.readdir(componentPath)
    console.log('Folder names read:', folderNames); // Log the raw folder names

    const folders = []

    for (const folderName of folderNames) {
      const folderPath = path.join(componentPath, folderName)
      const stat = await fs.stat(folderPath)
      console.log('Processing:', folderPath); // Log each folder path processed

      if (stat.isDirectory()) {
        folders.push(folderName)
      }
    }

    console.log('Folders array to return:', folders); // Log the final folders array
    return { response: folders }
  } catch (error) {
    console.error('Failed to fetch folder names:', error)
    return { response: 'Failed to fetch folder names' }
  }
})