// /server/api/components/reconcile.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildComponentReconcilePlan,
  parseWonderLabManifest,
  type ComponentReconcileChanges,
} from '../../utils/wonderlabComponentReconcile'
import type { Prisma } from '~/prisma/generated/prisma/client'

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

function updateDataForChanges(
  changes: ComponentReconcileChanges,
): Prisma.ComponentUpdateInput {
  return {
    componentName: changes.componentName,
    folderName: changes.folderName,
    slug: changes.slug,
    sourcePath: changes.sourcePath,
    sourceKey: changes.sourceKey,
    sourceHash: changes.sourceHash,
    isDiscovered: changes.isDiscovered,
    lastSeenAt: changes.lastSeenAt ? new Date(changes.lastSeenAt) : undefined,
    updatedAt: new Date(),
  }
}

function createDataForAction(
  action: ReturnType<typeof buildComponentReconcilePlan>['creates'][number],
  generatedAt: string,
): Prisma.ComponentCreateManyInput {
  return {
    componentName: action.componentName,
    folderName: action.changes.folderName || 'root',
    slug: action.changes.slug,
    sourcePath: action.changes.sourcePath,
    sourceKey: action.changes.sourceKey,
    sourceHash: action.changes.sourceHash,
    lastSeenAt: action.changes.lastSeenAt
      ? new Date(action.changes.lastSeenAt)
      : new Date(generatedAt),
    isDiscovered: action.changes.isDiscovered ?? true,
    status: 'UNREVIEWED',
    title: action.componentName,
    notes: null,
    isWorking: false,
    underConstruction: false,
    isBroken: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
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
          'Component reconciliation has identity conflicts. Review the dry-run result before applying.',
        data: {
          conflicts: plan.conflicts,
        },
      })
    }

    let applied = false

    if (mode === 'apply') {
      // Keep the full reconciliation atomic without an interactive transaction.
      // Production manifests can require hundreds of writes, and the callback
      // transaction timeout expired even at 30 seconds. A batch transaction has
      // no interactive callback deadline, while createMany collapses all new
      // records into one statement instead of one round trip per Component.
      const updateOperations = plan.updates.flatMap((action) =>
        action.existingId
          ? [
              prisma.component.update({
                where: { id: action.existingId },
                data: updateDataForChanges(action.changes),
              }),
            ]
          : [],
      )
      const createOperations = plan.creates.length
        ? [
            prisma.component.createMany({
              data: plan.creates.map((action) =>
                createDataForAction(action, manifest.generatedAt),
              ),
            }),
          ]
        : []

      await prisma.$transaction([...updateOperations, ...createOperations])
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
          ? 'Component reconciliation applied without deleting unmatched records or reviews.'
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
