export type ReadingSpeed = 'normal' | 'fast' | 'instant'

// Reveal whole words so the reserved text never reflows mid-animation.
export function readingStops(text: string): number[] {
  return [...text.matchAll(/\S+\s*/gu)].map(
    (match) => (match.index ?? 0) + match[0].length,
  )
}

export function readingDelay(speed: ReadingSpeed, reduced: boolean): number {
  if (reduced || speed === 'instant') return 0
  return speed === 'fast' ? 45 : 100
}
