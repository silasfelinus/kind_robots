// /utils/scripts/verifyWonderLabCanonicalManifest.ts
import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const LEGACY_PUBLIC_PATH = 'public/components.json'
const CANONICAL_PUBLIC_PATH = 'public/wonderlab-components.json'
const SOURCE_ROOTS = [
  'components',
  'content',
  'pages',
  'server',
  'stores',
  'utils/wonderlab',
]

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectSourceFiles(
  directory: string,
  files: string[] = [],
): Promise<string[]> {
  if (!(await exists(directory))) return files

  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, files)
      continue
    }

    if (/\.(?:ts|js|mjs|vue|md)$/.test(entry.name)) files.push(entryPath)
  }

  return files
}

assert.equal(
  await exists(LEGACY_PUBLIC_PATH),
  false,
  `${LEGACY_PUBLIC_PATH} must remain retired`,
)

const generator = await readFile(
  'utils/scripts/create-component-json.mjs',
  'utf8',
)
assert.match(generator, /public\/wonderlab-components\.json/)
assert.doesNotMatch(generator, /LEGACY_OUTPUT|buildLegacyFolders/)
assert.doesNotMatch(generator, /public\/components\.json/)
assert.match(generator, /sourceHash/)
assert.match(generator, /sourcePath/)
assert.match(generator, /sourceKey/)

const [nuxtConfig, packageJson] = await Promise.all([
  readFile('nuxt.config.ts', 'utf8'),
  readFile('package.json', 'utf8'),
])
assert.match(nuxtConfig, /create-component-json\.mjs/)
assert.match(packageJson, /"components:manifest": "node utils\/scripts\/create-component-json\.mjs"/)

const sourceFiles = (
  await Promise.all(SOURCE_ROOTS.map((root) => collectSourceFiles(root)))
).flat()

for (const filePath of sourceFiles) {
  const source = await readFile(filePath, 'utf8')
  assert.equal(
    source.includes('/components.json') ||
      source.includes('public/components.json'),
    false,
    `${filePath} must not depend on the retired component inventory`,
  )
}

assert.equal(
  CANONICAL_PUBLIC_PATH.endsWith('wonderlab-components.json'),
  true,
)

console.log('WonderLab canonical manifest contract passed.')
