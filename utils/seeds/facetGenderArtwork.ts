// /utils/seeds/facetGenderArtwork.ts
//
// The Adventure Builder has always referenced these dedicated Gender assets, but
// the files were never committed. Keep the intended paths and prompts explicit so
// Facets can remain art-required without persisting broken image URLs.

export type GenderArtworkTarget = {
  key: string
  label: string
  path: string
  usage: 'choice' | 'custom' | 'deck' | 'hero'
  prompt: string
}

export const GENDER_ARTWORK_TARGETS: GenderArtworkTarget[] = [
  {
    key: 'man',
    label: 'Masculine',
    path: '/images/adventure/gender/masculine.webp',
    usage: 'choice',
    prompt:
      'Expressive inclusive character-card illustration representing masculine identity without reducing it to one body type, age, culture, or costume.',
  },
  {
    key: 'woman',
    label: 'Feminine',
    path: '/images/adventure/gender/feminine.webp',
    usage: 'choice',
    prompt:
      'Expressive inclusive character-card illustration representing feminine identity without reducing it to one body type, age, culture, or costume.',
  },
  {
    key: 'nonbinary',
    label: 'Non-Binary',
    path: '/images/adventure/gender/nonbinary.webp',
    usage: 'choice',
    prompt:
      'Expressive inclusive character-card illustration representing non-binary identity, confident and specific, avoiding generic split-gender symbolism.',
  },
  {
    key: 'agender',
    label: 'Pronouns Are Paperwork',
    path: '/images/adventure/gender/neutral.webp',
    usage: 'choice',
    prompt:
      'Expressive character-card illustration of an entity whose identity is not organized around gender, warm and affirming rather than blank or clinical.',
  },
  {
    key: 'fluid',
    label: 'Gender Fluid',
    path: '/images/adventure/gender/fluid.webp',
    usage: 'choice',
    prompt:
      'Expressive character-card illustration representing gender fluidity as living contextual identity, dynamic and joyful without using a literal liquid person.',
  },
  {
    key: 'not-applicable',
    label: 'Does Not Apply',
    path: '/images/adventure/gender/agender.webp',
    usage: 'choice',
    prompt:
      'Expressive nonhuman character-card illustration for an entity to whom human gender architecture does not apply, specific and personable rather than anonymous.',
  },
  {
    key: 'custom',
    label: 'Write My Own',
    path: '/images/adventure/gender/custom.webp',
    usage: 'custom',
    prompt:
      'Celebratory character-card illustration about self-definition beyond preset labels, showing creative identity as an open possibility without written text.',
  },
  {
    key: 'gender-deck',
    label: 'Gender Builder Deck',
    path: '/images/adventure/thumb/gender.webp',
    usage: 'deck',
    prompt:
      'Readable illustrated thumbnail for a character-builder Gender category, inclusive ensemble or symbolic identity scene, bold silhouette, no text.',
  },
  {
    key: 'gender-hero',
    label: 'Gender Builder Hero',
    path: '/images/adventure/hero/gender.webp',
    usage: 'hero',
    prompt:
      'Wide hero illustration for a character-builder Gender category, diverse humans and nonhuman entities expressing identity with confidence, cohesive scene, no text.',
  },
]

export const GENDER_ARTWORK_PATHS = new Set(
  GENDER_ARTWORK_TARGETS.map((target) => target.path),
)
