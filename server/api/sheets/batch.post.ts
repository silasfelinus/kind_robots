// /server/api/sheets/batch.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { buildPitchSheetFromDream } from '@/server/utils/pitchSheets/defaults'
import type { DreamType, Prisma } from '~/prisma/generated/prisma/client'

export const config = {
  maxDuration: 60,
}

const CHUNK_SIZE = 25

const DREAM_TYPES = [
  'ART',
  'BRAINSTORM',
  'PROMPTBOT',
  'NARRATOR',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'LOCATION',
  'PITCH',
] as const satisfies readonly DreamType[]

const DREAM_TYPE_SET = new Set<string>(DREAM_TYPES)

const MODES = ['missing', 'refreshImages', 'overwrite'] as const
type SheetBatchMode = (typeof MODES)[number]

type SheetBatchBody = {
  dryRun?: boolean
  mode?: SheetBatchMode
  onlyActive?: boolean
  onlyPublic?: boolean
  userId?: number
  dreamIds?: number[]
  dreamTypes?: DreamType[]
  limit?: number
  imagePathTemplate?: string
  layoutKey?: string
  designer?: string
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

function getPositiveIntegerArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined

  const ids = value
    .map((entry) => getPositiveIntegerOrUndefined(entry))
    .filter((entry): entry is number => typeof entry === 'number')

  return ids.length ? [...new Set(ids)] : undefined
}

function getDreamTypes(value: unknown): DreamType[] | undefined {
  if (!Array.isArray(value)) return undefined

  const dreamTypes = value.filter(
    (entry): entry is DreamType =>
      typeof entry === 'string' && DREAM_TYPE_SET.has(entry),
  )

  return dreamTypes.length ? [...new Set(dreamTypes)] : undefined
}

function getBatchBody(
  body: SheetBatchBody | undefined,
): Required<
  Pick<SheetBatchBody, 'dryRun' | 'mode' | 'onlyActive' | 'imagePathTemplate'>
> &
  Omit<SheetBatchBody, 'dryRun' | 'mode' | 'onlyActive' | 'imagePathTemplate'> {
  const mode = MODES.includes(body?.mode as SheetBatchMode)
    ? (body?.mode as SheetBatchMode)
    : 'missing'

  return {
    dryRun: body?.dryRun === true,
    mode,
    onlyActive: body?.onlyActive !== false,
    onlyPublic: body?.onlyPublic === true,
    userId: getPositiveIntegerOrUndefined(body?.userId),
    dreamIds: getPositiveIntegerArray(body?.dreamIds),
    dreamTypes: getDreamTypes(body?.dreamTypes),
    limit: getPositiveIntegerOrUndefined(body?.limit),
    imagePathTemplate:
      typeof body?.imagePathTemplate === 'string' &&
      body.imagePathTemplate.includes('{slug}')
        ? body.imagePathTemplate
        : '/images/dreams/{slug}.webp',
    layoutKey:
      typeof body?.layoutKey === 'string' && body.layoutKey.trim()
        ? body.layoutKey.trim()
        : undefined,
    designer:
      typeof body?.designer === 'string' && body.designer.trim()
        ? body.designer.trim()
        : undefined,
  }
}

function imagePathForSlug(template: string, slug: string) {
  return template.split('{slug}').join(slug)
}

function toOverwriteUpdateInput(
  data: Prisma.PitchSheetUncheckedCreateInput,
): Prisma.PitchSheetUncheckedUpdateInput {
  const { dreamId, userId, ...update } = data
  return update
}

