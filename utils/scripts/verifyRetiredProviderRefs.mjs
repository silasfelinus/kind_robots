#!/usr/bin/env node
// Fails when executable automation regains references to the retired hosting
// provider. Build the forbidden tokens from pieces so this verifier does not
// match its own source.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const scanRoots = ['.github/workflows', 'scripts', 'utils/scripts']
const ignoredExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip'])
const forbidden = [
  ['ver', 'cel'].join(''),
  ['kind-robots.', 'ver', 'cel', '.app'].join(''),
  ['VER', 'CEL_'].join(''),
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(fullPath)))
    else if (!ignoredExtensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath)
  }
  return files
}

const findings = []
for (const scanRoot of scanRoots) {
  const directory = path.resolve(root, scanRoot)
  for (const absolutePath of await walk(directory)) {
    const relativePath = path.relative(root, absolutePath).replaceAll('\\', '/')
    const text = await readFile(absolutePath, 'utf8')
    const lines = text.split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]
      const lower = line.toLowerCase()
      for (const token of forbidden) {
        if (lower.includes(token.toLowerCase())) {
          findings.push(`${relativePath}:${index + 1}: ${line.trim()}`)
          break
        }
      }
    }
  }
}

if (findings.length) {
  console.error('Retired hosting-provider references remain in executable automation:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('Retired hosting-provider reference guard passed.')
