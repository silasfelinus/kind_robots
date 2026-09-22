// /server/api/resources/batch.post.ts
import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  buildResourceCreateInput,
  fallbackResourceName,
  isResourceDuplicateError,
  isResourceInfrastructureError,
  type ResourceBatchFailure,
  type ResourceBatchSkip,
  type ResourceCreateBody,
} from './create'
import {
  resourceMutationSelect,
  type ResourceMutationResult,
} from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ResourceCreateBody[]>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Resource batch body must be a non-empty array.',
      })
    }

    // ?mode=upsert enriches an existing Resource (matched by its unique name)
    // with the incoming catalog fields instead of skipping it. `slug` is left
    // out of the write so its own @unique constraint can't block a distinct
    // model, and owner-managed flags (isPublic/isActive) + relations are
    // preserved on existing rows.
    const upsert = String(getQuery(event).mode ?? '') === 'upsert'

    /*
     * Names whose stored classification was made by a person. A re-import is
     * routine -- the watched-folder agent upserts the whole catalog -- and its
     * classifier runs on filenames and Civitai tags, neither of which knows
     * that Silas already looked at this row and corrected it. Without this the
     * next scan quietly reverts every hand correction, which is the one
     * failure mode that would make the editor not worth using.
     *
     * One query for the whole batch, and only when the batch actually carries
     * categories to write.
     */
    const humanClassifiedNames = new Set<string>()

    if (upsert) {
      const namedCategories = body
        .filter((entry) => entry?.loraCategory !== undefined)
        .map((entry) => String(entry?.name ?? '').trim())
        .filter(Boolean)

      if (namedCategories.length) {
        const existing = await prisma.resource.findMany({
          where: {
            name: { in: namedCategories },
            loraCategorySource: 'HUMAN',
          },
          select: { name: true },
        })
        for (const row of existing) humanClassifiedNames.add(row.name)
      }
    }

    const created: ResourceMutationResult[] = []
    const skipped: ResourceBatchSkip[] = []
    const failed: ResourceBatchFailure[] = []

    for (const entry of body) {
      const fallbackName = fallbackResourceName(entry)

      try {
        const data = await buildResourceCreateInput({
          entry,
          authenticatedUserId: user.id,
        })

        if (upsert) {
          const resource = await prisma.resource.upsert({
            where: { name: data.name },
            create: { ...data, slug: undefined },
            update: {
              customLabel: data.customLabel,
              MediaPath: data.MediaPath,
              customUrl: data.customUrl,
              civitaiUrl: data.civitaiUrl,
              huggingUrl: data.huggingUrl,
              localPath: data.localPath,
              imagePath: data.imagePath,
              description: data.description,
              generation: data.generation,
              artPrompt: data.artPrompt,
              triggerWords: data.triggerWords,
              defaultTrigger: data.defaultTrigger,
              hash: data.hash,
              previewImageUrl: data.previewImageUrl,
              civitaiModelId: data.civitaiModelId,
              civitaiModelVersionId: data.civitaiModelVersionId,
              isMature: data.isMature,
              resourceType: data.resourceType,
              supportedServer: data.supportedServer,
              loraCategory: humanClassifiedNames.has(data.name)
                ? undefined
                : data.loraCategory,
              loraCategorySource: humanClassifiedNames.has(data.name)
                ? undefined
                : data.loraCategorySource,
            },
            select: resourceMutationSelect,
          })

          created.push(resource)
          continue
        }

        try {
          const resource = await prisma.resource.create({
            data,
            select: resourceMutationSelect,
          })

          created.push(resource)
        } catch (error) {
          if (isResourceDuplicateError(error)) {
            skipped.push({
              name: data.name,
              reason: 'Resource with this unique identity already exists.',
            })
            continue
          }

          throw error
        }
      } catch (error) {
        if (isResourceInfrastructureError(error)) throw error

        const handled = errorHandler(error)
        failed.push({
          name: fallbackName,
          message: handled.message || 'Invalid Resource payload.',
        })
      }
    }

    if (!created.length && !skipped.length && failed.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No resources were created. ${failed.length} failed.`,
        data: { created, skipped, failed },
        statusCode: 400,
      }
    }

    const statusCode = failed.length ? 207 : created.length ? 201 : 200
    event.node.res.statusCode = statusCode

    return {
      success: created.length > 0 || failed.length === 0,
      message: `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`,
      data: { created, skipped, failed },
      statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to batch-create resources.',
      data: null,
      statusCode,
    }
  }
})
