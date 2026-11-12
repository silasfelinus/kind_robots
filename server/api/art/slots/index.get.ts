// /server/api/art/slots/index.get.ts
//
// Art slots with their candidates, for the admin chooser (pages/admin/art-slots.vue)
// and Conductor. Query: projectSlug?, prefix?, multiple=1 (only slots with two or
// more live candidates), page?, pageSize? (max 100).
import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  assertCurator,
  listSlots,
  normalizeProjectSlug,
} from '../../../utils/artSlots'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const query = getQuery(event)
    const data = await listSlots({
      projectSlug: normalizeProjectSlug(query.projectSlug),
      prefix: query.prefix ? String(query.prefix).slice(0, 300) : null,
      multipleOnly: query.multiple === '1' || query.multiple === 'true',
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 24,
    })
    return {
      success: true,
      message: `${data.slots.length} of ${data.totalCount} slot(s).`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to list art slots.',
      statusCode: event.node.res.statusCode,
    }
  }
})
