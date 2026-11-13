import { roomArtUrl } from './rooms'

/**
 * Only list chance plates after their final public WebP is exported and
 * verified. A completed ArtJob is not proof of a publicly served image.
 */
export const EXPORTED_CHANCE_PLATES: readonly string[] = []
const exported = new Set(EXPORTED_CHANCE_PLATES)

/**
 * Stable painted scene candidates for the shared choice hand.
 * Dedicated plates take precedence; otherwise use existing exported room art.
 */
export function chanceArtCandidates(
  eventId: string,
  choiceIndex: number,
): string[] {
  const commission = exported.has(eventId)
    ? `/emperor-of-dust/chance/${eventId}.webp`
    : undefined
  const rooms = ['throne', 'market', 'barracks', 'map', 'quest'] as const
  const fallback = roomArtUrl(rooms[choiceIndex % rooms.length]!)
  return [commission, fallback, '/emperor-of-dust/map/wasteland.webp'].filter(
    (url): url is string => Boolean(url),
  )
}
