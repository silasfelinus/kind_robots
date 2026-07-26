// /utils/seeds/facetGenderValues.ts
//
// Deterministic migration coverage for Gender values that historically lived in
// generatorStore. Runtime selection must use the canonical Facet catalog.

export const legacyFacetGenderValues = [
  'man',
  'woman',
  'nonbinary',
  'agender',
  'fluid',
  'N/A — inapplicable to entity architecture',
  'two-spirit',
  'demi',
  'intersex',
  'questioning',
  'pangender',
  'genderqueer',
  'androgynous',
  'neutrois',
  'xenogender',
] as const
