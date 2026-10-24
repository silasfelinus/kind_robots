/** Briefs are tracked separately from delivered assets; image tags keep a
 * deterministic illustrated fallback until Comfy artwork is available.
 */
export const DEFAULT_BRIAR_CARD_BACK =
  '/images/memory-dungeon/card-backs/briar-default.webp'
export const ARCANE_BRIAR_CARD_BACK =
  '/images/memory-dungeon/card-backs/briar-arcane.webp'

export const MEMORY_CARD_BACKS = [
  {
    id: 'briar',
    name: 'Briar Crest',
    description: 'Antique gold thorns',
    path: DEFAULT_BRIAR_CARD_BACK,
  },
  {
    id: 'arcane',
    name: 'Moonlit Cipher',
    description: 'Silver twin sigils',
    path: ARCANE_BRIAR_CARD_BACK,
  },
] as const

export type MemoryCardBackId = (typeof MEMORY_CARD_BACKS)[number]['id']

export function normalizeMemoryCardBack(input: unknown): MemoryCardBackId {
  return input === 'arcane' ? 'arcane' : 'briar'
}

export function memoryCardBackPath(choice: MemoryCardBackId): string {
  return choice === 'arcane' ? ARCANE_BRIAR_CARD_BACK : DEFAULT_BRIAR_CARD_BACK
}

export function hideMissingMemoryCardBack(event: Event): void {
  const image = event.target
  if (image instanceof HTMLImageElement) image.style.display = 'none'
}
