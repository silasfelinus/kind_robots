// Shared ArtImage-attachability gate for model-builder item/artifact writes.
// An item's artImageId is later promoted onto the run's owner-verified source
// record (see items/[id]/commit.post.ts → promoteAsset), so an unchecked FK
// lets a user pin another user's PRIVATE ArtImage onto their own record and
// surface it through that record's canonical art link (audit P6 MEDIUM).
// Attachable = own OR public; admins bypass.
import { createError } from 'h3'
import prisma from '~/server/utils/prisma'

export async function assertArtImageAttachable(
  rawArtImageId: unknown,
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (isAdmin) return

  const id = Number(rawArtImageId)
  // null / clear / invalid — nothing to attach, so nothing to gate.
  if (!Number.isInteger(id) || id <= 0) return

  const forbidden = await prisma.artImage.count({
    where: { id, NOT: { OR: [{ userId }, { isPublic: true }] } },
  })
  if (forbidden > 0) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to attach that ArtImage.',
    })
  }
}
