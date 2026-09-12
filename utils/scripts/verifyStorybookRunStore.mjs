// /utils/scripts/verifyStorybookRunStore.mjs
//
// Contract check for stores/storybookRunStore.ts (storybook/t-029).
//
// This store is the client half of an engine whose whole point is that the
// SERVER owns the numbers. The checks below pin the properties that make that
// true, because each one is easy to undo later for a plausible-sounding reason:
//
//   - submitting a chosen option sends its id and nothing else. The moment a
//     future edit posts the effects it was shown "to save a round trip", the
//     client can author its own ending.
//   - the store keeps exactly one localStorage key, the id of the run to
//     reopen. A story surviving a different device is the reason this engine
//     exists at all; caching the run body here would quietly reintroduce the
//     localStorage library it replaces.
//   - every action checks `success` before storing (AGENTS.md), and the store
//     owns the fetches so components never reach for $fetch themselves.

import { readFileSync } from 'node:fs'

const STORE_PATH = 'stores/storybookRunStore.ts'
const source = readFileSync(STORE_PATH, 'utf8')

let failures = 0

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('Storybook run store — the server owns the numbers')

const chooseOption = source.slice(
  source.indexOf('function chooseOption('),
  source.indexOf('function writeMove('),
)
check(
  'choosing an option sends only its id',
  chooseOption.includes("source: 'option'") &&
    chooseOption.includes('optionId') &&
    !chooseOption.includes('effects'),
  chooseOption.replace(/\s+/g, ' ').slice(0, 120),
)
check(
  'no action posts an effects map to the server',
  !/body:\s*JSON\.stringify\([^)]*effects/s.test(source),
)
check(
  'the store never computes an outcome key or resolves an ending itself',
  !source.includes('outcomeKey') && !source.includes('resolveDeckOutcomeKey'),
)
check(
  'resolving asks the server rather than deriving a result',
  /resolve`,\s*\{\s*method: 'POST'/.test(source.replace(/\s+/g, ' ')) ||
    source.includes("/resolve`,\n        { method: 'POST' },"),
)

console.log('Storybook run store — persistence stays on the server')

const storageKeys = [
  ...source.matchAll(
    /localStorage\.(getItem|setItem|removeItem)\(\s*([A-Za-z_]+)/g,
  ),
]
check(
  'every localStorage call uses the one named key constant',
  storageKeys.length > 0 &&
    storageKeys.every(([, , key]) => key === 'ACTIVE_RUN_STORAGE_KEY'),
  storageKeys.map(([, , key]) => key).join(', '),
)
check(
  'that key holds a run id, not a story',
  source.includes("const ACTIVE_RUN_STORAGE_KEY = 'storybook-active-run-id'"),
)
check(
  'localStorage access is wrapped so a private window cannot throw',
  (source.match(/try \{/g) || []).length >= 2 &&
    source.includes("typeof localStorage === 'undefined'"),
)
check(
  'a run that will not load stops being resumed on every mount',
  source.includes('if (!loaded) writeStoredRunId(null)'),
)

console.log('Storybook run store — store conventions')

check(
  'the store owns its fetches through performFetch',
  source.includes("import { performFetch } from '@/stores/utils'") &&
    !source.includes('$fetch('),
)
const actionBodies = [
  'fetchDecks',
  'fetchAdventures',
  'fetchCollection',
  'openStory',
  'loadRun',
  'submitMove',
  'resolveRun',
]
for (const action of actionBodies) {
  const start = source.indexOf(`function ${action}(`)
  const body = source.slice(start, start + 1400)
  check(
    `${action} checks success before storing anything`,
    body.includes('if (!response.success'),
  )
}
check(
  'a busy flag guards every action that can be double-fired',
  source.includes('if (!active || isNarrating.value) return false') &&
    source.includes('if (isOpening.value) return false') &&
    source.includes('if (!active || isResolving.value) return false'),
)

console.log('Storybook run store — the deck keeps its secrets')

check(
  'a deck is described by its axis COUNT, never its axis keys',
  source.includes('axisCount') && !/axes\s*[:?]/.test(source),
)
check(
  'stats are documented as life-only rather than assumed present',
  source.includes('Life only'),
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll Storybook run store checks passed.')
