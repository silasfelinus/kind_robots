// The client Butterfly Gallery uses to turn a built ButterflyGenerationRequest
// into a real ArtJob (butterfly-gallery/t-019). Unlike the feed provider and
// action adapter elsewhere in this project, the LIVE implementation is the
// default here rather than a fixture: POST /api/art/enqueue is Kind Robots'
// existing durable render queue -- live today, not something waiting on the
// future art-archive read/write integration (t-022) the way the pile feed
// and curation persistence are. Butterfly Gallery is a controller here, not
// a second render queue: this file's only job is to call the real one and
// hand back its job id. A fixture implementation exists for tests and for
// any caller that must never make a network call.
import type {
  ButterflyGalleryGenerationClient,
  ButterflyGenerationRequest,
} from '@/types/butterflyGallery'

export function createFixtureButterflyGalleryGenerationClient(): ButterflyGalleryGenerationClient {
  let nextJobId = 900_000
  return {
    async submit(): Promise<{ jobId: number }> {
      nextJobId += 1
      return { jobId: nextJobId }
    },
  }
}

export function createLiveButterflyGalleryGenerationClient(): ButterflyGalleryGenerationClient {
  return {
    async submit(
      request: ButterflyGenerationRequest,
    ): Promise<{ jobId: number }> {
      const { generation, ...rest } = request
      const response = await fetch('/api/art/enqueue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...rest, ...generation }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        message?: string
        data?: { jobId?: number }
      } | null

      if (
        !response.ok ||
        !result?.success ||
        !Number.isInteger(result.data?.jobId)
      ) {
        throw new Error(
          result?.message || 'Failed to queue the regeneration request.',
        )
      }
      return { jobId: Number(result.data?.jobId) }
    },
  }
}

let activeClient: ButterflyGalleryGenerationClient =
  createLiveButterflyGalleryGenerationClient()

/** The client the store submits generation requests through today: live by
 * default (see file header). Tests and any caller that must not touch the
 * network install the fixture via setButterflyGalleryGenerationClient(). */
export function defaultButterflyGalleryGenerationClient(): ButterflyGalleryGenerationClient {
  return activeClient
}

export function setButterflyGalleryGenerationClient(
  client: ButterflyGalleryGenerationClient,
): void {
  activeClient = client
}

export function resetButterflyGalleryGenerationClient(): void {
  activeClient = createLiveButterflyGalleryGenerationClient()
}
