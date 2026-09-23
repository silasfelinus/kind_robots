// /utils/scripts/verifyContentVisibilityCoverage.test.ts
//
// Regression coverage for the coverage SCANNER itself, not for one endpoint.
// art-archive/t-042 taught the real endpoint a capability check
// (verifyGalleryArchiveMedia) instead of a query filter, which meant naming
// that function in OBJECT_CHECKS so the scanner would recognize it. That is
// exactly the kind of change that can silently swallow the original bug the
// scanner exists to catch, if the added name were ever mentioned in a file
// with no real check behind it. So this pins both directions: a plain
// unguarded read must still fail, and a read that genuinely calls the
// capability check must pass -- against synthetic source, so it exercises
// the classifier without depending on any one real route file's shape.
import assert from 'node:assert/strict'

import { classifyVisibilityCoverage } from './verifyContentVisibilityCoverage'

// The original gap this scanner was written for: a read against a
// privacy-flagged model with no filter and no recognized check at all.
const unguardedRead = `
export default defineEventHandler(async (event) => {
  const row = await prisma.artImage.findFirst({
    where: { id: 1, isActive: true },
  })
  return row
})
`

assert.equal(
  classifyVisibilityCoverage(
    'server/api/art/image/fixture.get.ts',
    unguardedRead,
  ),
  'unguarded',
  'a read with no filter and no recognized check must still fail',
)

// The archive media route's actual shape: the check runs BEFORE the query,
// gating which where-clause even executes, rather than living inside the
// where clause the scanner reads.
const capabilityGuardedRead = `
export default defineEventHandler(async (event) => {
  const hasCapability = verifyGalleryArchiveMedia(id, variant, exp, sig)
  const artImage = await prisma.artImage.findFirst({
    where: { id, isActive: true, designer: 'art-archive' },
  })
  return artImage
})
`

assert.equal(
  classifyVisibilityCoverage(
    'server/api/art/image/fixture.get.ts',
    capabilityGuardedRead,
  ),
  'ok',
  'verifyGalleryArchiveMedia is a recognized capability check, not just an unrelated mention',
)

// Renaming the recognized check to something the scanner does not know about
// must go back to failing -- proves the pass above is about the specific
// name, not about the shape of the route.
const unrecognizedCapabilityName = capabilityGuardedRead.replace(
  /verifyGalleryArchiveMedia/g,
  'someOtherCapabilityCheck',
)

assert.equal(
  classifyVisibilityCoverage(
    'server/api/art/image/fixture.get.ts',
    unrecognizedCapabilityName,
  ),
  'unguarded',
  'an unrecognized check name must not silently pass',
)

console.log('verifyContentVisibilityCoverage.test: all assertions passed')
