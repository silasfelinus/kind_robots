// /utils/scripts/updateKindIcons.js

import { readdirSync, writeFileSync } from 'fs'
import { basename, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Makes __dirname work in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Navigate relative to script location
const iconDir = resolve(__dirname, '../../assets/icons')
const outputPath = resolve(__dirname, '../../stores/seeds/validIcons.ts')

function getIconNames() {
  return readdirSync(iconDir)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => basename(file, '.svg'))
    .sort()
}

function buildFileContent(iconNames) {
  return `// /stores/seeds/validIcons.ts

const validIcons = ${JSON.stringify(iconNames, null, 2)};

export default validIcons;
`
}

function writeValidIcons() {
  const icons = getIconNames()
  const content = buildFileContent(icons)
  writeFileSync(outputPath, content, 'utf-8')
  console.log(`✅ validIcons.ts updated with ${icons.length} icons.`)
}

writeValidIcons()
