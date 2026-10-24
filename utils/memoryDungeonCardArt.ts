/** Generated through the durable Conductor/Kind Robots ArtJob pipeline.
 * The browser keeps a styled fallback until each media URL is delivered.
 */
export const DEFAULT_BRIAR_CARD_BACK =
  '/images/memory-dungeon/card-backs/briar-default.webp'
export const ARCANE_BRIAR_CARD_BACK =
  '/images/memory-dungeon/card-backs/briar-arcane.webp'

export function hideMissingMemoryCardBack(event: Event): void {
  const image = event.target
  if (image instanceof HTMLImageElement) image.style.display = 'none'
}
