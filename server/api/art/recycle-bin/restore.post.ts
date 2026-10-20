// /server/api/art/recycle-bin/restore.post.ts
//
// Moves images and collections out of the Recycle Bin, back to where they
// were. Archive-backed images have their quarantined file moved home as well.
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  restoreArtCollection,
  restoreArtImage,
} from '~/server/utils/artRecycleBin'
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
      { image: restoreArtImage, collection: restoreArtCollection },
    )
    const succeeded = results.filter((result) => result.success).length
    const failed = results.length - succeeded

    return {
      success: failed === 0,
      message: failed
        ? `Restored ${succeeded} of ${results.length} item(s); ${failed} failed.`
        : `Restored ${succeeded} item(s).`,
      data: { results },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
