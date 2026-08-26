// /server/api/monsters/[id].get.ts
//
// cthulhuquarium/t-043: read a single Monster (bestiary creature) by id or
// slug, including its art-linking fields. Companion to [id].patch.ts --
// added together so a caller can confirm a PATCH landed without a direct
// database session.

import { defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { findMonsterByIdOrSlug } from './lookup'

export default defineEventHandler(async (event) => {
  try {
    const monster = await findMonsterByIdOrSlug(getRouterParam(event, 'id'))

    return {
      success: true,
      message: 'Monster loaded.',
      data: monster,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load Monster.',
      data: null,
      statusCode,
    }
  }
})
