import { readFileSync } from 'node:fs'

const modelCards = readFileSync('stores/helpers/modelCards.ts', 'utf8')
const slugPage = readFileSync('pages/[...slug].vue', 'utf8')
const pageStore = readFileSync('stores/pageStore.ts', 'utf8')

const deckModules = [
  'adventureCards',
  'artCards',
  'botCards',
  'conductorCards',
  'dreamCards',
  'labCards',
  'navCards',
  'rewardCards',
  'scenarioCards',
]

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const moduleName of deckModules) {
  check(
    !modelCards.includes(`from '@/stores/helpers/${moduleName}'`),
    `modelCards.ts statically imports ${moduleName}; that pins the deck into the eager pageStore graph.`,
  )
  check(
    modelCards.includes(`import('@/stores/helpers/${moduleName}')`),
    `modelCards.ts has no dynamic loader for ${moduleName}.`,
  )
}

check(
  modelCards.includes('export async function preloadModelCards'),
  'modelCards.ts must expose preloadModelCards so the router can hydrate the requested deck before pageStore reads it.',
)
check(
  modelCards.includes('pendingLoads'),
  'modelCards.ts must deduplicate in-flight deck imports during client navigation.',
)
check(
  slugPage.includes(
    "import { preloadModelCards } from '@/stores/helpers/modelCards'",
  ),
  'pages/[...slug].vue must import preloadModelCards.',
)
check(
  slugPage.includes('await preloadModelCards(initialCards)'),
  'pages/[...slug].vue must preload the initial content-page deck during SSR.',
)
check(
  slugPage.includes('await preloadModelCards(cards)'),
  'pages/[...slug].vue must await route-navigation deck loads before committing the page to Pinia.',
)
check(
  slugPage.includes('\nsyncPageStore()\n\nonMounted('),
  'pages/[...slug].vue must synchronously commit the preloaded initial page before onMounted so SSR and hydration agree.',
)
check(
  pageStore.includes('getModelCards(value)'),
  'pageStore.ts must continue reading the preloaded deck synchronously so SSR and hydration render the same hand.',
)

if (failures.length) {
  console.error(`Model-card lazy boundary failed with ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Model-card lazy boundary passed: ${deckModules.length} workspace decks remain route-loaded and pageStore consumes the preloaded cache synchronously.`,
)
