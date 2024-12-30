// create-component-json.ts
import { promises as fs } from 'fs'
import path from 'path'

async function generateComponentJSON() {
  try {
    const componentPath = path.resolve(process.cwd(), 'components/content')
    const folderNames = await fs.readdir(componentPath)
    const folders = []

    for (const folderName of folderNames) {
      const folderPath = path.join(componentPath, folderName)
      const stat = await fs.stat(folderPath)

      if (stat.isDirectory()) {
        const componentFiles = await fs.readdir(folderPath)
        const components = componentFiles
          .filter((file) => file.endsWith('.vue'))
          .map((file) => file.replace('.vue', ''))
        folders.push({ folderName, components })
      }
    }

    const outputPath = path.resolve(process.cwd(), 'public/components.json')
    await fs.writeFile(outputPath, JSON.stringify(folders, null, 2))
    console.log('Component JSON generated successfully:', outputPath)
  } catch (error) {
    console.error('Failed to generate component JSON:', error)
  }
}

generateComponentJSON()
