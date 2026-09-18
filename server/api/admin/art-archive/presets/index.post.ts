// /server/api/admin/art-archive/presets/index.post.ts
//
// Admin-only creation of a persisted Art Archive action preset (art-archive/
// t-014). `modifiers` is validated against `actionType`'s required shape
// (server/utils/artArchivePresetModifiers.ts) before it is ever written --
// an invalid preset would silently fail whenever t-015's curation board
// later tries to apply it.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  ARCHIVE_PRESET_ACTION_TYPES,
  validateArchivePresetModifiers,
  type ArchivePresetActionType,
} from '~/server/utils/artArchivePresetModifiers'

type CreatePresetBody = {
  label?: string
  description?: string | null
  actionType?: string
  modifiers?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<CreatePresetBody>(event)

    const label = body?.label?.trim()
    if (!label) {
      throw createError({ statusCode: 400, message: 'label is required.' })
    }

    if (
      !body?.actionType ||
      !(ARCHIVE_PRESET_ACTION_TYPES as string[]).includes(body.actionType)
    ) {
      throw createError({
        statusCode: 400,
        message: `actionType must be one of: ${ARCHIVE_PRESET_ACTION_TYPES.join(', ')}.`,
      })
    }
    const actionType = body.actionType as ArchivePresetActionType

    const validation = validateArchivePresetModifiers(actionType, body.modifiers)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        message: `Invalid modifiers for ${actionType}: ${validation.errors.join(' ')}`,
      })
    }

    const preset = await prisma.archiveActionPreset.create({
      data: {
        userId: auth.user.id,
        label: label.slice(0, 255),
        description: body.description?.trim() || null,
        actionType,
        modifiers: JSON.stringify(body.modifiers),
      },
    })

    return {
      success: true,
      message: `Archive action preset "${preset.label}" created.`,
      data: { ...preset, modifiers: JSON.parse(preset.modifiers) },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to create archive action preset.',
      statusCode,
    }
  }
})
