// /utils/scripts/facetSeedConcurrency.ts
export async function runWithKeyedConcurrency<T>(
  items: readonly T[],
  limit: number,
  keyFor: (item: T) => string,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('limit must be a positive integer')
  }

  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFor(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }

  const groupedItems = Array.from(groups.values())
  let cursor = 0
  const errors: unknown[] = []

  async function lane(): Promise<void> {
    while (cursor < groupedItems.length) {
      const group = groupedItems[cursor]
      cursor++
      if (!group) continue

      for (const item of group) {
        try {
          await worker(item)
        } catch (error) {
          errors.push(error)
        }
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(limit, groupedItems.length) },
      () => lane(),
    ),
  )

  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `${errors.length} of ${items.length} item(s) failed`,
    )
  }
}
