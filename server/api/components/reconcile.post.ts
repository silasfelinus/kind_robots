// /server/api/components/reconcile.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildComponentReconcilePlan,
  parseWonderLabManifest,
} from '../../utils/wonderlabComponentReconcile'

 type ReconcileMode = 'dry-run' | 'apply'

 type ReconcileRequestBody = {
  mode?: ReconcileMode
  manifest?: unknown
}

function parseMode(value: unknown): ReconcileMode {
  if (value === undefined || value === 'dry-run') return 'dry-run'
  if (value === 'apply') return 'apply'

  throw createError({
    statusCode: 400,
    message: 'Reconciliation mode must be "dry-run" or "apply".',
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<ReconcileRequestBody>(event)
    const mode = parseMode(body?.mode)

    let manifest
    try {
      manifest = parseWonderLabManifest(body?.manifest)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Invalid component manifest.',
      })
    }

    const existingComponents = await prisma.component.findMany({
      orderBy: { id: 'asc' },
    })
    const plan = buildComponentReconcilePlan(manifest, existingComponents)

    if (mode === 'apply' && plan.conflicts.length) {
      throw createError({
        statusCode: 409,
        message:
          'Component reconciliation has naming conflicts. Review the dry-run result before applying.',
        data: {
          conflicts: plan.conflicts,
        },
      })
    }

    let applied = false

    if (mode === 'apply') {
      await prisma.$transaction(async (tx) => {
        for (const action of plan.updates) {
          if (!action.existingId) continue

          await tx.component.update({
            where: { id: action.existingId },
            data: {
              componentName: action.changes.componentName,
              folderName: action.changes.folderName,
              updatedAt: new Date(),
            },
          })
        }

        for (const action of plan.creates) {
          await tx.component.create({
            data: {
              componentName: action.componentName,
              folderName: action.changes.folderName || 'root',
              title: action.componentName,
              notes: null,
              isWorking: false,
              underConstruction: false,
              isBroken: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
        }
      })

      applied = true
    }

    const summary = {
      creates: plan.creates.length,
      updates: plan.updates.length,
      unchanged: plan.unchanged.length,
      missingFromManifest: plan.missingFromManifest.length,
      conflicts: plan.conflicts.length,
    }

    return {
      success: true,
      message:
        mode === 'apply'
          ? 'Component reconciliation applied without deleting unmatched records.'
          : 'Component reconciliation dry run complete. No database records were changed.',
      data: {
        mode,
        applied,
        requestedBy: {
          id: auth.user.id,
          username: auth.user.username,
        },
        manifest: {
          version: manifest.version,
          generatedAt: manifest.generatedAt,
          count: manifest.count,
        },
        summary,
        plan: {
          creates: plan.creates,
          updates: plan.updates,
          unchanged: plan.unchanged,
          missingFromManifest: plan.missingFromManifest,
          conflicts: plan.conflicts,
        },
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to reconcile WonderLab components.',
      data:
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: unknown }).data
          : null,
      statusCode: event.node.res.statusCode,
    }
  }
})
