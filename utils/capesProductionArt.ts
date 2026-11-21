/**
 * Private completed ArtImage receipts from Conductor's
 * UNSTABLE-PRODUCTION-FAMILY-ROUND-1.yaml. ArtJob acceptance and a DONE ledger
 * do not certify browser delivery or the final game attachment.
 * Preserve the three separate permanent identities and original image IDs.
 */
export const CAPES_PRODUCTION_IDENTITIES = [
  {
    signature: 'accident-earth',
    label: 'Cornerstone',
    subtitle: 'Tobias Brannigan',
  },
  {
    signature: 'accident-fire',
    label: 'Backdraft',
    subtitle: 'Fire and accountability',
  },
  { signature: 'tech-genius', label: 'Dr. Frog', subtitle: 'Dr. Lionel Marsh' },
  { signature: 'alien-discipline', label: 'Zuzu', subtitle: 'Koala Assassin' },
  {
    signature: 'mutant-earth',
    label: 'Groundswell',
    subtitle: 'Hattie Nkemelu',
  },
] as const

export const CAPES_UNSTABLE_PRODUCTION = [
  {
    key: 'cornerstone-villain-poster',
    signature: 'accident-earth',
    title: 'Cornerstone villain poster',
    asset: 'comet-city-academy/identities/accident-earth/poster-villain',
    size: '832x1216',
    artJobId: 50852,
    artImageId: 258005,
  },
  {
    key: 'cornerstone-hero-standee',
    signature: 'accident-earth',
    title: 'Cornerstone hero tactical standee',
    asset: 'comet-city-academy/identities/accident-earth/model-hero-2x1',
    size: '1536x768',
    artJobId: 50549,
    artImageId: 257792,
  },
  {
    key: 'cornerstone-villain-standee',
    signature: 'accident-earth',
    title: 'Cornerstone villain tactical standee',
    asset: 'comet-city-academy/identities/accident-earth/model-villain-2x1',
    size: '1536x768',
    artJobId: 50550,
    artImageId: 257793,
  },
  {
    key: 'cornerstone-resolve-portrait',
    signature: 'accident-earth',
    title: 'Cornerstone portrait: protective resolve',
    asset: 'comet-city-academy/identities/accident-earth/portrait-resolve',
    size: '896x1152',
    artJobId: 50853,
    artImageId: 258006,
  },
  {
    key: 'backdraft-hero-poster',
    signature: 'accident-fire',
    title: 'Backdraft hero poster',
    asset: 'comet-city-academy/identities/accident-fire/poster-hero',
    size: '832x1216',
    artJobId: 50854,
    artImageId: 258007,
  },
  {
    key: 'backdraft-hero-standee',
    signature: 'accident-fire',
    title: 'Backdraft hero tactical standee',
    asset: 'comet-city-academy/identities/accident-fire/model-hero-2x1',
    size: '1536x768',
    artJobId: 50855,
    artImageId: 258008,
  },
  {
    key: 'backdraft-villain-standee',
    signature: 'accident-fire',
    title: 'Backdraft villain tactical standee',
    asset: 'comet-city-academy/identities/accident-fire/model-villain-2x1',
    size: '1536x768',
    artJobId: 50856,
    artImageId: 258009,
  },
  {
    key: 'backdraft-doubt-portrait',
    signature: 'accident-fire',
    title: 'Backdraft portrait: moral doubt',
    asset: 'comet-city-academy/identities/accident-fire/portrait-doubt',
    size: '896x1152',
    artJobId: 50857,
    artImageId: 258010,
  },
  {
    key: 'frog-hero-poster',
    signature: 'tech-genius',
    title: 'Dr. Frog heroic human poster',
    asset: 'comet-city-academy/identities/tech-genius/poster-hero',
    size: '832x1216',
    artJobId: 50858,
    artImageId: 258011,
  },
  {
    key: 'frog-villain-poster',
    signature: 'tech-genius',
    title: 'Evil Dr. Frog transformed villain poster',
    asset: 'comet-city-academy/identities/tech-genius/poster-villain',
    size: '832x1216',
    artJobId: 50859,
    artImageId: 258012,
  },
  {
    key: 'frog-hero-standee',
    signature: 'tech-genius',
    title: 'Dr. Frog human hero tactical standee',
    asset: 'comet-city-academy/identities/tech-genius/model-hero-2x1',
    size: '1536x768',
    artJobId: 50551,
    artImageId: 257794,
  },
  {
    key: 'frog-villain-standee',
    signature: 'tech-genius',
    title: 'Evil Dr. Frog tactical standee',
    asset: 'comet-city-academy/identities/tech-genius/model-villain-2x1',
    size: '1536x768',
    artJobId: 50552,
    artImageId: 257795,
  },
  {
    key: 'frog-serum-story',
    signature: 'tech-genius',
    title: 'Dr. Frog story: irreversible experiment',
    asset: 'comet-city-academy/identities/tech-genius/story-transformation',
    size: '1344x768',
    artJobId: 50860,
    artImageId: 258013,
  },
  {
    key: 'frog-heel-portrait',
    signature: 'tech-genius',
    title: 'Evil Dr. Frog portrait: scientist regret',
    asset: 'comet-city-academy/identities/tech-genius/portrait-heel',
    size: '896x1152',
    artJobId: 50861,
    artImageId: 258014,
  },
] as const

