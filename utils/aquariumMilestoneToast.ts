// /utils/aquariumMilestoneToast.ts
//
// cthulhuquarium/t-053: the generic, art-agnostic toast text for a bestiary
// milestone (server/utils/aquariumEconomy.ts's BESTIARY_MILESTONES, fired by
// t-028's firedBestiaryMilestones()). A full authored Charlotte interstitial
// with background art is explicitly out of scope here -- see t-028's own
// roadmap note -- this is only the placeholder wording for the mechanical
// gate: "5 species collected -- +2 tank slots".
//
// Deliberately framework-free (no pinia, no fetch, no Vue) so both
// stores/cthulhuquariumTankStore.ts and a plain `tsx` guard can use it, same
// discipline as utils/artJobRetryNotice.ts.

export type AquariumMilestoneToastInput = {
  threshold: number
  slotsCapDelta: number
}

export function formatMilestoneToastMessage(
  milestone: AquariumMilestoneToastInput,
): string {
  // Every real BESTIARY_MILESTONES threshold is >= 5, so "species" is
  // always plural in practice -- not special-cased against a singular
  // threshold that can't occur.
  const slots = Math.abs(milestone.slotsCapDelta) === 1 ? 'tank slot' : 'tank slots'
  const sign = milestone.slotsCapDelta >= 0 ? '+' : ''
  return `${milestone.threshold} species collected -- ${sign}${milestone.slotsCapDelta} ${slots}`
}
