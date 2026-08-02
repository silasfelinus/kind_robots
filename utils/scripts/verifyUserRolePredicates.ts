// /utils/scripts/verifyUserRolePredicates.ts
import {
  VALID_ROLES,
  parseRoleList,
  userHasRole,
  userIsAdmin,
  userRoles,
  withAdminFlag,
} from '../../server/utils/authUser'
import {
  hasUserRole,
  isUserAdmin,
  primaryUserRole,
  resolveUserRoles,
} from '../userRoles'
import type { User } from '../../prisma/generated/prisma/client'

// Behavioural contract for the multi-role predicates in server/utils/authUser.ts.
//
// Silas, 2026-08-01: "I can't make say, a Child and Admin, or Family an Admin."
// The whole point of the change is that a user's PRIMARY role no longer decides
// what they may do. These assertions pin the cases that make that true, and the
// ones where getting it wrong is a privilege bug rather than a cosmetic one:
//
//   - CHILD primary + ADMIN secondary must read as admin. This is the case the
//     49 migrated inline `user.Role === 'ADMIN'` comparisons all got wrong.
//   - An empty/absent `roles` must mean "not loaded", NOT "no roles". Callers
//     that resolve a user through validateApiKey or a narrow Prisma select get
//     no join table, and must still be judged correctly from the scalar column.
//     Treating absent as empty is how a missing `include` becomes a silent
//     demotion.
//   - Matching is case-insensitive, because the pre-existing call sites were
//     split between raw comparison, `.toUpperCase()`, and `.toLowerCase()`.

let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

/** A user carrying only the fields the predicates read. */
function asUser(fields: Record<string, unknown>): User & {
  roles?: string[]
  UserRoles?: { role: string }[]
} {
  return fields as unknown as User & {
    roles?: string[]
    UserRoles?: { role: string }[]
  }
}

// --- the headline case -------------------------------------------------------
check(
  userIsAdmin(asUser({ id: 42, Role: 'CHILD', roles: ['CHILD', 'ADMIN'] })),
  'a CHILD whose secondary role is ADMIN reads as admin',
)
check(
  userIsAdmin(asUser({ id: 42, Role: 'FAMILY', roles: ['FAMILY', 'ADMIN'] })),
  'a FAMILY account that is also ADMIN reads as admin',
)
check(
  userHasRole(asUser({ id: 42, Role: 'ADMIN', roles: ['ADMIN', 'CHILD'] }), 'CHILD'),
  'an ADMIN whose secondary role is CHILD still holds CHILD',
)

// --- negatives ---------------------------------------------------------------
check(
  !userIsAdmin(asUser({ id: 42, Role: 'USER', roles: ['USER'] })),
  'a plain USER does not read as admin',
)
check(
  !userIsAdmin(asUser({ id: 42, Role: 'CHILD', roles: ['CHILD', 'DESIGNER'] })),
  'holding some other secondary role does not confer admin',
)
check(
  !userHasRole(asUser({ id: 42, Role: 'USER', roles: ['USER'] }), 'FAMILY'),
  'a plain USER does not hold FAMILY',
)
check(
  !userHasRole(asUser({ id: 42, Role: 'USER' }), ''),
  'an empty role name matches nothing',
)

// --- absent vs empty ---------------------------------------------------------
check(
  userIsAdmin(asUser({ id: 42, Role: 'ADMIN' })),
  'an ADMIN resolved WITHOUT the join table still reads as admin (absent roles falls back to the scalar)',
)
check(
  userIsAdmin(asUser({ id: 42, Role: 'ADMIN', roles: [] })),
  'an empty roles array means not-loaded, not no-roles, so the scalar still decides',
)
check(
  !userIsAdmin(asUser({ id: 42, Role: 'USER', roles: [] })),
  'an empty roles array does not invent an admin',
)

// --- the bootstrap escape hatch ---------------------------------------------
check(
  userIsAdmin(asUser({ id: 1, Role: 'USER', roles: ['USER'] })),
  'user id 1 remains admin regardless of role (historical bootstrap account)',
)

// --- case insensitivity ------------------------------------------------------
check(
  userIsAdmin(asUser({ id: 42, Role: 'admin' })),
  'a lowercase primary role still matches',
)
check(
  userIsAdmin(asUser({ id: 42, Role: 'user', roles: ['Admin'] })),
  'a mixed-case secondary role still matches',
)

