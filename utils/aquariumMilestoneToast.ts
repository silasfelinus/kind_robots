// /utils/aquariumMilestoneToast.ts
//
// cthulhuquarium/t-053: the generic, art-agnostic toast text for a bestiary
// milestone (server/utils/aquariumEconomy.ts's BESTIARY_MILESTONES, fired by
// t-028's firedBestiaryMilestones()). A full authored Charlotte interstitial
// with background art is explicitly out of scope here -- see t-028's own
// roadmap note -- this is only the placeholder wording for the mechanical
// gate: "5 species collected -- +2 tank slots".
//
// cthulhuquarium/t-074 extended this to the two landmark milestones
// (first_full_tank, first_spotless_tank) that fire at most once ever rather
// than at a repeatable count threshold -- they carry an `id` but no
// `threshold`, so they get their own fixed wording instead of the
// "N species collected" template below.
//
// Deliberately framework-free (no pinia, no fetch, no Vue) so both
// stores/cthulhuquariumTankStore.ts and a plain `tsx` guard can use it, same
// discipline as utils/artJobRetryNotice.ts.

export type AquariumMilestoneToastInput = {
  id: string
  threshold?: number
  slotsCapDelta: number
}

const LANDMARK_TOAST_TEXT: Record<string, string> = {
  first_full_tank: 'Every slot in your tank is full for the first time',
  first_spotless_tank: 'Your tank is spotless for the first time',
  // cthulhuquarium/t-077: fires once, the first time an active rivalry
  // (predator/prey, school/anchor, authored, or same-species pressure) has
  // resolved -- see aquariumRivalryMilestone.ts's rivalryMilestoneState.
  first_rivalry_resolved: 'A rivalry in your tank has settled for the first time',
}

export function formatMilestoneToastMessage(
  milestone: AquariumMilestoneToastInput,
): string {
  const landmarkText = LANDMARK_TOAST_TEXT[milestone.id]
  if (landmarkText) return landmarkText

  // Every real BESTIARY_MILESTONES threshold is >= 5, so "species" is
  // always plural in practice -- not special-cased against a singular
  // threshold that can't occur.
  const slots = Math.abs(milestone.slotsCapDelta) === 1 ? 'tank slot' : 'tank slots'
  const sign = milestone.slotsCapDelta >= 0 ? '+' : ''
  return `${milestone.threshold} species collected -- ${sign}${milestone.slotsCapDelta} ${slots}`
}
