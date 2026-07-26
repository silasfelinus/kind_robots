// /utils/seeds/facetScenarioGenreArtwork.ts
//
// Scenario Genre choices are curated visual Facets. This manifest records every
// intended path and replacement prompt so missing repository media stays visible
// without being persisted as a broken Facet image URL.

export type ScenarioGenreArtworkTarget = {
  value: string
  label: string
  path: string
  prompt: string
}

export const SCENARIO_GENRE_ARTWORK_TARGETS: ScenarioGenreArtworkTarget[] = [
  {
    value: 'Gothic Comedy',
    label: 'Gothic Comedy',
    path: '/images/adventure/genre/gothic.webp',
    prompt:
      'Gothic comedy story-genre card, elegant decaying crypt interior with impeccable comedic timing, one specific visual joke, dramatic readable silhouette, no text.',
  },
  {
    value: 'Cozy Horror',
    label: 'Cozy Horror',
    path: '/images/adventure/genre/cozy.webp',
    prompt:
      'Cozy horror story-genre card, warm lamplit room and tea while one unsettling presence waits outside the window, inviting and ominous at once, no text.',
  },
  {
    value: 'Mythic Sci-Fi',
    label: 'Mythic Sci-Fi',
    path: '/images/adventure/genre/science-fiction.webp',
    prompt:
      'Mythic science-fiction story-genre card, ancient deity operating a monumental spacecraft with ritual technology, bold composition, no text.',
  },
  {
    value: 'Cosmic Dread',
    label: 'Cosmic Dread',
    path: '/images/adventure/genre/cosmic.webp',
    prompt:
      'Cosmic dread story-genre card, tiny figure beneath an impossible moon containing a visible door, immense scale and precise eerie detail, no text.',
  },
  {
    value: 'Fantasy',
    label: 'Classic Fantasy',
    path: '/images/adventure/genre/fantasy.webp',
    prompt:
      'Classic fantasy story-genre card, dragon perched on a castle calmly reading something important while adventure gathers below, colorful and specific, no text.',
  },
  {
    value: 'Mystery',
    label: 'Mystery',
    path: '/images/adventure/genre/mystery.webp',
    prompt:
      'Mystery story-genre card, investigator scene with magnifying lens aimed directly toward the viewer and one concealed clue in plain sight, no text.',
  },
  {
    value: 'Horror',
    label: 'Horror',
    path: '/images/adventure/genre/horror.webp',
    prompt:
      'Horror story-genre card, antique lantern emitting a reaching hand instead of light, focused unsettling scene, strong silhouette, no text.',
  },
  {
    value: 'Romance',
    label: 'Romance',
    path: '/images/adventure/genre/romance.webp',
    prompt:
      'Romance story-genre card, two distinct figures almost touching while both watch the same mysterious third thing, emotional tension and specificity, no text.',
  },
  {
    value: 'Comedy',
    label: 'Comedy',
    path: '/images/adventure/genre/comedy.webp',
    prompt:
      'Comedy story-genre card, energetic visual mishap with expressive motion and a clear punchline readable without captions, polished character animation style, no text.',
  },
  {
    value: 'Pastoral Apocalypse',
    label: 'Pastoral Apocalypse',
    path: '/images/adventure/genre/apocalypse.webp',
    prompt:
      'Pastoral apocalypse story-genre card, peaceful laundry line and occupied farmhouse beneath an impossible green end-of-world sky, tender and strange, no text.',
  },
  {
    value: 'Carnival',
    label: 'Carnival',
    path: '/images/adventure/genre/carnival.webp',
    prompt:
      'Carnival story-genre card, abandoned fairground still fully operating with a patient queue for nobody visible, colorful eerie atmosphere, no text.',
  },
  {
    value: 'Infinite Archive',
    label: 'Infinite Archive',
    path: '/images/scenarios/genre/infinite-archive.webp',
    prompt:
      'Infinite archive story-genre card, endless shelves folding through impossible architecture while an open book visibly reads its observer back, no text.',
  },
]

export const SCENARIO_GENRE_ARTWORK_PATHS = new Set(
  SCENARIO_GENRE_ARTWORK_TARGETS.map((target) => target.path),
)
