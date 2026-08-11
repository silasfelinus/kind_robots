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
    !new RegExp(`^import\\s+[^\\n]+helpers/${moduleName}['\"]`, 'm').test(
      modelCards,
    ),
    `modelCards.ts statically imports ${moduleName}; that pins the deck into the eager pageStore graph.`,
  )
  check(
    new RegExp(`import\\(['\"]@/stores/helpers/${moduleName}['\"]\\)`).test(
      modelCards,
    ),
    `modelCards.ts has no dynamic loader for ${moduleName}.`,
  )
}

check(
  /export\s+async\s+function\s+preloadModelCards/.test(modelCards),
  'modelCards.ts must expose preloadModelCards so the router can hydrate the requested deck before pageStore reads it.',
)
check(
  /pendingLoads/.test(modelCards),
  'modelCards.ts must deduplicate in-flight deck imports during client navigation.',
)
check(
  /import\s+\{\s*preloadModelCards\s*\}\s+from\s+['\"]@\/stores\/helpers\/modelCards['\"]/.test(
    slugPage,
  ),
  'pages/[...slug].vue must import preloadModelCards.',
)
check(
  /await\s+preloadModelCards\(cards\)/.test(slugPage),
  'pages/[...slug].vue must await the content page deck before committing the page to Pinia.',
)
check(
  /await\s+syncPageStore\(\)/.test(slugPage),
  'pages/[...slug].vue must await initial page-store synchronization during SSR.',
)
check(
  /getModelCards\(value\)/.test(pageStore),
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
