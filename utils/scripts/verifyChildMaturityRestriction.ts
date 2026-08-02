// /utils/scripts/verifyChildMaturityRestriction.ts
import {
  effectiveShowMature as clientEffectiveShowMature,
  isMaturityRestricted as clientIsMaturityRestricted,
} from '../userRoles'

// contentAccess also owns database-backed grant helpers, so importing it initializes
// the Prisma adapter even though this contract only exercises its pure maturity
// predicates. Give module initialization a syntactically valid, never-connected URL;
// production and database-backed workflows keep supplying their real URL.
process.env.DATABASE_URL ??= 'mysql://contract:contract@127.0.0.1:3306/contract'
const {
  effectiveShowMature,
  isMaturityRestricted,
} = await import('../../server/utils/contentAccess')

// The one behavioural change in the multi-role sequence, so it gets its own
// contract.
//
// RESTRICTIVE WINS. When two roles disagree, the restriction holds: a CHILD who
// is also an ADMIN is still barred from mature content. Admin grants
// capability; it does not lift a safety restriction. Without this rule the
// obvious way to give a family account admin powers -- exactly what Silas asked
// for on 2026-08-01 ("I can't make say, a Child and Admin") -- would silently
// unlock mature content for a child.
//
// Two properties matter and are easy to lose:
//
//   1. The CHILD marker is honoured from EVERY source. Every other predicate in
//      this system uses a role to GRANT something, so missing one source just
//      denies a grant. Here the role DENIES, so a missed marker fails OPEN.
//   2. A per-request `?showMature=true` cannot lift it. Several art routes OR
//      the query parameter with the stored preference, so a rule that only
//      gated the preference would be defeated by a query string.

let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

// --- the headline case -------------------------------------------------------
check(
  !effectiveShowMature({
    id: 42,
    Role: 'CHILD',
    roles: ['CHILD', 'ADMIN'],
    showMature: true,
  }),
  'a CHILD who is ALSO an ADMIN, with showMature explicitly true, is still denied',
)
check(
  isMaturityRestricted({ id: 42, Role: 'ADMIN', roles: ['ADMIN', 'CHILD'] }),
  'the restriction holds when CHILD is the SECONDARY role, not the primary',
)
check(
  !effectiveShowMature({ id: 1, Role: 'CHILD', showMature: true }),
  'even user id 1 -- the bootstrap admin escape hatch -- is restricted while CHILD',
)

// --- the marker is honoured from every source --------------------------------
const CHILD_SHAPES: [Record<string, unknown>, string][] = [
  [{ id: 42, Role: 'CHILD' }, 'the primary Role column'],
  [{ id: 42, Role: 'USER', roles: ['CHILD'] }, 'the roles array'],
  [
    { id: 42, Role: 'USER', UserRoles: [{ role: 'CHILD' }] },
    'a raw Prisma UserRoles include',
  ],
  [
    { id: 42, Role: 'USER', role: 'child' },
    'the lowercase `role` alias used by the art routes',
  ],
  [{ id: 42, Role: 'child' }, 'a lowercase primary role'],
]
for (const [shape, source] of CHILD_SHAPES) {
  check(
    isMaturityRestricted(shape) &&
      !effectiveShowMature({ ...shape, showMature: true }),
    `CHILD is detected via ${source} (a missed marker would fail OPEN)`,
  )
}

// --- non-children are unaffected --------------------------------------------
check(
  effectiveShowMature({ id: 42, Role: 'USER', showMature: true }),
  'an ordinary user who opted in still sees mature content',
)
check(
  effectiveShowMature({
    id: 42,
    Role: 'FAMILY',
    roles: ['FAMILY', 'ADMIN'],
    showMature: true,
  }),
  'FAMILY is not CHILD -- a family account that opted in is not restricted',
)
check(
  !effectiveShowMature({ id: 42, Role: 'USER', showMature: false }),
  'a user who did not opt in sees nothing mature',
)
check(
  !effectiveShowMature({ id: 42, Role: 'ADMIN' }),
  'an unset showMature is not an opt-in, even for an admin',
)
check(
  isMaturityRestricted(null) && !effectiveShowMature(undefined),
  'an anonymous viewer is restricted by default',
)

// --- the per-request opt-in cannot lift it -----------------------------------
// Mirrors what art/image/index.get.ts and art/image/[id].get.ts compute:
//   isAuthenticated && !isMaturityRestricted(user) && (requested || stored)
function routeShowMature(
  user: Parameters<typeof isMaturityRestricted>[0] & { showMature?: boolean },
  requestedMature: boolean,
): boolean {
  const isAuthenticated = true
  return (
    isAuthenticated &&
    !isMaturityRestricted(user) &&
    (requestedMature || user?.showMature === true)
  )
}

check(
  !routeShowMature(
    { id: 42, Role: 'CHILD', roles: ['CHILD', 'ADMIN'] },
    true,
  ),
  'a CHILD passing ?showMature=true is still denied (a restriction a query string can lift is not a restriction)',
)
check(
  routeShowMature({ id: 42, Role: 'USER' }, true),
  'an ordinary user can still opt in per request without a stored preference',
)

// --- client and server must not drift ---------------------------------------
const MIRROR: Record<string, unknown>[] = [
  { id: 42, Role: 'CHILD', roles: ['CHILD', 'ADMIN'], showMature: true },
  { id: 42, Role: 'ADMIN', roles: ['ADMIN', 'CHILD'], showMature: true },
  { id: 42, Role: 'USER', showMature: true },
  {
    id: 42,
    Role: 'FAMILY',
    roles: ['FAMILY', 'ADMIN'],
    showMature: true,
  },
  { id: 42, Role: 'USER', showMature: false },
  { id: 1, Role: 'CHILD', showMature: true },
]
for (const shape of MIRROR) {
  check(
    effectiveShowMature(shape) === clientEffectiveShowMature(shape) &&
      isMaturityRestricted(shape) === clientIsMaturityRestricted(shape),
    `client and server agree for ${JSON.stringify(shape)}`,
  )
}

if (failures) {
  console.error(
    `\nCHILD maturity restriction contract failed with ${failures} error(s).`,
  )
  process.exitCode = 1
} else {
  console.log(
    '\nCHILD maturity restriction contract passed: all cases behaved as expected.',
  )
}