/**
 * Canon-specific Krea 2 refills: their prompts describe the correct actors,
 * unlike nine visually rejected already-exported outcome paintings. These are
 * DONE ledger ArtImage receipts, NOT visually approved replacement media.
 * Review their actual private bytes before exporting to the canonical slots.
 */
export const CAPES_RUNTIME_REFILL_REVIEW = [
  {
    key: 'hattie-hero-canonical',
    signature: 'mutant-earth',
    title: 'Hattie Nkemelu / Groundswell hero',
    asset: 'comet-city-academy/identities/mutant-earth/hero',
    size: '1344x768',
    artJobId: 50734,
    artImageId: 258141,
  },
  {
    key: 'hattie-villain-canonical',
    signature: 'mutant-earth',
    title: 'Hattie Nkemelu / Groundswell villain',
    asset: 'comet-city-academy/identities/mutant-earth/villain',
    size: '1344x768',
    artJobId: 50735,
    artImageId: 258142,
  },
  {
    key: 'lionel-hero-canonical',
    signature: 'tech-genius',
    title: 'Dr. Lionel Marsh / Dr. Frog human hero',
    asset: 'comet-city-academy/identities/tech-genius/hero',
    size: '1344x768',
    artJobId: 50754,
    artImageId: 258161,
  },
  {
    key: 'lionel-villain-canonical',
    signature: 'tech-genius',
    title: 'Dr. Lionel Marsh / Dr. Frog transformed villain',
    asset: 'comet-city-academy/identities/tech-genius/villain',
    size: '1344x768',
    artJobId: 50755,
    artImageId: 258162,
  },
  {
    key: 'zuzu-hero-canonical',
    signature: 'alien-discipline',
    title: 'Zuzu Koala Assassin hero',
    asset: 'comet-city-academy/identities/alien-discipline/hero',
    size: '1344x768',
    artJobId: 50784,
    artImageId: 258191,
  },
  {
    key: 'zuzu-villain-canonical',
    signature: 'alien-discipline',
    title: 'Zuzu Koala Assassin villain',
    asset: 'comet-city-academy/identities/alien-discipline/villain',
    size: '1344x768',
    artJobId: 50785,
    artImageId: 258192,
  },
] as const

export const CAPES_REVIEWABLE_PRODUCTION = [
  ...CAPES_UNSTABLE_PRODUCTION,
  ...CAPES_RUNTIME_REFILL_REVIEW,
] as const

export function capesProductionFor(signature: string) {
  return CAPES_REVIEWABLE_PRODUCTION.filter(
    (entry) => entry.signature === signature,
  )
}
