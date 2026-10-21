export type GalleryRecycleResult = {
  recycledIds: number[]
  failedIds: number[]
}

export async function recycleGalleryImages(
  imageIds: number[],
  recycleImage: (imageId: number) => Promise<boolean>,
  concurrency = 3,
): Promise<GalleryRecycleResult> {
  const pending = [...new Set(imageIds)].filter(
    (id) => Number.isInteger(id) && id > 0,
  )
  const recycledIds: number[] = []
  const failedIds: number[] = []
  const workerCount = Math.min(
    pending.length,
    Math.max(1, Math.floor(concurrency) || 1),
  )

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (pending.length) {
        const imageId = pending.shift()
        if (imageId === undefined) return
        try {
          if (await recycleImage(imageId)) {
            recycledIds.push(imageId)
          } else {
            failedIds.push(imageId)
          }
        } catch {
          failedIds.push(imageId)
        }
      }
    }),
  )

  return { recycledIds, failedIds }
}
