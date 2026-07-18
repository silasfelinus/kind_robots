// /server/api/model-builder/items/batch.patch.ts
// Batch-update multiple build items in a single request. Body shape:
// { "items": [ { "id": number, ...ItemPatchBody }, ... ] }
// Each item is validated and updated independently (a single failing entry
// does not abort the others) but all succeeding updates + their revisions
// commit in one transaction, so a whole group edit is one round-trip instead
// of N per-item PATCH requests.
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'

const itemInclude = {
  Artifacts: { orderBy: { id: 'asc' } },
  Revisions: { orderBy: { id: 'asc' } },
} satisfies Prisma.ModelBuildItemInclude

type ItemBatchEntry = ItemPatchBody & { id?: unknown }

type ItemBatchBody = {
  items?: unknown
}

type BatchResult = {
  id: number | null
  success: boolean
  message: string
  statusCode: number
  data?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<ItemBatchBody>(event)

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Request body must include a non-empty "items" array.',
      })
    }

    const entries = body.items as ItemBatchEntry[]
    const actor = auth.user.username ?? String(auth.user.id)
    const results: BatchResult[] = []

    // Each entry validates/loads independently, but every entry that passes
    // validation is applied in one transaction so the batch is atomic for the
    // items it actually touches (a mid-batch DB error rolls all of them back
    // rather than leaving the group half-applied).
    const applied: Array<{
      id: number
      data: Prisma.ModelBuildItemUncheckedUpdateInput
      revision: ReturnType<typeof prepareItemUpdate>['revision']
    }> = []

    for (const entry of entries) {
      let id: number | null = null
      try {
        if (!entry || typeof entry !== 'object') {
          throw createError({
            statusCode: 400,
            message: 'Each item entry must be an object with an "id".',
          })
        }

        id = Number(entry.id)
        if (!Number.isInteger(id) || id <= 0) {
          throw createError({
            statusCode: 400,
            message: 'Invalid item ID. It must be a positive integer.',
          })
        }

        const existing = await prisma.modelBuildItem.findUnique({
          where: { id },
          include: { Run: { select: { userId: true } } },
        })
        if (!existing) {
          throw createError({
            statusCode: 404,
            message: 'Build item not found.',
          })
        }
        assertRunAccess(existing.Run, auth.user)

        const { id: _omit, ...fields } = entry
        void _omit
        const { data, revision } = prepareItemUpdate(existing, fields, actor)
        applied.push({ id, data, revision })
        results.push({ id, success: true, message: 'Queued.', statusCode: 200 })
      } catch (error: unknown) {
        const handled = errorHandler(error)
        results.push({
          id,
          success: false,
          message:
            handled.message || `Failed to update item ${id ?? 'unknown'}.`,
          statusCode: handled.statusCode || 500,
        })
      }
    }

    if (applied.length) {
      const updatedById = await prisma.$transaction(async (tx) => {
        const byId = new Map<number, unknown>()
        for (const { id, data, revision } of applied) {
          if (revision) {
            await tx.modelBuildRevision.create({
              data: { itemId: id, ...revision },
            })
          }
          const item = await tx.modelBuildItem.update({
            where: { id },
            data,
            include: itemInclude,
          })
          byId.set(id, item)
        }
        return byId
      })

      for (const result of results) {
        if (result.success && result.id !== null) {
          result.data = updatedById.get(result.id)
          result.message = 'Build item updated successfully.'
        }
      }
    }

    const updatedCount = results.filter((result) => result.success).length
    const failedCount = results.length - updatedCount

    event.node.res.statusCode = failedCount === 0 ? 200 : 207
    return {
      success: failedCount === 0,
      message: `Batch complete: ${updatedCount} updated, ${failedCount} failed.`,
      data: results,
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
