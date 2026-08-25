// /server/api/scene-animator/health.get.ts
//
// Dedicated diagnostic for the scene-animator source root, separate from
// `GET /api/scene-animator` (which loads folders/sources for the batch UI).
// An operator checking whether a mount landed shouldn't have to wade through
// the full listing payload -- and before this endpoint existed, an
// unreachable root only surfaced as an uncaught 503 buried inside that
// listing request (see readSceneAnimatorRootStatus's doc comment).
import { defineEventHandler, setResponseHeader } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { readSceneAnimatorRootStatus } from '@/server/utils/sceneAnimator'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const startedAt = Date.now()

  const status = await readSceneAnimatorRootStatus()
  const imageCount = status.folders.reduce((total, folder) => total + folder.imageCount, 0)
  event.node.res.statusCode = status.available ? 200 : 503

  return {
    success: status.available,
    message: status.available
      ? `Scene Animator source root is reachable (${status.folders.length} folder${status.folders.length === 1 ? '' : 's'}, ${imageCount} image${imageCount === 1 ? '' : 's'}).`
      : (status.reason ?? 'Scene Animator source root is unavailable.'),
    data: {
      root: status.root,
      source: status.source,
      folderCount: status.folders.length,
      imageCount,
      latencyMs: Date.now() - startedAt,
    },
    statusCode: status.available ? 200 : 503,
  }
})
