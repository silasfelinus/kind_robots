#!/usr/bin/env node
// /utils/scripts/generate-smart-icons.mjs
// Generates SmartIcon JSON from Markdown front-matter in /content

import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.resolve(process.cwd(), 'content')
const OUTPUT_FILE = path.resolve(
  process.cwd(),
  'prisma',
  'seeds',
  'smartIconsFromContent.json',
)

/**
 * Minimal front matter parser (no external deps)
 * Parses key: value pairs inside --- blocks.
 */
function parseFrontMatter(source) {
  const lines = source.split(/\r?\n/)
  if (!lines[0] || lines[0].trim() !== '---')
    return { data: {}, content: source }

  let i = 1
  const headerLines = []
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '---') {
      i++
      break
    }
    headerLines.push(line)
  }

  const content = lines.slice(i).join('\n')
  const data = {}

  for (const rawLine of headerLines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/)
    if (!match) continue

    const key = match[1]
    const rawValue = match[2].trim()
    data[key] = parseScalar(rawValue)
  }

  return { data, content }
}

function parseScalar(rawValue) {
  if (rawValue === '') return ''
  if (rawValue === 'true') return true
  if (rawValue === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(rawValue)) return Number(rawValue)
  if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
    try {
      return JSON.parse(rawValue.replace(/'/g, '"'))
    } catch {
      return rawValue
    }
  }
  if (
    (rawValue.startsWith("'") && rawValue.endsWith("'")) ||
    (rawValue.startsWith('"') && rawValue.endsWith('"'))
  ) {
    return rawValue.slice(1, -1)
  }
  return rawValue
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walkDir(fullPath))
    else if (entry.isFile() && fullPath.endsWith('.md')) files.push(fullPath)
  }
  return files
}

function routeFromFile(filePath) {
  const rel = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/')
  let slug = rel.replace(/\.md$/, '')
  if (slug === 'index') return '/'
  if (slug.endsWith('/index')) slug = slug.slice(0, -'/index'.length)
  if (!slug.startsWith('/')) slug = '/' + slug
  return slug
}

function deriveModelType(navComponent) {
  if (typeof navComponent !== 'string') return null
  const match = navComponent.match(/^([^-]+)-nav/)
  return match ? match[1] : null
}

/**
 * Build a SmartIcon object from frontmatter
 */
function buildSmartIcon(frontmatter, route) {
  const {
    title,
    room,
    icon,
    tooltip,
    description,
    category,
    navComponent,
    isPublic,
    designer,
    tags,
  } = frontmatter

  const cleanedTitle =
    typeof title === 'string' && title.trim()
      ? title.trim()
      : route === '/'
        ? 'Home'
        : route.replace(/^\//, '').replace(/\/+/g, ' ').trim() || 'Untitled'

  const modelType = deriveModelType(navComponent)
  const primaryCategory = modelType
    ? 'model' // any modelType implies this category
    : typeof category === 'string'
      ? category
      : Array.isArray(tags) && tags.length
        ? String(tags[0])
        : 'ami' // fallback for everything else

  return {
    title: cleanedTitle,
    type: 'nav',
    userId: 10,
    designer: designer ?? 'content-seeder',
    icon: icon ?? null,
    label: room ?? cleanedTitle,
    link: route,
    component: navComponent ?? null,
    isPublic: typeof isPublic === 'boolean' ? isPublic : true,
    description: tooltip ?? description ?? null,
    category: primaryCategory,
    modelType: modelType ?? 'ami',
  }
}

/**
 * Main script
 */
function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found at ${CONTENT_DIR}`)
    process.exit(1)
  }

  const mdFiles = walkDir(CONTENT_DIR)
  const icons = []

  for (const file of mdFiles) {
    const raw = fs.readFileSync(file, 'utf8')
    const { data } = parseFrontMatter(raw)
    if (!data || !data.icon) continue

    const route = routeFromFile(file)
    const iconData = buildSmartIcon(data, route)
    icons.push(iconData)
  }

  icons.sort((a, b) => a.title.localeCompare(b.title))

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(icons, null, 2), 'utf8')
  console.log(`✅ Wrote ${icons.length} SmartIcons to ${OUTPUT_FILE}`)
}

main()
