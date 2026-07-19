// /server/api/components/reconcile.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildComponentReconcilePlan,
  parseWonderLabManifest,
} from '../../utils/wonderlabComponentReconcile'
import { Prisma } from '~/prisma/generated/prisma/client'

type ReconcileMode = 'dry-run' | 'apply'

type ReconcileRequestBody = {
  mode?: ReconcileMode
  manifest?: unknown
}

type ComponentUpdateAction = ReturnType<
  typeof buildComponentReconcilePlan
>['updates'][number] & {
  existingId: number
}

type ComponentUpdateValue = string | number | boolean | Date

function parseMode(value: unknown): ReconcileMode {
  if (value === undefined || value === 'dry-run') return 'dry-run'
  if (value === 'apply') return 'apply'

  throw createError({
    statusCode: 400,
    message: 'Reconciliation mode must be "dry-run" or "apply".',
  })
}

function hasExistingId(
  action: ReturnType<typeof buildComponentReconcilePlan>['updates'][number],
): action is ComponentUpdateAction {
  return Number.isInteger(action.existingId)
}

function buildCaseBranches(
  actions: ComponentUpdateAction[],
  valueFor: (action: ComponentUpdateAction) => ComponentUpdateValue | undefined,
): Prisma.Sql[] {
  return actions.flatMap((action) => {
    const value = valueFor(action)
    return value === undefined
      ? []
      : [Prisma.sql`WHEN ${action.existingId} THEN ${value}`]
  })
}

function addCaseAssignment(
  assignments: Prisma.Sql[],
  column: Prisma.Sql,
  branches: Prisma.Sql[],
): void {
  if (!branches.length) return

  assignments.push(
    Prisma.sql`${column} = CASE \`id\` ${Prisma.join(branches, ' ')} ELSE ${column} END`,
  )
}

function buildBulkUpdateQuery(
  actions: ReturnType<typeof buildComponentReconcilePlan>['updates'],
  updatedAt: Date,
): Prisma.Sql | null {
  const updateActions = actions.filter(hasExistingId)
  if (updateActions.length !== actions.length) {
    throw new Error('Component reconciliation update is missing an existing ID.')
  }
  if (!updateActions.length) return null

  const assignments: Prisma.Sql[] = []
  addCaseAssignment(
    assignments,
    Prisma.sql`\`componentName\``,
    buildCaseBranches(updateActions, (action) => action.changes.componentName),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`folderName\``,
    buildCaseBranches(updateActions, (action) => action.changes.folderName),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`slug\``,
    buildCaseBranches(updateActions, (action) => action.changes.slug),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`sourcePath\``,
    buildCaseBranches(updateActions, (action) => action.changes.sourcePath),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`sourceKey\``,
    buildCaseBranches(updateActions, (action) => action.changes.sourceKey),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`sourceHash\``,
    buildCaseBranches(updateActions, (action) => action.changes.sourceHash),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`isDiscovered\``,
    buildCaseBranches(updateActions, (action) => action.changes.isDiscovered),
  )
  addCaseAssignment(
    assignments,
    Prisma.sql`\`lastSeenAt\``,
    buildCaseBranches(updateActions, (action) =>
      action.changes.lastSeenAt
        ? new Date(action.changes.lastSeenAt)
        : undefined,
    ),
  )
  assignments.push(Prisma.sql`\`updatedAt\` = ${updatedAt}`)

  return Prisma.sql`
    UPDATE \`Component\`
    SET ${Prisma.join(assignments, ', ')}
    WHERE \`id\` IN (${Prisma.join(
      updateActions.map((action) => action.existingId),
    )})
  `
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
      const updateQuery = buildBulkUpdateQuery(plan.updates, new Date())
      const operations = [
        ...(updateQuery ? [prisma.$executeRaw(updateQuery)] : []),
        ...(plan.creates.length
          ? [
              prisma.component.createMany({
                data: plan.creates.map((action) =>
                  createDataForAction(action, manifest.generatedAt),
                ),
              }),
            ]
          : []),
      ]

      if (operations.length) await prisma.$transaction(operations)
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
