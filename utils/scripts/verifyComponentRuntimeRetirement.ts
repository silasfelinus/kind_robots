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

assert.equal(
  await exists('server/api/components'),
  false,
  'Retired /api/components surface must stay deleted',
)
assert.equal(
  await exists('stores/helpers/componentHelper.ts'),
  false,
  'Retired Component API helper must stay deleted with the /api/components surface',
)
assert.equal(
  await exists('components/wonderlab/lab-manager.vue'),
  false,
  'Retired lab-manager wrapper must stay deleted',
)

const [memoryContent, screenFxContent, animationManagerContent] = await Promise.all([
  readFile('content/play/memory.md', 'utf8'),
  readFile('content/play/screenfx.md', 'utf8'),
  readFile('content/build/animation-manager.md', 'utf8'),
])
assert.match(memoryContent, /:memory-dungeon\s*$/m)
assert.doesNotMatch(memoryContent, /:lab-manager/)
assert.match(screenFxContent, /:screen-fx\{show-header=false\}\s*$/m)
assert.doesNotMatch(screenFxContent, /:lab-manager/)
assert.match(animationManagerContent, /:animation-manager\s*$/m)
assert.doesNotMatch(animationManagerContent, /:lab-manager/)

const prismaSchema = await readFile('prisma/schema.prisma', 'utf8')
assert.doesNotMatch(prismaSchema, /model\s+Component\s*\{/, 'Retired Component model must not return')
assert.doesNotMatch(prismaSchema, /\bcomponentId\s+Int\?/, 'Retired Reaction.componentId must not return')
assert.doesNotMatch(prismaSchema, /enum\s+ComponentStatus\s*\{/, 'Retired ComponentStatus enum must not return')

const migration = await readFile(
  'prisma/migrations/20260812040500_retire_component_schema/migration.sql',
  'utf8',
)
const orderedDrops = [
  'DROP TABLE IF EXISTS `ReviewDraft`',
  'DELETE FROM `Reaction`',
  'DROP FOREIGN KEY `Reaction_componentId_fkey`',
  'DROP COLUMN `componentId`',
  'DROP TABLE `Component`',
]
let cursor = -1
for (const fragment of orderedDrops) {
  const next = migration.indexOf(fragment)
  assert.ok(next > cursor, `Component retirement migration must preserve dependency order: ${fragment}`)
  cursor = next
}

const configFiles = await readdir('config')
const voiceCorpus = configFiles.filter((name) => /^wonderlab-voice-polish-batch-\d+\.json$/.test(name))
assert.equal(voiceCorpus.length, 39, 'The 39 checked-in voice corpus files must survive Component table retirement')

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

console.log(
  `Component retirement contract passed: ${files.length} live source files checked; Component schema removed and 39-file voice corpus preserved.`,
)
