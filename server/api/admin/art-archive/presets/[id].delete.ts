// /server/api/admin/art-archive/presets/[id].delete.ts
//
// Admin-only "delete" of a persisted Art Archive action preset (art-archive/
// t-014). Soft-delete only (isActive: false), matching this task's own
// `stakes: reversible` and ArchiveEntry's own isActive-flag convention for
// deletion elsewhere in this project -- a retired preset can be restored via
// PATCH { isActive: true } rather than re-created from scratch.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

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

    if (!existing.isActive) {
      return {
        success: true,
        message: `Archive action preset #${id} was already inactive.`,
        data: { alreadyInactive: true },
        statusCode: 200,
      }
    }

    await prisma.archiveActionPreset.update({ where: { id }, data: { isActive: false } })

    return {
      success: true,
      message: `Archive action preset #${id} deactivated.`,
      data: { alreadyInactive: false },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to delete archive action preset.',
      statusCode,
    }
  }
})
