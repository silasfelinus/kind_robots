/**
 * First-world photographs are fixed Earth-side evidence, not tradable loot.
 * The two dated moments are sorted in Morrow's chronology irrespective of
 * map discovery order. Later worlds append evidence with later sequence IDs.
 */
export const BRIAR_EARTH_PHOTOS = [
  {
    key: '2,5',
    order: 1,
    title: 'The Dismissal',
    caption:
      'Morrow, wearing your face, leaves the research office carrying a box. Your old career is already gone.',
    artPath: '/images/memory-dungeon/earth-photographs/dismissal.webp',
  },
  {
    key: '8,6',
    order: 2,
    title: 'The Gathering',
    caption:
      'Someone you recognize is hurt at a gathering. The image records an injury, not its full explanation.',
    artPath: '/images/memory-dungeon/earth-photographs/gathering.webp',
  },
] as const

export function firstWorldPhotoChronicle(
  sceneChoices: Readonly<Record<string, string>>,
) {
  return BRIAR_EARTH_PHOTOS.filter((photo) =>
    Boolean(sceneChoices[photo.key]),
  ).sort((a, b) => a.order - b.order)
}
