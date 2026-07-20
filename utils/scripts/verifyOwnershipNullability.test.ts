// /utils/scripts/verifyOwnershipNullability.test.ts
//
// Regression test for the Character.userId nullability class of bug
// (conductor/t-069, kind_robots PR #575): a helper that compares a patch
// body's requested owner id against an *existing* record's owner id must
// accept `existing<X>Id: number | null`, because the corresponding Prisma
// scalar (`Character.userId`, `Resource.userId`, ...) is `Int?` in
// prisma/schema.prisma -- a legacy/orphaned row can have no owner at all.
// Typing the parameter as bare `number` type-checks fine locally (the two
// call sites here always narrow before calling) and only breaks once
// vue-tsc runs against the real generated Prisma types, so this exercises
// the real exported functions -- not a reimplementation -- against the
// `existingUserId: null` case directly, offline and DB-free.
//
// conductor/t-072: confirmed via `grep -rn "existing[A-Za-z]*Id"
// server/api` that these two call sites (characters, resources) are the
// only "existing<owner>Id" ownership-reassignment guards in the codebase
// today, and both are already correctly typed `number | null`. Per
// kind-robots/t-033's discipline (heuristic pattern checks stay narrow
// until a second concrete instance justifies broadening), no third
// call site exists yet to add here -- this file's job is to make sure the
// two that do exist can never silently regress back to a bare `number`.
//
// characters/compatibility.ts re-exports its `CharacterMutationInput` type
// from characters/mutation.ts, which (as a value import, not type-only)
// pulls in server/utils/prisma.ts at module load -- and that throws
// synchronously if DATABASE_URL is unset. No prisma query ever actually
// runs here (PrismaClient connects lazily), so a syntactically valid dummy
// value is enough; set one before dynamically importing so this stays a
// true DB-free contract even when CI hasn't set DATABASE_URL itself.
import assert from 'node:assert/strict'

process.env.DATABASE_URL ??= 'mysql://user:pass@127.0.0.1:3306/kindrobots'

const { assertCharacterCreateCompatibility, assertCharacterPatchCompatibility } =
  await import('../../server/api/characters/compatibility.js')
const { assertOwnershipIsUnchanged } = await import(
  '../../server/api/resources/compatibility.js'
)

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

// -- Character.userId (Int? in prisma/schema.prisma) --------------------

check(
  'assertCharacterPatchCompatibility accepts existingUserId: null when the patch does not touch userId',
  () => {
    assertCharacterPatchCompatibility({ name: 'Renamed' }, 42, null)
  },
)

check(
  'assertCharacterPatchCompatibility rejects any userId in the patch when existingUserId is null',
  () => {
    assert.throws(() => {
      assertCharacterPatchCompatibility({ userId: 7 }, 42, null)
    }, /ownership reassignment/)
  },
)

check(
  'assertCharacterPatchCompatibility accepts a userId in the patch that matches a non-null existingUserId',
  () => {
    assertCharacterPatchCompatibility({ userId: 7 }, 42, 7)
  },
)

check(
  'assertCharacterCreateCompatibility still requires a positive userId on create (unaffected by the patch-side nullability fix)',
  () => {
    assert.throws(() => {
      assertCharacterCreateCompatibility({ userId: 0 })
    }, /must be positive/)
  },
)

// -- Resource.userId (Int? in prisma/schema.prisma) ----------------------

check(
  'assertOwnershipIsUnchanged is a no-op when the patch does not touch userId, even with existingUserId: null',
  () => {
    assertOwnershipIsUnchanged({ title: 'Renamed' }, null)
  },
)

check(
  'assertOwnershipIsUnchanged rejects any userId in the patch when existingUserId is null',
  () => {
    assert.throws(() => {
      assertOwnershipIsUnchanged({ userId: 7 }, null)
    }, /ownership reassignment/)
  },
)

check(
  'assertOwnershipIsUnchanged accepts a userId in the patch that matches a non-null existingUserId',
  () => {
    assertOwnershipIsUnchanged({ userId: 7 }, 7)
  },
)

if (failures > 0) {
  console.error(
    `\nOwnership nullability contract failed: ${failures} case(s) did not behave as expected.`,
  )
  process.exitCode = 1
} else {
  console.log('\nOwnership nullability contract passed: all cases behaved as expected.')
}
