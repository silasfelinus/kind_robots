export type LocalHybridizerStudy = {
  key: string
  title: string
  sources: [string, string]
  depth: number
  status?: string
}

// Shared and private server discoveries must never be stored in browser-wide
// history. The server remains the authority for their visibility.
export function localHybridizerStudies<T extends LocalHybridizerStudy>(
  input: unknown,
  maxDepth = 4,
): T[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item): item is T => {
      if (!item || typeof item !== 'object') return false
      const entry = item as Record<string, unknown>
      return (
        typeof entry.key === 'string' &&
        entry.key.startsWith('hybrid:') &&
        entry.status === 'LOCAL' &&
        typeof entry.title === 'string' &&
        Array.isArray(entry.sources) &&
        entry.sources.length === 2 &&
        entry.sources.every((source) => typeof source === 'string') &&
        Number.isInteger(entry.depth) &&
        Number(entry.depth) >= 1 &&
        Number(entry.depth) <= maxDepth
      )
    })
    .slice(-200)
}
