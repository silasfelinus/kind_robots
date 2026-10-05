// /utils/recentArtImages.ts
//
// One card in the video generator's "recent art" picker: a finished ArtJob
// that produced a still image the viewer owns. Served by
// /api/art/queue/recent-images and read by the video store.
export type RecentArtJobImage = {
  jobId: number
  artImageId: number
  finishedAt: string
  promptString: string | null
  isMature: boolean
  isPublic: boolean
  imagePath: string | null
  path: string | null
  thumbnailPath: string | null
  fileName: string | null
  fileType: string | null
}
