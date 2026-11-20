/**
 * Painted plates for hand-written dungeons (2026-11-20 PT, conductor
 * memory-dungeon/t-076). One establishing plate per room and one outcome
 * plate per choice, served from the media host. Screens try the plate and
 * keep their drawn fallback when it has not been delivered yet.
 */
const ROOT = '/images/memory-dungeon/dungeons'

export function dungeonRoomArtPath(prefix: string, roomId: string): string {
  return `${ROOT}/${prefix.toLowerCase()}/${roomId.toLowerCase()}.webp`
}

export function dungeonChoiceArtPath(
  prefix: string,
  roomId: string,
  choiceId: string,
): string {
  return `${ROOT}/${prefix.toLowerCase()}/${roomId.toLowerCase()}-${choiceId}.webp`
}

/** The plate for one of the 32 campaign endings. */
export function coreEndingArtPath(id: number): string {
  return `/images/memory-dungeon/endings/core-${String(id + 1).padStart(2, '0')}.webp`
}
