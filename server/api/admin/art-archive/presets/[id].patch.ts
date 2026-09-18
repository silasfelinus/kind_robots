// /server/api/admin/art-archive/presets/[id].patch.ts
//
// Admin-only update of a persisted Art Archive action preset (art-archive/
// t-014). actionType is immutable after creation -- changing it would
// require re-validating (and likely rewriting) modifiers against a
// different shape, which is indistinguishable from creating a new preset;
// callers that want a different actionType create a new preset instead.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { validateArchivePresetModifiers } from '~/server/utils/artArchivePresetModifiers'
import type { ArchivePresetActionType } from '~/server/utils/artArchivePresetModifiers'

type UpdatePresetBody = {
  label?: string
  description?: string | null
  modifiers?: unknown
  isActive?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid preset id.' })
    }

    const existing = await prisma.archiveActionPreset.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, message: `Archive action preset #${id} not found.` })
    }

    const body = await readBody<UpdatePresetBody>(event)
    const data: {
      label?: string
      description?: string | null
      modifiers?: string
      isActive?: boolean
    } = {}

    if (body?.label !== undefined) {
      const label = body.label.trim()
      if (!label) throw createError({ statusCode: 400, message: 'label cannot be empty.' })
      data.label = label.slice(0, 255)
    }

    if (body?.description !== undefined) {
      data.description = body.description?.trim() || null
    }

    if (body?.modifiers !== undefined) {
      const validation = validateArchivePresetModifiers(
        existing.actionType as ArchivePresetActionType,
        body.modifiers,
      )
      if (!validation.valid) {
        throw createError({
          statusCode: 400,
          message: `Invalid modifiers for ${existing.actionType}: ${validation.errors.join(' ')}`,
        })
      }
      data.modifiers = JSON.stringify(body.modifiers)
    }

    if (body?.isActive !== undefined) {
      data.isActive = Boolean(body.isActive)
    }

    const updated = await prisma.archiveActionPreset.update({ where: { id }, data })

    return {
      success: true,
      message: `Archive action preset #${id} updated.`,
      data: { ...updated, modifiers: JSON.parse(updated.modifiers) },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update archive action preset.',
      statusCode,
    }
  }
})
