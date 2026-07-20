// Shared relation-attachability gate for Facet create/patch.
// A Facet may only reference an ArtImage / ArtCollection the caller is allowed
// to attach — their own, or a public one (admins bypass). Without this, the
// raw artImageId/artCollectionId FKs let a user pin another user's PRIVATE
// ArtImage/ArtCollection onto their Facet (audit P6 MEDIUM).
import { createError } from 'h3'
import prisma from '~/server/utils/prisma'

export async function assertFacetRelationsAttachable(
  ids: { artImageId?: number | null; artCollectionId?: number | null },
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (isAdmin) return

  const notAttachable = { NOT: { OR: [{ userId }, { isPublic: true }] } }

  const [artForbidden, collectionForbidden] = await Promise.all([
    ids.artImageId
      ? prisma.artImage.count({
          where: { id: ids.artImageId, ...notAttachable },
        })
      : 0,
    ids.artCollectionId
      ? prisma.artCollection.count({
          where: { id: ids.artCollectionId, ...notAttachable },
        })
      : 0,
  ])

  const forbiddenLabel =
    artForbidden > 0
      ? 'ArtImage'
      : collectionForbidden > 0
        ? 'ArtCollection'
        : null

  if (forbiddenLabel) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach that ${forbiddenLabel} to this Facet.`,
    })
  }
}
