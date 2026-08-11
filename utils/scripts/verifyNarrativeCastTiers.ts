// /utils/scripts/verifyNarrativeCastTiers.ts
//
// Kaizen from t-011 (kind_robots PR #1727): narrative-role-assigner.vue
// groups cast members into three board tiers purely from their assigned
// role -- protagonist/antagonist into the lead row (facing each other),
// love-interest/mentor/foil/ally/wildcard into the supporting row, and
// ensemble/unassigned into the back row -- but nothing asserted that
// grouping in CI. eslint/vue-tsc/verifyNarrativeRoles.ts all passed without
// ever checking tier placement, so a future edit could silently move a role
// to the wrong tier, or collapse the branching entirely back to one flat
// grid, and nothing would fail.
//
// The grouping logic now lives in narrativeCastTier() (utils/narrativeRoles),
// extracted from the component so it is a pure function CI can feed a
// synthetic member of every role through -- rather than only reachable by
// mounting the component. Narrow by design, same spirit as
// verifyStorybookObjectEntryLinks.mjs: this asserts the grouping itself, not
// button markup, CSS classes, or layout.
//
//   npx tsx utils/scripts/verifyNarrativeCastTiers.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NARRATIVE_ROLE_KEYS, narrativeCastTier } from '../narrativeRoles'

const root = process.cwd()
let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

const read = (path: string): string => readFileSync(resolve(root, path), 'utf8')

/* --- the lead row: protagonist and antagonist, and only those two -------- */

check(
  narrativeCastTier('protagonist') === 'protagonist',
  'a protagonist lands in the protagonist tier',
)
check(
  narrativeCastTier('antagonist') === 'antagonist',
  'an antagonist lands in the antagonist tier',
)

/* --- the supporting row: every other real, non-ensemble role ------------- */

const supportingRoles = NARRATIVE_ROLE_KEYS.filter(
  (key) => key !== 'protagonist' && key !== 'antagonist' && key !== 'ensemble',
)
check(
  supportingRoles.length > 0,
  'there is at least one supporting role to check (vocabulary is not empty)',
)
for (const key of supportingRoles) {
  check(
    narrativeCastTier(key) === 'support',
    `'${key}' lands in the supporting tier, not lead or back`,
  )
}

/* --- the back row: ensemble and unassigned -------------------------------- */

check(
  narrativeCastTier('ensemble') === 'back',
  'ensemble lands in the back tier',
)
check(
  narrativeCastTier(null) === 'back',
  'an unassigned member (null) lands in the back tier',
)
check(
  narrativeCastTier(undefined) === 'back',
  'an unassigned member (undefined) lands in the back tier',
)

/* --- untrusted input: a stale/unknown role key should not vanish --------- */

check(
  narrativeCastTier('villain') === 'support',
  'an unknown/stale role key degrades to the supporting tier rather than ' +
    'throwing or silently dropping the member off the board entirely',
)

/* --- the wiring: the component must actually call this, not re-inline it - */
/*
 * A CALL, not a mention. Asserting only that the file imports
 * narrativeCastTier would pass even if a future edit re-inlined the old
 * ad hoc role === 'protagonist' / role !== ... conditionals and left the
 * import dangling unused.
 */
const component = read('components/narrative/narrative-role-assigner.vue')
const calls = component.match(/narrativeCastTier\(/g) ?? []
check(
  calls.length >= 4,
  'the casting board calls narrativeCastTier() for each of its four tier ' +
    'computeds (protagonists/antagonists/supportingCast/backCast), not an ' +
    'inlined copy of the grouping logic',
)
check(
  !/roleFor\(member\.slug\)\s*===\s*'protagonist'/.test(component) &&
    !/roleFor\(member\.slug\)\s*===\s*'antagonist'/.test(component),
  'the tier computeds no longer branch on role keys directly -- the shared ' +
    'function is the single source of truth for tier placement',
)

if (failures) {
  console.error(
    `\nNarrative cast tiers contract failed with ${failures} error(s).`,
  )
  process.exitCode = 1
} else {
  console.log(
    '\nNarrative cast tiers contract passed: every role lands on the ' +
      'casting board in its expected tier, and the board gets that ' +
      'placement from the shared function rather than an inlined copy.',
  )
}
