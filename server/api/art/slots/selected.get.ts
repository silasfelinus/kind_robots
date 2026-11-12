// /server/api/art/slots/selected.get.ts
//
// The chosen image of every slot for a project or key prefix, so a game can read
// its art from the backend instead of a hard-coded manifest. Public: it returns
// only slot keys and ArtImage ids; /api/art/image applies its own access rules.
// Query: projectSlug or prefix (one is required).
import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../utils/error'
import { normalizeProjectSlug, selectedArt } from '../../../utils/artSlots'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const slots = await selectedArt({
      projectSlug: normalizeProjectSlug(query.projectSlug),
      prefix: query.prefix ? String(query.prefix).slice(0, 300) : null,
    })
    return {
      success: true,
      message: `${slots.length} chosen slot image(s).`,
      data: { slots },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to read chosen slot art.',
      statusCode: event.node.res.statusCode,
    }
  }
})
