import { defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { loadZuzuArtLedger } from '~/server/utils/zuzuWorldLedger'
import { errorHandler } from '~/server/utils/error'
import { runZuzuAssignment } from '~/server/utils/zuzuProjectUsage'

export default defineEventHandler(async (event) => {
  try {
    let accessContext: ReturnType<typeof getArtImageAccessContext> | null = null
    const accessFor = () => (accessContext ??= getArtImageAccessContext(event))
    const result = await runZuzuAssignment(
      {
        requireAdmin: () => requireAdminApiUser(event),
        accessIsAdmin: async () => (await accessFor()).isAdmin,
        ledgerHas: async (id) => (await loadZuzuArtLedger()).items.has(id),
        accessibleArtImageIds: async (artImageIds) => {
          const access = await accessFor()
          const rows = await prisma.artImage.findMany({
            where: {
              AND: [
                buildArtImageWhere(access),
                { id: { in: artImageIds } },
                ...(access.showMature
                  ? []
                  : [{ OR: [{ isMature: false }, { isMature: null }] }]),
              ],
            },
            select: { id: true },
          })
          return rows.map((row) => row.id)
        },
        zuzuProjects: (projectIds) =>
          prisma.project.findMany({
            where: { id: { in: projectIds }, isActive: true },
            select: { id: true, conductorSlug: true },
          }),
        store: prisma,
      },
      () => readBody(event),
    )

    return {
      success: true,
      data: {
        changed: result.changed,
        created: result.created,
        updated: result.updated,
        references: result.references,
        action: result.action,
      },
      message: result.message,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Unable to update project art links.',
      statusCode: handled.statusCode || 500,
    }
  }
})
