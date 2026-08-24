import { readFileSync } from 'node:fs'

const failures: string[] = []

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function requireText(source: string, text: string, message: string): void {
  if (!source.includes(text)) failures.push(message)
}

function forbidText(source: string, text: string, message: string): void {
  if (source.includes(text)) failures.push(message)
}

function between(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start)
  if (startIndex < 0) return ''
  const endIndex = source.indexOf(end, startIndex + start.length)
  return endIndex < 0 ? source.slice(startIndex) : source.slice(startIndex, endIndex)
}

const gallery = read('components/gallery/kr-gallery.vue')
const dreamListRoute = read('server/api/dreams/index.get.ts')
const scenarioListRoute = read('server/api/scenarios/index.get.ts')
const scenarioDetailRoute = read('server/api/scenarios/[id].get.ts')
const rewardListRoute = read('server/api/rewards/index.get.ts')
const rewardModel = read('server/api/rewards/index.ts')
const rewardCard = read('components/rewards/reward-card.vue')

for (const token of [
  '<kr-viewport-gate @hydrate="hydrateSlotItem(item.id)">',
  'v-if="hydratedSlotItems.has(item.id)"',
  'data-kr-gallery-placeholder',
  '{{ item.title }}',
]) {
  requireText(
    gallery,
    token,
    `custom gallery slots must keep a text-first index and defer component mounting: ${token}`,
  )
}

requireText(
  dreamListRoute,
  "if (value === undefined || value === null || value === '') return undefined",
  'Dream list requests without an explicit take must mean complete browse index',
)
requireText(
  dreamListRoute,
  '...(take === undefined ? {} : { take })',
  'Dream list query must omit Prisma take for complete browse-index requests',
)
forbidText(
  dreamListRoute,
  'thumbnailData: true',
  'Dream browse index must not ship inline thumbnail blobs before viewport hydration',
)
forbidText(
  dreamListRoute,
  'take: 3,\n',
  'Dream browse relationships must not be truncated to three records',
)
requireText(
  dreamListRoute,
  'const collectionPreviewSelect = {',
  'Dream browse records must carry a lightweight collection preview shape',
)
requireText(
  dreamListRoute,
  'ArtCollections: {\n    select: collectionPreviewSelect,\n  }',
  'Dream relationship browsing must receive every attached collection id',
)

requireText(
  scenarioListRoute,
  'const characterBrowseSelect = {',
  'Scenario list must declare a dedicated lightweight Character relation shape',
)
requireText(
  scenarioListRoute,
  'Characters: {\n          select: characterBrowseSelect,',
  'Scenario list must use the lightweight Character relation shape',
)

const scenarioCharacterBrowse = between(
  scenarioListRoute,
  'const characterBrowseSelect = {',
  '\n}\n\nfunction facetVisibilityWhere',
)

for (const token of [
  'id: true',
  'name: true',
  'class: true',
  'species: true',
  'genre: true',
  'imagePath: true',
  'isPublic: true',
  'artImageId: true',
]) {
  requireText(
    scenarioCharacterBrowse,
    token,
    `Scenario browse Characters must retain card/search field: ${token}`,
  )
}

for (const token of [
  'backstory: true',
  'drive: true',
  'quirks: true',
  'personality: true',
  'presentation: true',
  'artPrompt: true',
  'charm: true',
  'empathy: true',
  'grace: true',
  'luck: true',
  'might: true',
  'wits: true',
]) {
  forbidText(
    scenarioCharacterBrowse,
    token,
    `Scenario list must leave heavy Character detail to /api/scenarios/:id: ${token}`,
  )
}

const scenarioCharacterDetail = between(
  scenarioDetailRoute,
  'const characterSelect = {',
  '\n}\n\nfunction facetVisibilityWhere',
)

for (const token of [
  'backstory: true',
  'personality: true',
  'presentation: true',
  'artPrompt: true',
  'charm: true',
  'wits: true',
]) {
  requireText(
    scenarioCharacterDetail,
    token,
    `Scenario detail endpoint must retain rich Character hydration: ${token}`,
  )
}

forbidText(
  rewardListRoute,
  "import { rewardInclude } from './'",
  'Reward list must not import the rich Reward relation graph',
)
forbidText(
  rewardListRoute,
  'include: rewardInclude',
  'Reward list must return scalar browse records instead of hydrating every relation',
)

for (const token of [
  'ArtImage: true',
  'Characters: true',
  'Dreams: true',
  'Reactions: true',
  'User: {',
]) {
  forbidText(
    rewardListRoute,
    token,
    `Reward list must not inline catalog-wide relation payload: ${token}`,
  )
}

const rewardDetailInclude = between(
  rewardModel,
  'export const rewardInclude = {',
  '\n} satisfies Prisma.RewardInclude',
)

for (const token of [
  'ArtImage: true',
  'Characters: true',
  'Dreams: true',
  'Reactions: true',
  'User: {',
]) {
  requireText(
    rewardDetailInclude,
    token,
    `Reward detail model must retain rich relation hydration: ${token}`,
  )
}

const fetchRewardDetail = between(
  rewardModel,
  'export async function fetchRewardById(',
  '\n}\n\nexport async function fetchRewardBySlug',
)
requireText(
  fetchRewardDetail,
  'include: rewardInclude',
  'Reward by-id detail fetch must keep the rich relation graph',
)

requireText(
  rewardCard,
  'if (!props.reward.artImageId || !props.showImage || embeddedArtImage.value)',
  'Reward cards must keep lazy ArtImage fallback when browse rows omit embedded ArtImage',
)
requireText(
  rewardCard,
  'artImage.value = await fetchArtImageById(props.reward.artImageId)',
  'Reward cards must hydrate ArtImage by id only when the mounted card needs it',
)

if (failures.length) {
  for (const failure of failures) console.error(`FAIL - ${failure}`)
  process.exit(1)
}

console.log(
  'ok - galleries expose complete text-first indexes, defer custom card setup, and keep Dream/Scenario/Reward browse payloads lightweight without losing rich detail hydration',
)
