// /server/api/admin/art-archive/presets/index.get.ts
//
// Admin-only list of persisted Art Archive action presets (art-archive/
// t-014). Defaults to active presets only, filterable by actionType.
// Read-only.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  ARCHIVE_PRESET_ACTION_TYPES,
  type ArchivePresetActionType,
} from '~/server/utils/artArchivePresetModifiers'

type PresetListQuery = {
  actionType?: string
  includeInactive?: string
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery<PresetListQuery>(event)

    const where: Prisma.ArchiveActionPresetWhereInput = {
      isActive: query.includeInactive === 'true' ? undefined : true,
    }

    if (
      query.actionType &&
      (ARCHIVE_PRESET_ACTION_TYPES as string[]).includes(query.actionType)
    ) {
      where.actionType = query.actionType as ArchivePresetActionType
    }

    const presets = await prisma.archiveActionPreset.findMany({
      where,
      orderBy: { label: 'asc' },
    })

    return {
      success: true,
      message: `Fetched ${presets.length} archive action preset${presets.length === 1 ? '' : 's'}.`,
      data: presets.map((preset) => ({
        ...preset,
        modifiers: JSON.parse(preset.modifiers),
      })),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to list archive action presets.',
      statusCode,
    }
  }
})
