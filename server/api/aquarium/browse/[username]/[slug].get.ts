// /server/api/aquarium/browse/[username]/[slug].get.ts
//
// One public tank, unauthenticated (cthulhuquarium/t-009). Only tanks with
// isPublic: true are visible; response exposes display name + tank
// contents only, never email or userId.
//
// Addressed by (username, slug) together, NOT slug alone: Aquarium.slug is
// unique per (userId, slug) -- deliberately not globally unique, per the
// t-032 schema comment fixing exactly this class of collision -- so a
// bare-slug route would be ambiguous the moment two users pick the same
// tank name.

import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../../../../utils/error'
import { getPublicTankByUsernameAndSlug } from '../../../../utils/aquarium'

export default defineEventHandler(async (event) => {
  let response

  try {
    const username = String(event.context.params?.username ?? '').trim()
    const slug = String(event.context.params?.slug ?? '').trim()

    if (!username || !slug) {
      throw createError({
        statusCode: 400,
        message: 'Both username and slug are required.',
      })
    }

    const data = await getPublicTankByUsernameAndSlug(username, slug)

    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to load public tank.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
