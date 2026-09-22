// /server/api/resources/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { normalizeSlugInput } from '~/utils/slugify'
import {
  LORA_CATEGORIES,
  LORA_CATEGORY_SOURCES,
  normalizeLoraCategory,
  normalizeLoraCategorySource,
} from '~/utils/loraCategory'
import { validateApiKey } from '../../utils/validateKey'
import { resourceMutationSelect } from './selects'
import { assertOwnershipIsUnchanged } from './compatibility'
import type { Prisma, Resource } from '~/prisma/generated/prisma/client'
import { GrantLevel } from '~/prisma/generated/prisma/client'
import { userIsAdmin } from '../../utils/authUser'
import { existsActiveGrant } from '~/server/utils/contentAccess'

type ResourcePatchBody = Partial<Omit<Resource, 'userId'>> &
  Record<string, unknown> & {
    connectServerIds?: number[]
    disconnectServerIds?: number[]
    connectLoraImageIds?: number[]
    disconnectLoraImageIds?: number[]
  }

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

export default defineEventHandler(async (event) => {
  const resourceId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resource ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingResource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { userId: true },
    })

    if (!existingResource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    const isOwner = existingResource.userId === user.id
    const isAdmin = userIsAdmin(user)
    const hasAdminGrant =
      !isOwner &&
      !isAdmin &&
      (await existsActiveGrant(
        user.id,
        'RESOURCE',
        resourceId,
        GrantLevel.ADMIN,
      ))

    if (!isOwner && !isAdmin && !hasAdminGrant) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this resource.',
      })
    }

    const body = await readBody<ResourcePatchBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    if (Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    assertOwnershipIsUnchanged(body, existingResource.userId)

    const connectServerIds = normalizeIdArray(body.connectServerIds)
    const disconnectServerIds = normalizeIdArray(body.disconnectServerIds)
    const connectLoraImageIds = normalizeIdArray(body.connectLoraImageIds)
    const disconnectLoraImageIds = normalizeIdArray(body.disconnectLoraImageIds)

    const [foundServers, foundLoraImages] = await Promise.all([
      connectServerIds.length
        ? prisma.server.findMany({
            where: { id: { in: connectServerIds } },
            select: { id: true },
          })
        : [],
      connectLoraImageIds.length
        ? prisma.artImage.findMany({
            where: { id: { in: connectLoraImageIds } },
            select: { id: true },
          })
        : [],
    ])

    const foundServerIds = new Set(foundServers.map((server) => server.id))
    const missingServerIds = connectServerIds.filter(
      (id) => !foundServerIds.has(id),
    )

    if (missingServerIds.length) {
      throw createError({
        statusCode: 404,
        message: `Server IDs not found: ${missingServerIds.join(', ')}.`,
      })
    }

    const foundLoraImageIds = new Set(
      foundLoraImages.map((artImage) => artImage.id),
    )
    const missingLoraImageIds = connectLoraImageIds.filter(
      (id) => !foundLoraImageIds.has(id),
    )

    if (missingLoraImageIds.length) {
      throw createError({
        statusCode: 404,
        message: `LoRA ArtImage IDs not found: ${missingLoraImageIds.join(', ')}.`,
      })
    }

    const {
      connectServerIds: _connectServerIds,
      disconnectServerIds: _disconnectServerIds,
      connectLoraImageIds: _connectLoraImageIds,
      disconnectLoraImageIds: _disconnectLoraImageIds,
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...resourceFields
    } = body

    const normalizedLoraCategory =
      resourceFields.loraCategory === undefined
        ? undefined
        : resourceFields.loraCategory === null
          ? null
          : (normalizeLoraCategory(resourceFields.loraCategory) ?? undefined)

    if (
      resourceFields.loraCategory !== undefined &&
      resourceFields.loraCategory !== null &&
      normalizedLoraCategory === undefined
    ) {
      throw createError({
        statusCode: 400,
        message: `loraCategory must be one of ${LORA_CATEGORIES.join(', ')}.`,
      })
    }

    const normalizedLoraCategorySource =
      resourceFields.loraCategorySource === undefined
        ? undefined
        : resourceFields.loraCategorySource === null
          ? null
          : normalizeLoraCategorySource(resourceFields.loraCategorySource)

    if (
      resourceFields.loraCategorySource !== undefined &&
      resourceFields.loraCategorySource !== null &&
      normalizedLoraCategorySource === null
    ) {
      throw createError({
        statusCode: 400,
        message: `loraCategorySource must be one of ${LORA_CATEGORY_SOURCES.join(', ')}.`,
      })
    }

    const updateData: Prisma.ResourceUpdateInput = {
      name: resourceFields.name,
      slug:
        resourceFields.slug !== undefined
          ? normalizeSlugInput(resourceFields.slug)
          : undefined,
      customLabel: resourceFields.customLabel,
      MediaPath: resourceFields.MediaPath,
      customUrl: resourceFields.customUrl,
      civitaiUrl: resourceFields.civitaiUrl,
      huggingUrl: resourceFields.huggingUrl,
      localPath: resourceFields.localPath,
      imagePath: resourceFields.imagePath,
      description: resourceFields.description,
      isMature: resourceFields.isMature,
      resourceType: resourceFields.resourceType,
      generation: resourceFields.generation,
      supportedServer: resourceFields.supportedServer,
      isPublic: resourceFields.isPublic,
      isActive: resourceFields.isActive,
      allowReviews: resourceFields.allowReviews,
      artPrompt: resourceFields.artPrompt,
      recommendedCfg: resourceFields.recommendedCfg,
      /*
       * Both were absent from this allowlist, so every attempt to correct a
       * trigger came back 400 "No valid update fields provided" while
       * `artPrompt` -- a byte-identical copy of defaultTrigger on most rows --
       * was writable. They are the fields the LoRA probe reads, and ten rows
       * needed a trigger recovered from their own invocation syntax
       * (`<lora:JesterV2:0.75>` sanitizes to nothing, leaving an empty probe
       * prompt), so the catalog had no way to record the fix.
       */
      triggerWords: resourceFields.triggerWords,
      defaultTrigger: resourceFields.defaultTrigger,
      /*
       * The same gap as the two above. `create.ts` accepts both and
       * scan_loras.py emits both, but they arrive null on rows imported before
       * the columns existed -- Resources 2427 and 2429 carry
       * `?modelVersionId=712513` in civitaiUrl and nothing in the columns. The
       * download and browse lanes key off civitaiModelVersionId, so a row that
       * knows its own version id only inside a URL string is invisible to
       * them, and there was no way to write the value back.
       */
      civitaiModelId: resourceFields.civitaiModelId,
      civitaiModelVersionId: resourceFields.civitaiModelVersionId,
      /*
       * What the LoRA is FOR, and who decided. An edit that arrives here is a
       * person correcting the catalog through the Resource card or the LoRA
       * editor, so the source defaults to HUMAN -- which is exactly what stops
       * the next classifier run from overwriting it. A caller that is itself a
       * classifier (the import agent, the backfill) passes its own source
       * explicitly rather than inheriting that protection by accident.
       */
      loraCategory: normalizedLoraCategory,
      loraCategorySource:
        normalizedLoraCategorySource ??
        (normalizedLoraCategory !== undefined ? 'HUMAN' : undefined),
      ArtImage:
        typeof resourceFields.artImageId === 'number'
          ? { connect: { id: resourceFields.artImageId } }
          : resourceFields.artImageId === null
            ? { disconnect: true }
            : undefined,
      Servers:
        connectServerIds.length || disconnectServerIds.length
          ? {
              connect: connectServerIds.map((id) => ({ id })),
              disconnect: disconnectServerIds.map((id) => ({ id })),
            }
          : undefined,
      UsedInImages:
        connectLoraImageIds.length || disconnectLoraImageIds.length
          ? {
              connect: connectLoraImageIds.map((id) => ({ id })),
              disconnect: disconnectLoraImageIds.map((id) => ({ id })),
            }
          : undefined,
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid update fields provided.',
      })
    }

    const data = await prisma.resource.update({
      where: { id: resourceId },
      data: updateData,
      select: resourceMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Resource with ID ${resourceId} updated successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || `Failed to update resource with ID ${resourceId}.`,
      data: null,
      statusCode,
    }
  }
})