function toRefreshImageUpdateInput(
  data: Prisma.PitchSheetUncheckedCreateInput,
): Prisma.PitchSheetUncheckedUpdateInput {
  return {
    imagePath: data.imagePath,
    artImageId: data.artImageId,
    icon: data.icon,
    colorTheme: data.colorTheme,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user.Role === 'ADMIN' || user.id === 1

    if (!isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only admins or server keys may batch-create PitchSheets.',
      })
    }

    const body = getBatchBody(
      ((await readBody<SheetBatchBody | undefined>(event).catch(
        () => undefined,
      )) ?? undefined) as SheetBatchBody | undefined,
    )

    const where: Prisma.DreamWhereInput = {}

    if (body.onlyActive) {
      where.isActive = true
    }

    if (body.onlyPublic) {
      where.isPublic = true
    }

    if (body.userId) {
      where.userId = body.userId
    }

    if (body.dreamIds?.length) {
      where.id = { in: body.dreamIds }
    }

    if (body.dreamTypes?.length) {
      where.dreamType = { in: body.dreamTypes }
    }

    const dreams = await prisma.dream.findMany({
      where,
      orderBy: { id: 'asc' },
      ...(body.limit ? { take: body.limit } : {}),
    })

    if (!dreams.length) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'No Dreams matched this batch request.',
        data: {
          mode: body.mode,
          dryRun: body.dryRun,
          matchedDreams: 0,
          existingSheets: 0,
          queuedCreates: 0,
          queuedUpdates: 0,
          skippedExisting: 0,
          skippedMissingSlug: 0,
          preview: [],
          results: [],
        },
        statusCode: 200,
      }
    }

    const existingSheets = await prisma.pitchSheet.findMany({
      where: {
        dreamId: {
          in: dreams.map((dream) => dream.id),
        },
      },
      select: {
        id: true,
        dreamId: true,
      },
    })

    const existingByDreamId = new Map(
      existingSheets.map((sheet) => [sheet.dreamId, sheet]),
    )

    type DreamRow = (typeof dreams)[number]
    type ExistingSheet = (typeof existingSheets)[number]
    type NormalizedWork = {
      skipped: false
      dream: DreamRow
      existing?: ExistingSheet
      imagePath: string
      data: Prisma.PitchSheetUncheckedCreateInput
    }
    type NormalizedSkip = {
      skipped: true
      reason: 'missing-slug' | 'existing-sheet'
      dream: DreamRow
      existing?: ExistingSheet
    }

    const normalized: Array<NormalizedWork | NormalizedSkip> = dreams.map(
      (dream) => {
        const existing = existingByDreamId.get(dream.id)

        if (!dream.slug) {
          return {
            skipped: true as const,
            reason: 'missing-slug',
            dream,
            existing,
          }
        }

        if (body.mode === 'missing' && existing) {
          return {
            skipped: true as const,
            reason: 'existing-sheet',
            dream,
            existing,
          }
        }

        const imagePath = imagePathForSlug(body.imagePathTemplate, dream.slug)

        const actorLabel =
          kind === 'server'
            ? 'server key'
            : user
              ? `user ${user.id}`
              : 'unknown actor'

        const data = buildPitchSheetFromDream(dream, dream.userId || user.id, {
          imagePath,
          layoutKey: body.layoutKey,
          designer: body.designer ?? dream.designer ?? actorLabel,
        })

        return {
          skipped: false as const,
          dream,
          existing,
          imagePath,
          data,
        }
      },
    )

    const work = normalized.filter(
      (entry): entry is NormalizedWork => !entry.skipped,
    )
    const skippedExisting = normalized.filter(
      (entry): entry is NormalizedSkip =>
        entry.skipped && entry.reason === 'existing-sheet',
    )
    const skippedMissingSlug = normalized.filter(
      (entry): entry is NormalizedSkip =>
        entry.skipped && entry.reason === 'missing-slug',
    )

    const preview = normalized.slice(0, 20).map((entry) => ({
      dreamId: entry.dream.id,
      title: entry.dream.title,
      slug: entry.dream.slug,
      dreamType: entry.dream.dreamType,
      existingPitchSheetId: entry.existing?.id ?? null,
      action: entry.skipped
        ? entry.reason
        : entry.existing
          ? body.mode === 'refreshImages'
            ? 'update-image'
            : 'overwrite'
          : 'create',
      imagePath: entry.skipped ? null : entry.imagePath,
    }))

    if (body.dryRun) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: `Dry run complete. ${work.length} PitchSheet row(s) would be processed.`,
        data: {
          mode: body.mode,
          dryRun: true,
          matchedDreams: dreams.length,
          existingSheets: existingSheets.length,
          queuedCreates: work.filter((entry) => !entry.existing).length,
          queuedUpdates: work.filter((entry) => entry.existing).length,
          skippedExisting: skippedExisting.length,
          skippedMissingSlug: skippedMissingSlug.length,
          imagePathTemplate: body.imagePathTemplate,
          preview,
          results: [],
        },
        statusCode: 200,
      }
    }

    const select = {
      id: true,
      dreamId: true,
      title: true,
      imagePath: true,
      artImageId: true,
      updatedAt: true,
    } satisfies Prisma.PitchSheetSelect

    type BatchResult = Prisma.PitchSheetGetPayload<{
      select: typeof select
    }>

    const results: BatchResult[] = []
    let committedChunks = 0

    try {
      for (let start = 0; start < work.length; start += CHUNK_SIZE) {
        const slice = work.slice(start, start + CHUNK_SIZE)

        const chunkResults = await prisma.$transaction(
          slice.map((entry) => {
            if (body.mode === 'missing') {
              return prisma.pitchSheet.create({
                data: entry.data,
                select,
              })
            }

            return prisma.pitchSheet.upsert({
              where: { dreamId: entry.dream.id },
              create: entry.data,
              update:
                body.mode === 'refreshImages'
                  ? toRefreshImageUpdateInput(entry.data)
                  : toOverwriteUpdateInput(entry.data),
              select,
            })
          }),
          { timeout: 30000 },
        )

        results.push(...chunkResults)
        committedChunks += 1
      }
    } catch (chunkError) {
      const { message, statusCode } = errorHandler(chunkError)
      event.node.res.statusCode = statusCode || 500

      return {
        success: false,
        message: `Failed after committing ${results.length}/${work.length} PitchSheet row(s) (${committedChunks} chunk(s)). Re-send the same request to resume. Cause: ${message}`,
        data: {
          mode: body.mode,
          dryRun: false,
          matchedDreams: dreams.length,
          existingSheets: existingSheets.length,
          queuedCreates: work.filter((entry) => !entry.existing).length,
          queuedUpdates: work.filter((entry) => entry.existing).length,
          skippedExisting: skippedExisting.length,
          skippedMissingSlug: skippedMissingSlug.length,
          committedChunks,
          results,
        },
        statusCode: event.node.res.statusCode,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Processed ${results.length} PitchSheet row(s) successfully (${committedChunks} chunk(s) of up to ${CHUNK_SIZE}).`,
      data: {
        mode: body.mode,
        dryRun: false,
        matchedDreams: dreams.length,
        existingSheets: existingSheets.length,
        queuedCreates: work.filter((entry) => !entry.existing).length,
        queuedUpdates: work.filter((entry) => entry.existing).length,
        skippedExisting: skippedExisting.length,
        skippedMissingSlug: skippedMissingSlug.length,
        committedChunks,
        imagePathTemplate: body.imagePathTemplate,
        results,
      },
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to batch-create PitchSheets.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
