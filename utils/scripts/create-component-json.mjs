// /utils/scripts/create-component-json.mjs
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { extractWonderLabComponentSourceEvidence } from '../wonderlab/componentSourceEvidence.mjs'

const ROOT = process.cwd()
const COMPONENT_ROOT = path.resolve(ROOT, 'components')
const PUBLIC_MANIFEST_OUTPUT = path.resolve(ROOT, 'public/wonderlab-components.json')
const SERVER_MANIFEST_OUTPUT = path.resolve(
  ROOT,
  'server/assets/wonderlab/wonderlab-components.json',
)

const ignoredSegments = new Set(['abandonware', '__tests__', '__fixtures__'])

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function toSlug(value) {
  return value
    .replace(/\.vue$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function shouldIgnore(relativePath) {
  const segments = toPosix(relativePath).split('/')
  return segments.some((segment) => ignoredSegments.has(segment))
}

async function collectVueFiles(directory, files = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(COMPONENT_ROOT, absolutePath)

    if (shouldIgnore(relativePath)) continue

    if (entry.isDirectory()) {
      await collectVueFiles(absolutePath, files)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(absolutePath)
    }
  }

  return files
}

async function buildManifestEntry(absolutePath) {
  const relativePath = toPosix(path.relative(COMPONENT_ROOT, absolutePath))
  const sourcePath = `components/${relativePath}`
  const folderName = toPosix(path.dirname(relativePath))
  const componentName = path.basename(relativePath, '.vue')
  const source = await fs.readFile(absolutePath, 'utf8')
  const sourceHash = createHash('sha256').update(source).digest('hex')

  return {
    sourceKey: sourcePath.toLowerCase(),
    sourcePath,
    sourceHash,
    componentName,
    slug: toSlug(relativePath),
    folderName: folderName === '.' ? 'root' : folderName,
    sourceEvidence: extractWonderLabComponentSourceEvidence(source),
  }
}

async function writeManifest(target, manifest) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function generateComponentManifest() {
  const files = await collectVueFiles(COMPONENT_ROOT)
  const entries = await Promise.all(files.map(buildManifestEntry))
  entries.sort((left, right) =>
    left.sourcePath.localeCompare(right.sourcePath, 'en'),
  )

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    componentRoot: 'components',
    count: entries.length,
    entries,
  }

  await Promise.all([
    writeManifest(PUBLIC_MANIFEST_OUTPUT, manifest),
    writeManifest(SERVER_MANIFEST_OUTPUT, manifest),
  ])

  console.log(
    `Generated ${entries.length} WonderLab component entries at ${path.relative(ROOT, PUBLIC_MANIFEST_OUTPUT)} and ${path.relative(ROOT, SERVER_MANIFEST_OUTPUT)}.`,
  )
}

generateComponentManifest().catch((error) => {
  console.error('Failed to generate WonderLab component manifest:', error)
  process.exitCode = 1
})
