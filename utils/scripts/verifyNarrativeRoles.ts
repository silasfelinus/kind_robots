// /utils/scripts/verifyNarrativeRoles.ts
//
// Roles have to reach the narrator, or they are decoration.
//
// The feature is small and almost entirely a STRING: a cast member with a role
// produces a different line in the story bible, and that line is the only thing
// the model ever sees. So the failure mode is silent by construction -- the
// picker works, the draft persists, the story generates, and nothing anywhere
// says the protagonist was ignored. That is exactly the shape of bug this repo
// keeps paying for, so the assertion is on the rendered line rather than on the
// plumbing that produces it.
//
//   npx tsx utils/scripts/verifyNarrativeRoles.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  NARRATIVE_ROLES,
  castLineWithRole,
  duplicateSingularRoles,
  isNarrativeRoleKey,
  narrativeRole,
  narrativeRoleLabel,
} from '../narrativeRoles'

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

/* --- the vocabulary ------------------------------------------------------- */

check(NARRATIVE_ROLES.length > 0, 'there is a role vocabulary at all')

check(
  new Set(NARRATIVE_ROLES.map((role) => role.key)).size ===
    NARRATIVE_ROLES.length,
  'role keys are unique (they are persisted, so a collision is a data bug)',
)

check(
  NARRATIVE_ROLES.every((role) => role.promptDescriptor.trim().length > 20),
  'every role carries a promptDescriptor — a role the narrator is not told about does nothing',
)

check(
  NARRATIVE_ROLES.every((role) => /^[a-z][a-z-]*$/.test(role.key)),
  'role keys are lowercase kebab, so a stored value is stable across renames of the label',
)

// The three Silas named by hand, which are the ones a story usually needs.
for (const key of ['protagonist', 'antagonist', 'love-interest']) {
  check(isNarrativeRoleKey(key), `the vocabulary includes '${key}'`)
}

check(
  Boolean(narrativeRole('protagonist')?.singular),
  'protagonist is marked singular, so a second one warns',
)

/* --- untrusted input ------------------------------------------------------ */

check(
  !isNarrativeRoleKey('villain'),
  'an unknown key is rejected rather than passed through (drafts outlive renames)',
)
check(
  narrativeRole(null) === null && narrativeRole(undefined) === null,
  'a missing role resolves to null rather than throwing',
)
check(
  narrativeRoleLabel('nope') === 'Unassigned',
  'an unknown key labels as Unassigned rather than rendering the raw key',
)

/* --- the line the narrator actually reads --------------------------------- */

const AMI = 'Ami Butterfly — a cheerful chaos moth'

check(
  castLineWithRole(AMI, 'Ami Butterfly', null) === AMI,
  'an UNASSIGNED member produces exactly the line it always did — adding this feature changes nothing for stories that ignore it',
)

const lead = castLineWithRole(AMI, 'Ami Butterfly', 'protagonist')
check(
  lead.includes('[Protagonist]') && lead.includes('The story follows them'),
  'an assigned member carries both a visible label and the narrator instruction',
)
check(
  lead.startsWith(AMI),
  'the original description survives in front of the role, so nothing is lost by assigning one',
)
check(
  castLineWithRole(AMI, 'Ami Butterfly', 'villain') === AMI,
  'a STALE role key degrades to the unassigned line instead of emitting "[undefined]" into the prompt',
)

/* --- duplicates ----------------------------------------------------------- */

check(
  duplicateSingularRoles(['protagonist', 'protagonist', 'ally']).join() ===
    'protagonist',
  'two protagonists are reported',
)
check(
  duplicateSingularRoles(['ally', 'ally', 'ensemble', 'ensemble']).length === 0,
  'repeatable roles are NOT reported — two allies is a normal story',
)
check(
  duplicateSingularRoles([null, undefined, 'protagonist']).length === 0,
  'unassigned members do not count toward duplicates',
)

/* --- the wiring, asserted where it is easy to silently drop --------------- */

const store = read('stores/storybookStore.ts')
/*
 * A CALL, not a mention. The first version of this asserted
 * `store.includes('castLineWithRole')`, which the IMPORT LINE satisfies on its
 * own -- so deleting the actual call from the Cast block left the contract
 * green while roles silently stopped reaching the narrator. Caught by mutation,
 * which is the only reason it is written this way.
 */
check(
  /castLineWithRole\(/.test(store),
  'the story bible CALLS castLineWithRole (an import alone proves nothing)',
)
check(
  /member\.roleKey/.test(store),
  'the Cast block passes each member\u2019s role through — the call has to be given the role to matter',
)
check(
  /castRoles: Record<string, string>/.test(store),
  'the setup draft carries the role map',
)
check(
  store.includes('scenarioSlug') && store.includes('Plot thread'),
  'a Scenario reaches the bible as a framing plot thread',
)

const page = read('components/conductor/storybook-page.vue')
check(
  page.includes('NarrativeRoleAssigner'),
  'storybook mounts the role assigner (a vocabulary nothing renders is dead code)',
)
check(
  page.includes('isNarrativeRoleKey'),
  'storybook validates the persisted role before sending it, rather than casting',
)
check(
  /route\.query\.(facet|character|reward|scenario)/.test(page),
  'storybook seeds its draft from a deep link, so an object can start a story with itself in it',
)

/* --- the worked example --------------------------------------------------- */
/*
 * Silas's own: "we have scenario, say 'cthulhu for president', but they choose
 * genres: body horror, cosmic horror, and workplace romance, and a Character
 * ami-butterfly, so now we get a darker story about cthulhu's presidential run
 * with ami-butterfly as the main character."
 *
 * The part that was impossible before is the last clause. This asserts it.
 */
const cthulhu = [
  castLineWithRole(AMI, 'Ami Butterfly', 'protagonist'),
  castLineWithRole(
    'Cthulhu — sleeping god, presidential hopeful',
    'Cthulhu',
    'antagonist',
  ),
].join('\n')

check(
  /Ami Butterfly[\s\S]*protagonist[\s\S]*Cthulhu[\s\S]*antagonist/.test(
    cthulhu,
  ),
  'the worked example renders: Ami Butterfly leads, Cthulhu opposes, both stated to the narrator',
)

if (failures) {
  console.error(`\nNarrative roles contract failed with ${failures} error(s).`)
  process.exitCode = 1
} else {
  console.log(
    '\nNarrative roles contract passed: a part chosen in the picker reaches the story bible.',
  )
}
