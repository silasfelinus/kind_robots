// PUT /api/art/image/:id/facets
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import {
  parseFacetSelectionBody,
  resolveFacetSelection,
} from '~/server/utils/facetAssignments'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage ID.' })
    }

    // Machine auth (JWT / user apiKey / beta-admin) for parity with the rest
    // of the art API — automation that can PATCH an image can also facet it.
    const auth = await requireMachineUser(event)
    const image = await prisma.artImage.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!image) {
      throw createError({ statusCode: 404, message: 'ArtImage not found.' })
    }

    if (!auth.isAdmin && image.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to edit this ArtImage.',
      })
    }

    const selection = parseFacetSelectionBody(await readBody(event))
    const facets = await resolveFacetSelection({
      ...selection,
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
    })
    const facetIds = facets.map((facet) => facet.id)

    await prisma.$transaction(async (tx) => {
      await tx.facetArtImage.deleteMany({
        where: facetIds.length
          ? { artImageId: id, facetId: { notIn: facetIds } }
          : { artImageId: id },
      })

      if (facetIds.length) {
        await tx.facetArtImage.createMany({
          data: facetIds.map((facetId) => ({ artImageId: id, facetId })),
          skipDuplicates: true,
        })
      }
    })

    return {
      success: true,
      message: 'ArtImage Facets updated.',
      data: facets,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
