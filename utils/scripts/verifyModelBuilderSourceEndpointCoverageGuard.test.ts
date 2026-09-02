// /utils/scripts/verifyModelBuilderSourceEndpointCoverageGuard.test.ts
//
// Regression test for checkSourceEndpointCoverageGuard()/
// extractSourceEndpointEntries() in
// verifyModelBuilderSourceEndpointCoverageGuard.ts (model-builder/t-029,
// cycle 84). Exercises the real check against a synthetic
// modelBuilderRecipes.ts-shaped fixture covering: a typo'd endpoint, a
// renamed/removed route, the clean shape with every endpoint present, and a
// leading comment containing literal `{`/`}` characters (the real Facet
// entry's actual shape -- see this file's header note).
import assert from 'node:assert/strict'

import {
  checkSourceEndpointCoverageGuard,
  extractSourceEndpointEntries,
} from './verifyModelBuilderSourceEndpointCoverageGuard.js'

const AVAILABLE_ROUTES = new Set([
  '/api/projects',
  '/api/characters',
  '/api/bots',
])

function fixture(options: {
  botEndpoint?: string
  projectLeadingComment?: string
}): string {
  const botEndpoint = options.botEndpoint ?? '/api/bots'
  const projectLeadingComment = options.projectLeadingComment ?? ''
  return `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {${projectLeadingComment}
    key: 'Project',
    label: 'Project',
    plural: 'Projects',
    icon: 'kind-icon:blueprint',
    endpoint: '/api/projects',
    titleField: 'title',
    defaultRecipe: 'marketing-deck',
    recipes: ['marketing-deck'],
    blurb: 'x',
  },
  {
    key: 'Bot',
    label: 'Bot',
    plural: 'Bots',
    icon: 'kind-icon:robot',
    endpoint: '${botEndpoint}',
    titleField: 'name',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck'],
    blurb: 'x',
  },
]
`
}

// --- extraction --------------------------------------------------------

const cleanFixture = fixture({})
const entries = extractSourceEndpointEntries(cleanFixture)
assert.equal(
  entries.length,
  2,
  `expected 2 parsed endpoint entries, got ${entries.length}`,
)
assert.deepEqual(
  entries.map((e) => `${e.key}:${e.endpoint}`),
  ['Project:/api/projects', 'Bot:/api/bots'],
)

// --- the real check ------------------------------------------------------

const routeExists = (endpoint: string): boolean =>
  AVAILABLE_ROUTES.has(endpoint)

const cleanErrors = checkSourceEndpointCoverageGuard(entries, routeExists)
assert.equal(
  cleanErrors.length,
  0,
  `expected the clean shape to raise no errors, got: ${JSON.stringify(cleanErrors)}`,
)

const typoEntries = extractSourceEndpointEntries(
  fixture({ botEndpoint: '/api/botz' }),
)
const typoErrors = checkSourceEndpointCoverageGuard(typoEntries, routeExists)
assert.equal(
  typoErrors.length,
  1,
  `expected exactly 1 error for the typo'd endpoint, got: ${JSON.stringify(typoErrors)}`,
)
assert.ok(
  typoErrors[0]!.includes("SOURCE_TYPES['Bot']") &&
    typoErrors[0]!.includes('/api/botz'),
  `expected the error to name the SOURCE_TYPES Bot entry and the typo'd endpoint, got: ${typoErrors[0]}`,
)

const renamedEntries = extractSourceEndpointEntries(
  fixture({ botEndpoint: '/api/robots' }),
)
const renamedErrors = checkSourceEndpointCoverageGuard(
  renamedEntries,
  routeExists,
)
assert.equal(
  renamedErrors.length,
  1,
  `expected exactly 1 error for the renamed-away-from route, got: ${JSON.stringify(renamedErrors)}`,
)

const braceCommentEntries = extractSourceEndpointEntries(
  fixture({
    projectLeadingComment:
      '\n    // see server/api/{dreams,scenarios}/[id]/facets.put.ts for context',
  }),
)
assert.equal(
  braceCommentEntries.length,
  2,
  `expected the brace-containing comment not to swallow or duplicate any entry, got: ${JSON.stringify(braceCommentEntries)}`,
)
assert.deepEqual(
  braceCommentEntries.map((e) => `${e.key}:${e.endpoint}`),
  ['Project:/api/projects', 'Bot:/api/bots'],
  `expected both entries to survive a brace-containing leading comment, got: ${JSON.stringify(braceCommentEntries)}`,
)

console.log(
  'Model Builder source-endpoint coverage guard checker verified: parses ' +
    'SOURCE_TYPES endpoint entries, passes on the clean shape, and flags a ' +
    'typo or a renamed-away-from route.',
)
