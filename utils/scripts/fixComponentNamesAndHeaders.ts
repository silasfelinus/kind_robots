// /utils/scripts/fixComponentNamesAndHeaders.ts

import fs from 'fs'
import path from 'path'

const BASE_DIR = path.resolve('components', 'content')

function toKebabCase(str: string) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function getRelativePath(fullPath: string) {
  return path.relative(process.cwd(), fullPath).replace(/\\/g, '/')
}

function updateFileHeader(filePath: string, relativePath: string) {
  const locationComment = `<!-- /${relativePath} -->\n`
  const contents = fs.readFileSync(filePath, 'utf8')

  const commentRegex = /^<!--\s*\/components\/content\/.*?-->\n?/i
  const updatedContents = commentRegex.test(contents)
    ? contents.replace(commentRegex, locationComment)
    : locationComment + contents

  fs.writeFileSync(filePath, updatedContents, 'utf8')
}

function walkDirectory(dir: string) {
  const files = fs.readdirSync(dir).sort()

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      walkDirectory(fullPath)
    } else if (stat.isFile() && file.endsWith('.vue')) {
      const kebabName = toKebabCase(file.replace('.vue', '')) + '.vue'

      let targetPath = fullPath

      if (file !== kebabName) {
        const newPath = path.join(dir, kebabName)
        if (fs.existsSync(newPath)) {
          console.warn(`⚠️ Skipped rename: ${newPath} already exists`)
        } else {
          fs.renameSync(fullPath, newPath)
          console.log(`🔁 Renamed: ${file} → ${kebabName}`)
          targetPath = newPath
        }
      }

      const relativePath = getRelativePath(targetPath)
      updateFileHeader(targetPath, relativePath)
      console.log(`✅ Header updated: ${relativePath}`)
    }
  }
}

walkDirectory(BASE_DIR)
