// /utils/scripts/verifyContentVisibility.test.ts
//
// The site-wide visibility rule, as stated by Silas 2026-09-17:
//
//   "a mature object should not even look like it exists for children
//    accounts, so that things like text should not be viewable either"
//   "a private object should not show up AT ALL for non-admin non-owners.
//    they don't exist"
//   "this should be an api barrier, not a front end barrier"
//
// 23 models carry isMature/isPublic and the guard was applied ad hoc, so these
// assertions pin the shared fragment every listing is meant to use.
import assert from 'node:assert/strict'

import { visibilityWhere } from '../../server/utils/contentAccess'

const adult = { id: 7, roles: ['USER'], showMature: true }
const child = { id: 9, roles: ['CHILD'], showMature: true }
const childAdmin = { id: 11, roles: ['CHILD', 'ADMIN'], showMature: true }

// An ordinary adult sees public rows and their own; mature is allowed.
assert.deepEqual(visibilityWhere(adult), { OR: [{ isPublic: true }, { userId: 7 }] })

// A child sees public rows and their own, and never a mature one.
assert.deepEqual(visibilityWhere(child), {
  AND: [{ OR: [{ isPublic: true }, { userId: 9 }] }, { isMature: false }],
})

// Being an admin is not being an adult. A CHILD who also holds ADMIN keeps the
// maturity restriction -- the check reads the ROLE, not the privilege, and not
// the showMature preference a child could set for themselves.
assert.deepEqual(
  visibilityWhere(childAdmin, { isPublic: true, isMature: true }, true),
  { isMature: false },
)

// An adult admin sees everything: moderation has to be able to see what it
// moderates. Crossing someone's privacy choice is a deliberate act in the UI.
assert.deepEqual(visibilityWhere(adult, { isPublic: true, isMature: true }, true), {})

// Anonymous: public and non-mature only. `isMaturityRestricted(null)` is true,
// which is the safe direction for a missing user.
assert.deepEqual(visibilityWhere(null), {
  AND: [{ isPublic: true }, { isMature: false }],
})

// A model with no isPublic column (Challenge, DirectMessage) still gets the
// maturity half.
assert.deepEqual(visibilityWhere(child, { isMature: true }), { isMature: false })
assert.deepEqual(visibilityWhere(adult, { isMature: true }), {})

// A model whose owner column is not `userId`.
assert.deepEqual(visibilityWhere(adult, { isPublic: true, ownerField: 'creatorId' }), {
  OR: [{ isPublic: true }, { creatorId: 7 }],
})

console.log('verifyContentVisibility: all assertions passed')
