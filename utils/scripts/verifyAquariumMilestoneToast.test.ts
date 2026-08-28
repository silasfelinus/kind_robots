// /utils/scripts/verifyAquariumMilestoneToast.test.ts
//
// Regression test for cthulhuquarium/t-053's generic milestone-toast
// wording (utils/aquariumMilestoneToast.ts). No prisma, no Nuxt/H3 runtime
// -- same discipline as verifyAquariumEconomy.test.ts and
// verifyVideoRetryNotice.test.ts.
import assert from 'node:assert/strict'

import { formatMilestoneToastMessage } from '../aquariumMilestoneToast.js'

// The four real BESTIARY_MILESTONES entries (server/utils/aquariumEconomy.ts)
// -- each crosses at a different threshold but grants the same +2 slots.
assert.equal(
  formatMilestoneToastMessage({ threshold: 5, slotsCapDelta: 2 }),
  '5 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ threshold: 10, slotsCapDelta: 2 }),
  '10 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ threshold: 15, slotsCapDelta: 2 }),
  '15 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ threshold: 20, slotsCapDelta: 2 }),
  '20 species collected -- +2 tank slots',
)

// Singular slot wording, in case a future milestone config ever grants
// exactly one slot -- proves the plural isn't hardcoded.
assert.equal(
  formatMilestoneToastMessage({ threshold: 8, slotsCapDelta: 1 }),
  '8 species collected -- +1 tank slot',
)

console.log(
  '✅ formatMilestoneToastMessage: correct wording across every real BESTIARY_MILESTONES entry plus a singular-slot edge case',
)
