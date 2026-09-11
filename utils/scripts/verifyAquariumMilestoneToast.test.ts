// /utils/scripts/verifyAquariumMilestoneToast.test.ts
//
// Regression test for cthulhuquarium/t-053's generic milestone-toast
// wording (utils/aquariumMilestoneToast.ts), extended by t-074 for the two
// landmark milestones. No prisma, no Nuxt/H3 runtime -- same discipline as
// verifyAquariumEconomy.test.ts and verifyVideoRetryNotice.test.ts.
import assert from 'node:assert/strict'

import { formatMilestoneToastMessage } from '../aquariumMilestoneToast.js'

// The four real BESTIARY_MILESTONES entries (server/utils/aquariumEconomy.ts)
// -- each crosses at a different threshold but grants the same +2 slots.
assert.equal(
  formatMilestoneToastMessage({ id: 'bestiary_5', threshold: 5, slotsCapDelta: 2 }),
  '5 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ id: 'bestiary_10', threshold: 10, slotsCapDelta: 2 }),
  '10 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ id: 'bestiary_15', threshold: 15, slotsCapDelta: 2 }),
  '15 species collected -- +2 tank slots',
)
assert.equal(
  formatMilestoneToastMessage({ id: 'bestiary_20', threshold: 20, slotsCapDelta: 2 }),
  '20 species collected -- +2 tank slots',
)

// Singular slot wording, in case a future milestone config ever grants
// exactly one slot -- proves the plural isn't hardcoded.
assert.equal(
  formatMilestoneToastMessage({ id: 'bestiary_8', threshold: 8, slotsCapDelta: 1 }),
  '8 species collected -- +1 tank slot',
)

// cthulhuquarium/t-074: the two landmark milestones get fixed wording, keyed
// off `id` alone -- no threshold needed, and slotsCapDelta: 0 never leaks
// into the text the way it would through the bestiary template above.
assert.equal(
  formatMilestoneToastMessage({ id: 'first_full_tank', slotsCapDelta: 0 }),
  'Every slot in your tank is full for the first time',
)
assert.equal(
  formatMilestoneToastMessage({ id: 'first_spotless_tank', slotsCapDelta: 0 }),
  'Your tank is spotless for the first time',
)

console.log(
  '✅ formatMilestoneToastMessage: correct wording across every real BESTIARY_MILESTONES entry, both landmark milestones, plus a singular-slot edge case',
)