// --- the raw Prisma relation shape ------------------------------------------
check(
  userIsAdmin(asUser({ id: 42, Role: 'CHILD', UserRoles: [{ role: 'ADMIN' }] })),
  'a Prisma record loaded with `include: { UserRoles }` is accepted directly',
)
check(
  userRoles(asUser({ id: 42, Role: 'CHILD', UserRoles: [{ role: 'ADMIN' }] })).size === 2,
  'userRoles unions the join table with the primary column',
)

// --- withAdminFlag -----------------------------------------------------------
const flagged = withAdminFlag(asUser({ id: 42, Role: 'CHILD' }), [
  { role: 'CHILD' } as { role: User['Role'] },
  { role: 'ADMIN' } as { role: User['Role'] },
])
check(
  flagged.isAdmin && flagged.roles.length === 2,
  'withAdminFlag derives isAdmin from the join table and exposes the full set',
)
const unflagged = withAdminFlag(asUser({ id: 42, Role: 'USER' }), [])
check(
  !unflagged.isAdmin && unflagged.roles.length === 0,
  'withAdminFlag with no roles leaves a plain user unelevated',
)

// --- the client mirror (utils/userRoles.ts) --------------------------------
// Two implementations exist because the server one is typed against Prisma and
// accepts a raw `include: { UserRoles }` record. The SEMANTICS must not drift,
// so the same cases are asserted against both.
const MIRROR_CASES: [Record<string, unknown>, boolean][] = [
  [{ id: 42, Role: 'CHILD', roles: ['CHILD', 'ADMIN'] }, true],
  [{ id: 42, Role: 'FAMILY', roles: ['FAMILY', 'ADMIN'] }, true],
  [{ id: 42, Role: 'USER', roles: ['USER'] }, false],
  [{ id: 42, Role: 'ADMIN' }, true],
  [{ id: 42, Role: 'ADMIN', roles: [] }, true],
  [{ id: 42, Role: 'USER', roles: [] }, false],
  [{ id: 1, Role: 'USER', roles: ['USER'] }, true],
  [{ id: 42, Role: 'admin' }, true],
]
for (const [fields, expected] of MIRROR_CASES) {
  const server = userIsAdmin(asUser(fields))
  const client = isUserAdmin(fields)
  check(
    server === expected && client === expected,
    `client and server agree on isAdmin for ${JSON.stringify(fields)} (both ${expected})`,
  )
}
check(
  hasUserRole({ id: 42, Role: 'ADMIN', roles: ['ADMIN', 'CHILD'] }, 'CHILD'),
  'client hasUserRole finds a secondary role',
)
check(
  !isUserAdmin(null) && !hasUserRole(undefined, 'ADMIN'),
  'client predicates treat a missing user as unprivileged',
)
check(
  primaryUserRole({ id: 42, Role: 'child', roles: ['CHILD', 'ADMIN'] }) === 'CHILD',
  'client primaryUserRole returns the primary column, not the first of the set',
)
check(
  primaryUserRole(null) === 'USER',
  'client primaryUserRole defaults to USER',
)
check(
  resolveUserRoles({ id: 42, Role: 'CHILD', roles: ['ADMIN'] }).size === 2,
  'client resolveUserRoles unions the set with the primary column',
)

// --- parseRoleList (the admin write path) -----------------------------------
check(
  parseRoleList(['child', 'ADMIN']).join(',') === 'CHILD,ADMIN',
  'parseRoleList uppercases and preserves order, primary first',
)
check(
  parseRoleList(['ADMIN', 'ADMIN', 'CHILD']).length === 2,
  'parseRoleList deduplicates',
)
for (const [input, why] of [
  [['NOPE'], 'an unknown role'],
  [[], 'an empty list'],
  ['ADMIN', 'a bare string instead of an array'],
] as [unknown, string][]) {
  let threw = false
  try {
    parseRoleList(input)
  } catch {
    threw = true
  }
  check(threw, `parseRoleList rejects ${why}`)
}
check(
  VALID_ROLES.length === 9 && VALID_ROLES.includes('FAMILY'),
  'VALID_ROLES is the single shared list of assignable roles',
)

if (failures) {
  console.error(`\nUserRole predicate contract failed with ${failures} error(s).`)
  process.exitCode = 1
} else {
  console.log('\nUserRole predicate contract passed: all cases behaved as expected.')
}
