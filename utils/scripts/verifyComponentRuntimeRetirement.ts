import assert from 'node:assert/strict'
import { access, readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const roots = ['app.vue', 'components', 'composables', 'layouts', 'pages', 'plugins', 'stores']
const excludedParts = ['/abandonware/', '/wonderlab/']
const sourceExtensions = ['.ts', '.vue']

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function walk(path: string): Promise<string[]> {
  const info = await stat(path)
  if (info.isFile()) return [path]
  const entries = await readdir(path)
  const nested = await Promise.all(entries.map((entry) => walk(join(path, entry))))
  return nested.flat()
}

const existingRoots = (
  await Promise.all(roots.map(async (root) => ((await exists(root)) ? root : null)))
).filter((root): root is string => Boolean(root))

const files = (await Promise.all(existingRoots.map((root) => walk(root))))
  .flat()
  .filter((file) => sourceExtensions.some((extension) => file.endsWith(extension)))
  .filter((file) => !excludedParts.some((part) => `/${file.replaceAll('\\', '/')}`.includes(part)))

const offenders: string[] = []
for (const file of files) {
  const source = await readFile(file, 'utf8')
  if (/componentStore|useComponentStore|loadComponentStore/.test(source)) offenders.push(file)
}

assert.deepEqual(
  offenders,
  [],
  `Retired Component store is still referenced by live application code: ${offenders.join(', ')}`,
)

const managerStore = await readFile('stores/animationManagerStore.ts', 'utf8')
assert.match(managerStore, /animationEffects/)
assert.match(managerStore, /useAnimationStore/)
assert.doesNotMatch(managerStore, /ComponentStatus|KindComponent|componentStore|animationComponentHelper/)

const manager = await readFile('components/animation/animation-manager.vue', 'utf8')
assert.match(manager, /live catalog effects/)
assert.match(manager, /Preview effect/)
assert.doesNotMatch(manager, /component-card|ComponentStatus|KindComponent|build history|recordAnimationAttempt/)

const storeIndex = await readFile('stores/index.ts', 'utf8')
assert.doesNotMatch(storeIndex, /loadComponentStore|componentStore/)

console.log(`Component runtime retirement contract passed: ${files.length} live source files checked.`)
