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

import {
  viewerShowsMature,
  visibilityWhere,
} from '../../server/utils/contentAccess'

async function main() {
  const adult = { id: 7, roles: ['USER'], showMature: true }
  const child = { id: 9, roles: ['CHILD'], showMature: true }
  const childAdmin = { id: 11, roles: ['CHILD', 'ADMIN'], showMature: true }
  // The case the whole rule turns on: an adult who has NOT opted in.
  const optedOut = { id: 13, roles: ['USER'], showMature: false }
  const adultAdminOptedOut = {
    id: 15,
    roles: ['USER', 'ADMIN'],
    showMature: false,
  }

  /*
   * THE MATURITY RULE, in one predicate. Silas, 2026-09-18: "if something is
   * mature but public, it should still only be seen by a logged in user that has
   * chosen mature true. there shouldn't be an option for this to bleed."
   */
  assert.equal(viewerShowsMature(adult), true)
  assert.equal(viewerShowsMature(optedOut), false)
  assert.equal(viewerShowsMature(child), false)
  assert.equal(viewerShowsMature(childAdmin), false)
  assert.equal(
    viewerShowsMature(null),
    false,
    'anonymous is never shown mature',
  )

  // The request parameter may only NARROW. It used to widen: getArtImageAccessContext
  // read `requestedMature || user.showMature`, so `?showMature=true` from an
  // opted-out adult served mature images. A preference a caller can override is
  // not a preference.
  assert.equal(
    viewerShowsMature(optedOut, true),
    false,
    'the parameter cannot widen',
  )
  assert.equal(viewerShowsMature(child, true), false)
  assert.equal(viewerShowsMature(adult, false), false, 'but it can narrow')
  assert.equal(
    viewerShowsMature(adult, undefined),
    true,
    'absent means: the account decides',
  )

  // An ordinary adult sees public rows and their own; mature is allowed.
  assert.deepEqual(await visibilityWhere(adult), {
    OR: [{ isPublic: true }, { userId: 7 }],
  })

  // A child sees public rows and their own, and never a mature one.
  assert.deepEqual(await visibilityWhere(child), {
    AND: [{ OR: [{ isPublic: true }, { userId: 9 }] }, { isMature: false }],
  })

  // Being an admin is not being an adult. A CHILD who also holds ADMIN keeps the
  // maturity restriction -- the check reads the ROLE, not the privilege, and not
  // the showMature preference a child could set for themselves.
  assert.deepEqual(
    await visibilityWhere(childAdmin, { isPublic: true, isMature: true }, true),
    { isMature: false },
  )

  // An adult admin who opted in sees everything: moderation has to be able to see
  // what it moderates. Crossing someone's PRIVACY choice is a deliberate act in
  // the UI; maturity is not a privacy choice and admin is not an exemption from it.
  assert.deepEqual(
    await visibilityWhere(adult, { isPublic: true, isMature: true }, true),
    {},
  )

  // ...but an admin who has NOT opted in still gets no mature rows. Privilege is
  // not preference: the admin bypass that used to sit here meant turning the
  // toggle off did nothing for the one account most likely to have it off.
  assert.deepEqual(
    await visibilityWhere(
      adultAdminOptedOut,
      { isPublic: true, isMature: true },
      true,
    ),
    // Other people's mature rows are gone; their own arrive to be covered.
    { OR: [{ isMature: false }, { userId: 15 }] },
  )

  /*
   * An adult with the toggle OFF loses OTHER people's mature rows and KEEPS
   * their own, which the card covers. Silas, 2026-09-18: "it's more likely that
   * I want them hidden for situational propriety, not gone for good."
   */
  assert.deepEqual(await visibilityWhere(optedOut), {
    AND: [
      { OR: [{ isPublic: true }, { userId: 13 }] },
      { OR: [{ isMature: false }, { userId: 13 }] },
    ],
  })

  // And a per-request ask does not change that.
  assert.deepEqual(
    await visibilityWhere(
      optedOut,
      { isPublic: true, isMature: true },
      false,
      true,
    ),
    {
      AND: [
        { OR: [{ isPublic: true }, { userId: 13 }] },
        { OR: [{ isMature: false }, { userId: 13 }] },
      ],
    },
  )

  /*
   * THE CARVE-OUT IS THE PREFERENCE ONLY. A CHILD keeps the hard barrier even
   * on their own rows: a child should not have mature content, and if some
   * exists, hiding it is the protective direction rather than the polite one.
   */
  assert.deepEqual(await visibilityWhere(child), {
    AND: [{ OR: [{ isPublic: true }, { userId: 9 }] }, { isMature: false }],
  })

  // Anonymous: public and non-mature only. No user means no stored opt-in, which
  // is the safe direction for a missing user -- and matches "showMature should
  // only be an option for logged in users".
  assert.deepEqual(await visibilityWhere(null), {
    AND: [{ isPublic: true }, { isMature: false }],
  })

  // A model with no isPublic column (Challenge, DirectMessage) still gets the
  // maturity half.
  assert.deepEqual(await visibilityWhere(child, { isMature: true }), {
    isMature: false,
  })
  assert.deepEqual(await visibilityWhere(adult, { isMature: true }), {})

  /*
   * Pack-gated and grant-gated content must NOT be filtered out.
   *
   * canView() -- the site's existing per-object rule, used by 14 endpoints -- is
   * richer than "public or mine": it also honours Grants (PROJECT/RESOURCE) and
   * Packs (Reward, Character, Dream and Facet carry packId). A fragment that
   * ignored those would hide content someone has been GIVEN access to, which is
   * the opposite failure and just as wrong. Found by sweeping the whole surface
   * rather than by reading the first endpoint.
   *
   * Asserted anonymously so this stays a pure check: a signed-out viewer has no
   * grants to look up, so no database is touched. The grant path itself is
   * exercised by the endpoints that use it.
   */
  assert.deepEqual(
    await visibilityWhere(null, {
      isPublic: true,
      isMature: true,
      packGated: true,
    }),
    { AND: [{ isPublic: true }, { isMature: false }] },
  )

  // A model whose owner column is not `userId`.
  assert.deepEqual(
    await visibilityWhere(adult, { isPublic: true, ownerField: 'creatorId' }),
    {
      OR: [{ isPublic: true }, { creatorId: 7 }],
    },
  )

  console.log('verifyContentVisibility: all assertions passed')
}

main()
