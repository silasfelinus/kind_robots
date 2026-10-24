export type MemoryArtFeedPage<T> = {
  items: T[]
  nextCursor: number | null
}

type MemoryArtCandidateOptions<T extends { id: number }> = {
  collectionIds: number[]
  pairCount: number
  fetchPage: (
    collectionId: number | null,
    cursor: number | null,
  ) => Promise<MemoryArtFeedPage<T>>
  playable: (image: T) => boolean
}

const MAX_PAGES_PER_SOURCE = 6

export async function loadMemoryArtCandidates<T extends { id: number }>({
  collectionIds,
  pairCount,
  fetchPage,
  playable,
}: MemoryArtCandidateOptions<T>): Promise<T[]> {
  const sources: Array<number | null> = collectionIds.length
    ? [...new Set(collectionIds.filter((id) => Number.isInteger(id) && id > 0))]
    : [null]
  const perSourceTarget = Math.max(
    2,
    Math.ceil((Math.max(2, pairCount) * 3) / Math.max(1, sources.length)),
  )
  const images = new Map<number, T>()

  for (const collectionId of sources) {
    let cursor: number | null = null
    let sourceCount = 0

    for (let pageIndex = 0; pageIndex < MAX_PAGES_PER_SOURCE; pageIndex++) {
      const page = await fetchPage(collectionId, cursor)

      for (const image of page.items) {
        if (!Number.isInteger(image.id) || !playable(image)) continue
        if (!images.has(image.id)) {
          images.set(image.id, image)
          sourceCount += 1
        }
      }

      if (
        sourceCount >= perSourceTarget ||
        page.nextCursor === null ||
        page.nextCursor === cursor
      ) {
        break
      }

      cursor = page.nextCursor
    }
  }

  return [...images.values()]
}
