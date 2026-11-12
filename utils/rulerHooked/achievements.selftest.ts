// The Ruler Is Hooked site achievements: awarded at the deed, never on load
// (ruler-hooked t-068). Run: npx tsx utils/rulerHooked/achievements.selftest.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  RULER_HOOKED_ARC_CODES,
  RULER_HOOKED_ENDING_CODES,
  RULER_HOOKED_FLUENT,
  RULER_HOOKED_NATURALIST,
  RULER_HOOKED_SCHOLAR,
  rulerHookedCatchDeeds,
  rulerHookedChoiceDeeds,
  rulerHookedEndingDeeds,
  rulerHookedQuizDeeds,
} from './achievements'
import { cloneSave } from './applyEffects'
import { RULER_HOOKED_CONTENT } from './content'
import { RULER_HOOKED_FISH } from './fish'
import { createRun } from './newGame'
import type { CatchResult, RunSave } from '~/types/ruler-hooked'

const base = createRun(RULER_HOOKED_CONTENT, {
  saveId: 'ach-test',
  name: 'Test reign',
  seed: 'ach-test-seed',
  rulerName: 'Mo',
  honorific: 'Queen',
  stamp: '2026-11-12T00:00:00.000Z',
})

function withSpecies(save: RunSave, count: number): RunSave {
  const next = cloneSave(save)
  next.fishopedia = {}
  for (const fish of RULER_HOOKED_FISH.slice(0, count))
    next.fishopedia[fish.slug] = {
      countCaught: 1,
    } as RunSave['fishopedia'][string]
  return next
}

const fish = (patch: Partial<CatchResult>): CatchResult =>
  ({
    fishSlug: RULER_HOOKED_FISH[0]!.slug,
    name: 'Test fish',
    rarity: 'COMMON',
    quality: 'ORDINARY',
    ...patch,
  }) as CatchResult

// No catch, or a different reign swapped in, awards nothing.
assert.deepEqual(rulerHookedCatchDeeds(base, base, null), [])
assert.deepEqual(
  rulerHookedCatchDeeds(base, { ...base, saveId: 'other' }, fish({})),
  [],
)

const first = rulerHookedCatchDeeds(base, withSpecies(base, 1), fish({}))
assert.deepEqual(first, ['ruler-hooked-first-catch'])
assert.ok(
  rulerHookedCatchDeeds(base, base, fish({ rarity: 'LEGENDARY' })).includes(
    'ruler-hooked-legendary-catch',
  ),
)
assert.ok(
  rulerHookedCatchDeeds(base, base, fish({ rarity: 'MYTHIC' })).includes(
    'ruler-hooked-legendary-catch',
  ),
)
assert.ok(
  !rulerHookedCatchDeeds(base, base, fish({ rarity: 'EPIC' })).includes(
    'ruler-hooked-legendary-catch',
  ),
)
assert.ok(
  rulerHookedCatchDeeds(base, base, fish({ quality: 'TROPHY' })).includes(
    'ruler-hooked-trophy-catch',
  ),
)
assert.ok(
  rulerHookedCatchDeeds(
    withSpecies(base, RULER_HOOKED_NATURALIST - 1),
    withSpecies(base, RULER_HOOKED_NATURALIST),
    fish({}),
  ).includes('ruler-hooked-naturalist'),
)
const all = RULER_HOOKED_FISH.length
const complete = rulerHookedCatchDeeds(
  withSpecies(base, all - 1),
  withSpecies(base, all),
  fish({}),
)
assert.ok(complete.includes('ruler-hooked-fishopedia-complete'))
assert.ok(!complete.includes('ruler-hooked-naturalist'), 'already past half')

assert.deepEqual(rulerHookedChoiceDeeds(undefined), [])
assert.deepEqual(rulerHookedChoiceDeeds({ arc: { advance: 'elope-2' } }), [])
assert.deepEqual(
  rulerHookedChoiceDeeds({ arc: { complete: 'child-elopes' } }),
  ['ruler-hooked-arc-elope'],
)
assert.deepEqual(
  rulerHookedChoiceDeeds({ arc: { complete: 'castle-moat' } }),
  [],
)

for (const ending of RULER_HOOKED_CONTENT.endings)
  assert.equal(
    rulerHookedEndingDeeds(ending.outcomeKey).length,
    1,
    `${ending.outcomeKey} has an achievement`,
  )
assert.deepEqual(rulerHookedEndingDeeds('nope'), [])

assert.deepEqual(rulerHookedQuizDeeds('flags', RULER_HOOKED_SCHOLAR - 1), [])
assert.deepEqual(rulerHookedQuizDeeds('flags', RULER_HOOKED_SCHOLAR), [
  'ruler-hooked-scholar',
])
assert.ok(
  !rulerHookedQuizDeeds('capitals', RULER_HOOKED_FLUENT).includes(
    'ruler-hooked-fluent',
  ),
)
assert.ok(
  rulerHookedQuizDeeds('mandarin', RULER_HOOKED_FLUENT).includes(
    'ruler-hooked-fluent',
  ),
)

// Every arc the helper names exists and completes in the content.
const arcIds = new Set(RULER_HOOKED_CONTENT.arcs.map((arc) => arc.id))
for (const arcId of Object.keys(RULER_HOOKED_ARC_CODES)) {
  assert.ok(arcIds.has(arcId), `${arcId} is an arc`)
  assert.ok(
    JSON.stringify(RULER_HOOKED_CONTENT.arcs).includes(`"complete":"${arcId}"`),
    `${arcId} can complete`,
  )
}

// Every catalog code is awarded from source, and only at the deed.
const sources = [
  'utils/rulerHooked/achievements.ts',
  'stores/rulerHookedStore.ts',
  'stores/rulerHookedQuizStore.ts',
].map((path) => readFileSync(path, 'utf8'))
const awarded = new Set(
  [...sources.join('\n').matchAll(/'(ruler-hooked-[a-z0-9-]+)'/g)].map(
    (m) => m[1]!,
  ),
)
const catalog = new Set(achievementsForGame('ruler-hooked').map((e) => e.code))
assert.ok(catalog.size >= 12)
for (const code of catalog) assert.ok(awarded.has(code), `${code} is awarded`)
for (const code of Object.values({
  ...RULER_HOOKED_ARC_CODES,
  ...RULER_HOOKED_ENDING_CODES,
}))
  assert.ok(catalog.has(code), `${code} is cataloged`)
const store = sources[1]!
const body = (name: string) => {
  const start = store.indexOf(`function ${name}(`)
  return store.slice(start, store.indexOf('\n  }\n', start))
}
for (const restore of ['init', 'loadSlot'])
  assert.ok(!body(restore).includes('award('), `${restore} never awards`)
for (const deed of [
  'newGame',
  'advanceFishing',
  'choose',
  'acceptEnding',
  'declineEnding',
  'purchaseGear',
])
  assert.ok(body(deed).includes('award('), `${deed} awards`)

console.log(`Ruler Hooked achievements self-test passed: ${catalog.size}.`)
