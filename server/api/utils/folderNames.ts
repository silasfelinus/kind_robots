// /server/api/utils/folderNames.ts

import { promises as fs } from 'fs'
import path from 'path'
import { defineEventHandler } from 'h3'

interface Folder {
  folderName: string;
  components: string[];
}

export default defineEventHandler(async () => {
  try {
    const componentPath = path.resolve(process.cwd(), 'components/content')
    const folderNames = await fs.readdir(componentPath)
    const folders: string[] = []

    for (const folderName of folderNames) {
      const folderPath = path.join(componentPath, folderName)
      const stat = await fs.stat(folderPath)

      if (stat.isDirectory()) {
        folders.push(folderName)
      }
    }

    return { response: folders }
  } catch (error) {
    console.error('Failed to fetch folder names:', error)

    try {
      // Fallback to the JSON file
      const jsonPath = path.resolve(process.cwd(), 'public/components.json')
      const jsonData = await fs.readFile(jsonPath, 'utf-8')
      const folders = (JSON.parse(jsonData) as Folder[]).map(folder => folder.folderName)
      return { response: folders }
    } catch (jsonError) {
      console.error('Failed to fetch from JSON fallback:', jsonError)
      return { response: 'Failed to fetch folder names' }
    }
  }
})
