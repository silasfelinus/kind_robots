// Minimal offline/catalog-failure fallbacks for generatorStore.
//
// These are not a second creative catalog. Runtime variety must come from Facets.
// Keep each pool intentionally tiny so missing catalog hydration is noticeable and
// cannot silently become another hand-maintained encyclopedia.
export const FACET_EMERGENCY_FALLBACKS = {
  genre: ['Fantasy', 'Science Fiction', 'Mystery'],
  species: ['Human', 'Robot', 'Goblin'],
  class: ['Rogue', 'Wizard', 'Accountant'],
  alignment: ['Chaotic Good', 'True Neutral', 'Appetite'],
  gender: ['nonbinary', 'woman', 'man'],
  personality: ['curious', 'inventive', 'kind'],
  quirks: [
    'Always carries a suspiciously useful spoon.',
    'Names every door before opening it.',
    'Keeps emergency glitter in a labeled envelope.',
  ],
  backstory: [
    'Exiled for asking the institution one practical question too many.',
    'Woke with someone else’s map and an unpaid cosmic parking ticket.',
    'Formerly respectable; now professionally adjacent to adventure.',
  ],
} as const

export type FacetEmergencyField = keyof typeof FACET_EMERGENCY_FALLBACKS
