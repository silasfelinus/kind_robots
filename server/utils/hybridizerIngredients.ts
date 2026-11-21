import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import {
  fusionIdForIdentity,
  starterForIdentity,
} from '~/server/utils/hybridizerFusion'
import {
  uploadIdForIdentity,
  uploadPromptLabel,
} from '~/utils/hybridizer/uploadRules'

export type HybridizerIngredientInfo = {
  title: string
  // Text the art prompt uses for this ingredient.
  promptLabel: string
  taxonomy: string | null
  depth: number
  isPublic: boolean
}

// One place decides whether a viewer may use an ingredient key, shared by
// fusion creation, first render and revisions. Starters are public; fusions
// follow their own visibility; uploads exist only for their owner.
export async function resolveHybridizerIngredient(
  key: string,
  viewerId: number,
): Promise<HybridizerIngredientInfo> {
  const starter = starterForIdentity(key)
  if (starter)
    return {
      title: starter.title,
      promptLabel: starter.title,
      taxonomy: starter.taxonomy ?? null,
      depth: 0,
      isPublic: true,
    }

  const uploadId = uploadIdForIdentity(key)
  if (uploadId) {
    const upload = await prisma.hybridizerUpload.findUnique({
      where: { id: uploadId },
    })
    if (!upload || !upload.isActive || upload.ownerUserId !== viewerId)
      throw createError({
        statusCode: 404,
        message: 'Uploaded ingredient not available.',
      })
    return {
      title: upload.title,
      promptLabel: uploadPromptLabel(upload.title, upload.description),
      taxonomy: upload.kind === 'object' ? 'OTHER' : 'UPLOAD',
      depth: 0,
      isPublic: false,
    }
  }

  const fusionId = fusionIdForIdentity(key)
  const ancestor = fusionId
    ? await prisma.hybridizerFusion.findUnique({ where: { id: fusionId } })
    : null
  if (!ancestor || (!ancestor.isPublic && ancestor.creatorUserId !== viewerId))
    throw createError({
      statusCode: 404,
      message: 'Hybrid ingredient not available.',
    })
  return {
    title: ancestor.title,
    promptLabel: ancestor.title,
    taxonomy: 'HYBRID',
    depth: ancestor.depth,
    isPublic: ancestor.isPublic,
  }
}
