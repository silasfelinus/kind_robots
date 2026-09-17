// /utils/scripts/verifyStorybookCharacterGating.mjs
//
// Contract check for Character gating (storybook/t-038), the follow-on to the
// dormant deck gate t-033 built. Pins the properties easiest to quietly
// regress:
//
//   - the server checks EVERY cast member, not only the Hero -- a locked
//     Company card is exactly as much of a spoiler as a locked protagonist.
//   - enforcement stays behind the same STORYBOOK_ENFORCE_DECK_GATES flag
//     the deck gate already uses, so there is one switch, not two.
//   - the client never learns WHY a card is locked beyond its hint text --
//     no achievementId, no raw AchievementRecord query, leaves the server.
//   - a locked card renders face-down (no title, no artwork) rather than
//     merely disabled, and cannot be toggled onto the board even if the
//     disabled button is bypassed some other way (keyboard/test harness).

import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(path, 'utf8')
}

let failures = 0

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('Storybook character gating — the server')

const gating = source('server/utils/storybookGating.ts')
const runs = source('server/utils/storybookRuns.ts')
const charactersRoute = source('server/api/storybook/characters/index.get.ts')

check(
  'one shared enforcement flag covers both gate kinds',
  gating.includes("DECK_GATE_ENV_FLAG = 'STORYBOOK_ENFORCE_DECK_GATES'") &&
    (gating.match(/deckGatesEnforced\(\)/g) || []).length >= 2,
)
check(
  'assertCastPlayable checks every cast member, not only the first',
  /for \(const character of cast\)/.test(gating) &&
    gating.includes('export async function assertCastPlayable'),
)
check(
  'createStoryRun gates the whole orderedCast, before it is used',
  runs.includes('await assertCastPlayable(orderedCast, userId)') &&
    runs.indexOf('await assertCastPlayable(orderedCast, userId)') >
      runs.indexOf('const orderedCast ='),
)
check(
  'the cast query pulls unlockAchievementId so the gate has something to check',
  /select:\s*\{[\s\S]{0,400}unlockAchievementId: true/.test(
    runs.slice(runs.indexOf('castSlugs.length')),
  ),
)
check(
  'listGatedCharacters exists and only returns the gated subset',
  runs.includes('export async function listGatedCharacters') &&
    /unlockAchievementId:\s*\{\s*not:\s*null\s*\}/.test(runs),
)
check(
  'the gated-characters route requires auth like the decks route',
  charactersRoute.includes('requireApiUser') &&
    charactersRoute.includes('listGatedCharacters'),
)

console.log(
  '\nStorybook character gating — the client never sees why, only the hint',
)

const listDecksBody = runs.slice(
  runs.indexOf('export async function listDecks'),
  runs.indexOf('export async function listGatedCharacters'),
)
check(
  'decks stay secretive: axis keys never leave, only the count',
  listDecksBody.includes('axisCount: deck.axes.length') &&
    !/axes:\s*deck\.axes[,\s]/.test(listDecksBody),
)
check(
  'no route ever ships a raw achievementId to the client',
  !runs.includes('unlockAchievementId,') ||
    !/data:\s*\{[^}]*unlockAchievementId/.test(runs),
)

console.log('\nStorybook character gating — the Table')

const table = source('components/storybook/storybook-table.vue')
check(
  'the Table fetches both gate sources on mount',
  table.includes('runStore.fetchDecks()') &&
    table.includes('runStore.fetchGatedCharacters()'),
)
check(
  'genre cards and hero/company cards are both checked for a lock',
  table.includes('.map(withGenreLock)') &&
    table.includes('.map(withCharacterLock)'),
)
check(
  'a locked card cannot be toggled onto the board',
  /function toggleCard[\s\S]{0,400}if \(card\.locked\) return/.test(table),
)

console.log(
  '\nStorybook character gating — the card renders face-down, not just disabled',
)

const card = source('components/narrative/narrative-ingredient-card.vue')
check(
  'a locked card hides its title and artwork behind a lock icon',
  /v-if="item\.locked"[\s\S]{0,400}kind-icon:lock/.test(card) &&
    /v-if="item\.locked"[\s\S]{0,600}Locked/.test(card),
)
check(
  'a locked card is also inert (belt and suspenders on top of the face-down render)',
  card.includes(':disabled="disabled || item.locked"'),
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll Storybook character gating checks passed.')
