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
const characterListRoute = read('server/api/characters/index.get.ts')
const characterDetailRoute = read('server/api/characters/[id].get.ts')
const characterSelects = read('server/api/characters/selects.ts')
const characterStore = read('stores/characterStore.ts')
const characterGallery = read('components/characters/character-gallery.vue')
const characterCard = read('components/characters/character-card.vue')
const storybookPage = read('components/conductor/storybook-page.vue')
const stageSlot = read('components/stages/stage-slot.vue')
const stageStore = read('stores/stageStore.ts')

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

// Character Gallery has a deliberately stricter browse/detail seam because the
// model contains several long authored text fields and Stage uses those fields
// to construct prompts. The catalog stays complete but lightweight; rich detail
// is cached only for Characters the user actually opens/edits/casts.
requireText(
  characterListRoute,
  "import { characterBrowseSelect } from './selects'",
  'Character list route must import the dedicated browse select',
)
requireText(
  characterListRoute,
  'select: characterBrowseSelect',
  'Character list route must query only the dedicated browse shape',
)

const characterBrowseSelect = between(
  characterSelects,
  'export const characterBrowseSelect = {',
  '\n} satisfies Prisma.CharacterSelect',
)
for (const token of [
  'id: true',
  'name: true',
  'class: true',
  'species: true',
  'genre: true',
  'artImageId: true',
  // The card/hero/icon ids and paths used to be listed here too. The slot
  // collapse dropped those columns: every gallery mode now crops the primary,
  // so artImageId + imagePath is the whole art payload a browse card needs.
  'imagePath: true',
  'isPublic: true',
  'isMature: true',
  'isActive: true',
  'presentation: true',
  'role: true',
  'slug: true',
]) {
  requireText(
    characterBrowseSelect,
    token,
    `Character browse catalog must retain card/filter field: ${token}`,
  )
}

for (const token of [
  'achievements: true',
  'backstory: true',
  'drive: true',
  'quirks: true',
  'artPrompt: true',
  'personality: true',
  'sampleResponse: true',
  'voice: true',
]) {
  forbidText(
    characterBrowseSelect,
    token,
    `Character catalog must leave long-form detail behind the by-id route: ${token}`,
  )
}

requireText(
  characterDetailRoute,
  'prisma.character.findUnique({ where: { id } })',
  'Character by-id endpoint must continue returning full scalar detail',
)

for (const token of [
  'const browseCharacters = ref<CharacterBrowse[]>([])',
  'const characters = ref<Character[]>([])',
  "await performFetch<CharacterBrowse[]>('/api/characters')",
  'browseCharacters.value = response.data.slice().sort(sortCharacters)',
  'const response = await performFetch<Character>(',
  '`/api/characters/${characterId}`',
  'return upsertCharacter(response.data)',
]) {
  requireText(
    characterStore,
    token,
    `Character store must keep browse and rich-detail caches separate: ${token}`,
  )
}

const characterDetailConsumers = [
  {
    label: 'selectCharacter',
    body: between(
      characterStore,
      'async function selectCharacter(',
      '\n\n  function deselectCharacter',
    ),
  },
  {
    label: 'startEditingCharacter',
    body: between(
      characterStore,
      'async function startEditingCharacter(',
      '\n\n  async function startCloningCharacter',
    ),
  },
  {
    label: 'startCloningCharacter',
    body: between(
      characterStore,
      'async function startCloningCharacter(',
      '\n\n  async function updateArtImagePath',
    ),
  },
]

for (const consumer of characterDetailConsumers) {
  requireText(
    consumer.body,
    'fetchCharacterById(characterId)',
    `${consumer.label} must hydrate full Character detail before use`,
  )
}

for (const token of [
  'characterStore.browseCharacters ?? []',
  'computed<CharacterBrowse[]>',
  'await characterStore.fetchCharacterById(id)',
  'characterStore.characters.find(',
]) {
  requireText(
    characterGallery,
    token,
    `Character Gallery must browse lightweight rows but hydrate rich info backs: ${token}`,
  )
}
for (const token of [
  'character.personality,',
  'character.backstory,',
  'character.achievements,',
  'character.quirks,',
  'character.drive,',
  'character.artPrompt,',
]) {
  forbidText(
    between(
      characterGallery,
      'function characterMatchesSearch(',
      '\n}\n\nfunction getCharacterTitle',
    ),
    token,
    `Character catalog search must not depend on omitted long-form field: ${token}`,
  )
}

requireText(
  characterCard,
  'type CharacterCardRecord = CharacterBrowse &',
  'Character card prop must accept the explicit browse record shape',
)
requireText(
  characterCard,
  'const richCharacter = computed(',
  'Character card must resolve optional rich detail separately from browse props',
)

requireText(
  storybookPage,
  'characterStore.browseCharacters.map((character) => ({',
  'Storybook cast picker must use lightweight Character browse rows',
)
forbidText(
  between(
    storybookPage,
    'const characterOptions = computed<NarrativeIngredientOption[]>(() =>',
    '\n\n/*\n * Scenarios as story FRAMES.',
  ),
  'character.personality',
  'Storybook Character picker must not require rich personality detail for every catalog row',
)
forbidText(
  between(
    storybookPage,
    'const characterOptions = computed<NarrativeIngredientOption[]>(() =>',
    '\n\n/*\n * Scenarios as story FRAMES.',
  ),
  'character.backstory',
  'Storybook Character picker must not require rich backstory detail for every catalog row',
)

for (const token of [
  'const availableCharacters = computed<CharacterBrowse[]>(() =>',
  'characterStore.browseCharacters.length',
  'void characterStore.initialize({',
  'fetchRemote: true,',
]) {
  requireText(
    stageSlot,
    token,
    `Stage cast picker must use and refresh the lightweight Character catalog: ${token}`,
  )
}

for (const token of [
  'async function ensureCastCharacterDetails(): Promise<void>',
  'ids.map((id) => characterStore.fetchCharacterById(id))',
  'await ensureCastCharacterDetails()',
  'return (characterStore.characters || []).find(',
]) {
  requireText(
    stageStore,
    token,
    `Stage prompt path must hydrate and read rich Character detail: ${token}`,
  )
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL - ${failure}`)
  process.exit(1)
}

console.log(
  'ok - galleries expose complete text-first indexes, defer custom card setup, and keep Dream/Scenario/Reward/Character browse payloads lightweight without losing rich detail hydration',
)
