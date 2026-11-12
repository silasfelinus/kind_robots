// MONSTRIQUE achievements: what an action newly earns in either edition, and
// that loading a save earns nothing (utils/monstressConvention/achievements.ts).
// Run from verifyMonstrexxMenu.test.ts, which Contract Tests already runs.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { actionForAudience } from '../monstressConvention/edition'
import {
  GENERAL_MAX_SCORE,
  MONSTRIQUE_ENDINGS,
  achievementsFor,
  generalCaseScore,
} from '../monstressConvention/achievements'
import {
  SCORE_TABLE,
  maxScore,
  newCase,
  type CaseState,
} from '../monstressConvention/prologue'

const catalog = new Set(
  achievementsForGame('monstress-convention').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'MONSTRIQUE carries 12 or more achievements.')
const known = (codes: string[]) => {
  for (const code of codes)
    assert.ok(catalog.has(code), `${code} is not in the catalog.`)
  return codes
}

const fresh = newCase(7)
const with_ = (change: Partial<CaseState>): CaseState => ({
  ...fresh,
  ...change,
})
assert.deepEqual(achievementsFor(fresh, fresh), [])

const flagCodes: Array<[string[], string[]]> = [
  [['odette-hired-us'], ['monstress-convention-dead-client']],
  [['double-murder-discovered'], ['monstress-convention-room-205']],
  [['fangs-returned'], ['monstress-convention-rental-fangs']],
  [['violet-paid'], ['monstress-convention-bill-squared']],
  [['billboard-shot'], ['monstress-convention-billboard']],
  [['odette-met', 'violet-met'], ['monstress-convention-both-witnesses']],
]
for (const [flags, codes] of flagCodes) {
  const next = with_({ flags })
  assert.deepEqual(known(achievementsFor(fresh, next)), codes, flags.join())
  assert.deepEqual(achievementsFor(next, next), [], 'never twice')
}
assert.deepEqual(achievementsFor(fresh, with_({ flags: ['odette-met'] })), [])
for (const [evidence, code] of [
  ['ice-timing', 'monstress-convention-ice-timing'],
  ['fan-exonerated', 'monstress-convention-not-the-fan'],
  ['knife-prop-mark', 'monstress-convention-prop-mark'],
  ['fangs-detail', 'monstress-convention-combiner'],
] as const)
  assert.deepEqual(
    known(achievementsFor(fresh, with_({ evidence: [evidence] }))),
    [code],
  )
assert.deepEqual(
  known(
    achievementsFor(
      fresh,
      with_({ asked: ['iris:marta:ledger', 'nico:marta:ledger'] }),
    ),
  ),
  ['monstress-convention-tag-team'],
)
assert.deepEqual(
  achievementsFor(fresh, with_({ asked: ['iris:marta:ledger'] })),
  [],
)
assert.deepEqual(
  known(achievementsFor(fresh, with_({ room: 'convention-center' }))),
  ['monstress-convention-convention'],
)

// The camera-and-fangs combination is reachable in the general edition.
const pockets = with_({ inventory: ['camera', 'plastic-fangs'] })
const combined = actionForAudience(
  pockets,
  { verb: 'combine', item: 'camera', target: 'plastic-fangs' },
  'general',
)
assert.equal(combined.changed, true)
assert.deepEqual(achievementsFor(pockets, combined.state), [
  'monstress-convention-combiner',
])

// Endings, the full file and both endings.
assert.deepEqual(known(achievementsFor(fresh, with_({ ending: 'reckless' }))), [
  'monstress-convention-ending-reckless',
])
const lead = with_({ ending: 'lead-earned' })
assert.deepEqual(achievementsFor(fresh, lead, 1), [
  'monstress-convention-ending-lead',
])
assert.deepEqual(achievementsFor(fresh, lead, MONSTRIQUE_ENDINGS.length), [
  'monstress-convention-ending-lead',
  'monstress-convention-both-endings',
])
assert.deepEqual(achievementsFor(lead, lead, MONSTRIQUE_ENDINGS.length), [])

assert.equal(GENERAL_MAX_SCORE, maxScore('general'))
const general = SCORE_TABLE.filter((row) => !row.mature).map((row) => row.key)
const perfect = with_({ flags: general, evidence: general })
assert.equal(generalCaseScore(perfect), GENERAL_MAX_SCORE)
assert.ok(
  achievementsFor(perfect, { ...perfect, ending: 'lead-earned' }).includes(
    'monstress-convention-full-file',
  ),
)
const almost = with_({ flags: general.slice(1), evidence: general.slice(1) })
assert.ok(
  !achievementsFor(almost, { ...almost, ending: 'lead-earned' }).includes(
    'monstress-convention-full-file',
  ),
)

// No achievement depends on mature-only content.
for (const entry of achievementsForGame('monstress-convention'))
  assert.doesNotMatch(
    entry.tooltip + entry.message,
    /kiss|flirt|romance|protection/i,
    `${entry.code} must be earnable in the general edition`,
  )

// Both stores award from commit() with the case before the action; neither
// awards while loading a save.
for (const path of [
  'stores/monstressConventionStore.ts',
  'stores/monstriquePublicStore.ts',
]) {
  const store = readFileSync(path, 'utf8')
  assert.match(store, /const prev = state\.value/, path)
  assert.match(store, /awardAchievements\(prev, (next|result\.state)\)/, path)
  assert.match(store, /achievementsFor\(prev, next, endingsSeen\)/, path)
  for (const loader of ['function load(', 'function loadMode(']) {
    const at = store.indexOf(loader)
    if (at < 0) continue
    const indent = store.slice(store.lastIndexOf('\n', at) + 1, at)
    const body = store.slice(at, store.indexOf('\n' + indent + '}\n', at))
    assert.ok(!body.includes('awardAchievements'), `${path} ${loader}`)
  }
}

console.log(
  `MONSTRIQUE achievements: ${catalog.size} achievements, all earnable in the general edition.`,
)
