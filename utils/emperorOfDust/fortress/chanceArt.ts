import { emperorMediaArtUrl } from './artDelivery'
import { CHANCE_PLATES } from './deliveredPlates'
import { roomArtUrl } from './rooms'

/**
 * Only list chance plates after their final public WebP is exported and
 * verified. A completed ArtJob is not proof of a publicly served image.
 */
export const EXPORTED_CHANCE_PLATES: readonly string[] = []
const exported = new Set(EXPORTED_CHANCE_PLATES)
const plates = new Set(CHANCE_PLATES)

/**
 * A curated, physically shipped chance plate (deliveredPlates.ts, generated
 * from the conductor ledgers' keep verdicts): the event's `notice` scene or
 * one of its choices. Undefined when no keeper ships for that slot.
 */
export const chancePlateUrl = (
  eventId: string,
  slot: string,
): string | undefined =>
  plates.has(`${eventId}/${slot}`)
    ? `/emperor-of-dust/chance-events/${eventId}/${slot}.webp`
    : undefined

/**
 * Stable painted scene candidates for the shared choice hand.
 * Dedicated plates take precedence; otherwise use existing exported room art.
 */
export function chanceArtCandidates(
  eventId: string,
  choiceIndex: number,
  choiceId?: string,
): string[] {
  const commission = exported.has(eventId)
    ? `/emperor-of-dust/chance/${eventId}.webp`
    : undefined
  const rooms = ['throne', 'market', 'barracks', 'map', 'quests'] as const
  const fallback = roomArtUrl(rooms[choiceIndex % rooms.length]!)
  // Every approved plate is served directly from the durable media share.
  // The choice hand retries later candidates after a 404, so an undelivered
  // request cannot erase the pre-existing painted room fallback.
  const choiceMedia = choiceId
    ? emperorMediaArtUrl(`chance-events/${eventId}/${choiceId}`)
    : undefined
  const noticeMedia = emperorMediaArtUrl(`chance-events/${eventId}/notice`)
  return [
    commission,
    choiceId ? chancePlateUrl(eventId, choiceId) : undefined,
    chancePlateUrl(eventId, 'notice'),
    choiceMedia,
    noticeMedia,
    fallback,
    '/emperor-of-dust/map/wasteland.webp',
  ].filter((url): url is string => Boolean(url))
}
