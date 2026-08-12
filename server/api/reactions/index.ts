// /server/api/reactions/index.ts
//
// Shared Reaction helpers. NOT a route handler -- same shape as
// server/api/rewards/index.ts, resources/index.ts and facets/index.ts, which
// are all helper modules with no default export. `/api/reactions` is served by
// index.get.ts and index.post.ts.
//
// This file used to also export a default event handler: a second, older
// create/update path that took `userId` straight from the request body, never
// authenticated it, and ran none of the per-target access checks
// index.post.ts applies. Anyone could POST a reaction as any user (#1788).
// It was reachable for any method index.post.ts did not claim.
//
// Retired rather than hardened. index.post.ts is the canonical create path and
// already does everything this did, correctly: it authenticates, derives the
// reactor from the session, validates the category against a total map,
// rejects unmapped targets, checks the target's visibility, and honours
// allowReviews. A second implementation of the same endpoint is how the two
// drifted apart in the first place.
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export async function fetchReactionById(id: number) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id },
    })

    if (!reaction) {
      throw new Error(`Reaction with ID ${id} not found`)
    }

    return reaction
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
