import { followerPortrait, illustration } from './castArt'
import { roomArtUrl } from './rooms'

const EXPRESSIONS = ['neutral', 'excited', 'sad', 'angry', 'happy'] as const

/**
 * Barracks replies need the same image-led choice cards as throne petitions.
 * Use physically shipped follower expressions and a painted barracks fallback;
 * this does not pretend unfinished dedicated talk plates were delivered.
 */
export function talkChoiceImages(followerId: string, cardIndex: number): string[] {
  const moods = EXPRESSIONS.map(
    (_, index) => EXPRESSIONS[(index + cardIndex) % EXPRESSIONS.length]!,
  )
  const candidates = [
    ...moods.map((mood) => illustration('followers', followerId, mood)),
    followerPortrait(followerId),
    roomArtUrl('barracks'),
    '/emperor-of-dust/map/wasteland.webp',
  ]
  return [
    ...new Set(candidates.filter((url): url is string => Boolean(url))),
  ]
}
