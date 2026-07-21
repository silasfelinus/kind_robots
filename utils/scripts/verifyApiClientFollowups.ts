import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { mergeArtImageRecord } from '../../stores/helpers/artImageMerge'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')

function walk(path: string): string[] {
  const absolute = join(root, path)
  return readdirSync(absolute).flatMap((name) => {
    const child = join(path, name)
    const stat = statSync(join(root, child))
    return stat.isDirectory() ? walk(child) : [child]
  })
}

const mutableSources = ['stores', 'components', 'pages']
  .flatMap((path) => walk(path))
  .filter((path) => /\.(ts|vue)$/.test(path))
  .filter((path) => !path.startsWith('stores/seeds/'))
  .filter((path) => !path.includes('/abandonware/'))

const fallbackOwner =
  /(?:userId|ownerId)[^\n]{0,100}(?:\?\?|\|\|)[^\n]{0,40}\b(?:1|10)\b|\b(?:userId|ownerId)\s*:\s*(?:1|10)\b|function\s+\w+\([^)]*userId\s*=\s*(?:1|10)\b/g

const violations = mutableSources.flatMap((path) => {
  const source = read(path)
  return [...source.matchAll(fallbackOwner)].map((match) => ({
    path: relative(root, join(root, path)),
    text: match[0],
  }))
})

assert.deepEqual(
  violations,
  [],
  `Mutable client sources still fabricate owner IDs:\n${violations
    .map(({ path, text }) => `- ${path}: ${text}`)
    .join('\n')}`,
)

const userStore = read('stores/userStore.ts')
assert.match(userStore, /const userId = computed<number \| null>/)
assert.match(userStore, /const authenticatedUserId = computed<number \| null>/)
assert.match(userStore, /const currentUserId = user\.value\.id/)
assert.doesNotMatch(
  userStore.slice(
    userStore.indexOf('async function updateKarmaAndMana'),
    userStore.indexOf('async function spendMana'),
  ),
  /updateUserFields\(users\.value, userId\.value/,
)

const achievementStore = read('stores/achievementStore.ts')
assert.match(achievementStore, /if \(!shouldRun\(\) \|\| !userId\) return/)

const butterflyHelper = read('stores/helpers/butterflyHelper.ts')
assert.doesNotMatch(butterflyHelper, /userId:\s*null/)

const scenarioStore = read('stores/scenarioStore.ts')
assert.match(
  scenarioStore,
  /const scenarioId = Number\(scenarioForm\.value\.id \?\? 0\)/,
)
assert.match(scenarioStore, /updateScenario\(scenarioId, data\)/)

const serendipityStore = read('stores/serendipityStore.ts')
assert.match(
  serendipityStore,
  /export type SerendipitySession = \{[\s\S]*?userId: number \| null/,
)

const promptStore = read('stores/promptStore.ts')
const promptCreate = promptStore.slice(
  promptStore.indexOf('async function createPrompt'),
  promptStore.indexOf('async function updatePrompt'),
)
assert.doesNotMatch(promptCreate, /userId\s*:/)
assert.match(promptCreate, /ensureRealUser\(\)/)

const promptHelper = read('stores/helpers/promptHelper.ts')
assert.doesNotMatch(promptHelper, /userId\s*:/)
const dreamHelper = read('stores/helpers/dreamHelper.ts')
assert.doesNotMatch(
  dreamHelper.slice(
    dreamHelper.indexOf('export function buildDreamPayload'),
    dreamHelper.indexOf('export function legacyPitchToDreamPayload'),
  ),
  /userId\s*:/,
)

const selector = read('server/api/art/image/selects.ts')
for (const blob of [
  'imageData',
  'thumbnailData',
  'heroData',
  'cardData',
  'iconData',
]) {
  assert.doesNotMatch(selector, new RegExp(`\\b${blob}\\s*:`))
}

for (const route of [
  'server/api/art/image/index.post.ts',
  'server/api/art/image/[id].patch.ts',
  'server/api/art/save-generated.post.ts',
]) {
  assert.match(read(route), /select:\s*artImageMutationSelect/)
}

const rich = {
  id: 7,
  path: null,
  imageData: 'a'.repeat(500_000),
  thumbnailData: 'thumb',
}
const lean = {
  id: 7,
  path: '/images/generated/seven.webp',
  promptString: 'seven',
}
const merged = mergeArtImageRecord(rich, lean)
assert.equal(merged.imageData, rich.imageData)
assert.equal(merged.thumbnailData, rich.thumbnailData)
assert.equal(merged.path, lean.path)

const fullBytes = Buffer.byteLength(JSON.stringify(rich))
const leanBytes = Buffer.byteLength(JSON.stringify(lean))
assert.ok(leanBytes < fullBytes * 0.01)

const artStore = read('stores/artStore.ts')
assert.match(artStore, /mergeArtImageRecords/)
assert.match(artStore, /includeImageData:\s*true/)
assert.match(artStore, /saveBrowserGeneratedArtImage[\s\S]*getArtImageById/)

console.log(
  `API client follow-ups verified: no fallback mutation owners; lean sample ${leanBytes} bytes vs ${fullBytes} bytes; hydrated media survives lean merges.`,
)
