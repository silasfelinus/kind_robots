import { TALK_ART } from './talkArt'

/**
 * Dedicated secret-talk plates (conductor projects/emperor-of-dust/art/
 * SECRET-STORY-SCENES-ROUND-1.yaml). TALK_ART lists the curated keepers that
 * physically ship at public/emperor-of-dust/talks/<entry>.webp. A talk's
 * notice plate sets the scene above its opening lines; choice-a and choice-b
 * illustrate the talk's first and second authored options. Talks without a
 * keeper fall back to follower portraits and the barracks room
 * (talkChoiceArt.ts).
 */
export type TalkPlate = 'notice' | 'choice-a' | 'choice-b'

const SHIPPED = new Set(TALK_ART)

/** URL of a talk's dedicated plate, only when that keeper physically ships. */
export function talkPlateUrl(
  talkId: string,
  plate: TalkPlate,
): string | undefined {
  const entry = `${talkId}/${plate}`
  return SHIPPED.has(entry) ? `/emperor-of-dust/talks/${entry}.webp` : undefined
}

/** The choice plate for an authored option position (0 → a, 1 → b). */
export function talkChoicePlateUrl(
  talkId: string,
  optionIndex: number,
): string | undefined {
  if (optionIndex === 0) return talkPlateUrl(talkId, 'choice-a')
  if (optionIndex === 1) return talkPlateUrl(talkId, 'choice-b')
  return undefined
}
