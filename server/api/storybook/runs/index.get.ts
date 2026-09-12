// /server/api/storybook/runs/index.get.ts
//
// The reader's adventures: every story they have opened, newest first, with
// the ending it reached if it is finished. This is what the Collection screen
// reads instead of the localStorage story library.

import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { listStoryRuns } from '../../../utils/storybookRuns'

export default defineEventHandler(async (event) => {
  let response

  try {
    const { user } = await requireApiUser(event)
    const query = getQuery(event)
    const limit = Number(query.limit)

    const runs = await listStoryRuns(user.id, {
      status: typeof query.status === 'string' ? query.status : null,
      limit: Number.isFinite(limit) ? limit : undefined,
    })

    response = {
      success: true,
      message: `${runs.length} adventure(s).`,
      data: runs,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to list adventures.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
