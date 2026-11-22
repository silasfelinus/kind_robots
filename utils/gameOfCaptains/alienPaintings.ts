// Populate only from verified DONE ArtJobs with actual ArtImage IDs.
// The 101 queued prompts are intentionally not treated as delivered images.
// CURATION-REDO-2 (Conductor, curated 2026-11-22 PT): the 14 hybrids whose
// earlier renders were ordinary Earth animals, each reviewed full-size and
// kept. These supersede the rejected ArtJob outputs for the same keys.
export const COUCH_ALIEN_ART_IDS: Readonly<Record<string, number>> = {
  'aliens/antimatter-minnow': 278518,
  'aliens/blackhole-alpaca': 278519,
  'aliens/cobra-seahorse': 278520,
  'aliens/cricket-otter': 278521,
  'aliens/crocodile-butterfly': 278522,
  'aliens/deadpan-peacock': 278523,
  'aliens/gravity-heron': 278524,
  'aliens/magnetosphere-newt': 278525,
  'aliens/moth-moose': 278526,
  'aliens/nine-mouthed-minnow': 278527,
  'aliens/pika-orca': 278528,
  'aliens/quasar-shrimp': 278529,
  'aliens/red-eclipse-calf': 278530,
  'aliens/swan-weevil': 278531,
}
