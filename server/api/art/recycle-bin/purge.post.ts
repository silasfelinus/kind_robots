// /server/api/art/recycle-bin/purge.post.ts
//
// "Delete forever" for items already in the Recycle Bin. A row that is not in
// the bin is refused (409), so nothing is erased straight from the gallery.
// Archive-backed images have their quarantined file erased (admin only).
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { purgeArtCollection, purgeArtImage } from '~/server/utils/artRecycleBin'
import {
  readRecycleBinRequest,
  runRecycleBinRequest,
} from '~/server/utils/recycleBinRequest'

export default defineEventHandler(async (event) => {
  try {
    const { user, isAdmin } = await requireApiUser(event)
    const request = readRecycleBinRequest(await readBody(event))
    const results = await runRecycleBinRequest(
      request,
      { id: user.id, isAdmin },
      { image: purgeArtImage, collection: purgeArtCollection },
    )
    const succeeded = results.filter((result) => result.success).length
    const failed = results.length - succeeded

    return {
      success: failed === 0,
      message: failed
        ? `Deleted forever ${succeeded} of ${results.length} item(s); ${failed} failed.`
        : `Deleted forever ${succeeded} item(s).`,
      data: { results },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
