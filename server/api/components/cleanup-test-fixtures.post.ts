// /server/api/components/cleanup-test-fixtures.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import {
  parseComponentFixtureIds,
  selectComponentTestFixtures,
} from '../../utils/componentTestFixtures'

type CleanupMode = 'dry-run' | 'apply'

type CleanupRequestBody = {
  mode?: CleanupMode
  candidateIds?: unknown
}

function parseMode(value: unknown): CleanupMode {
  if (value === undefined || value === 'dry-run') return 'dry-run'
  if (value === 'apply') return 'apply'

  throw createError({
    statusCode: 400,
    message: 'Cleanup mode must be "dry-run" or "apply".',
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<CleanupRequestBody>(event)
    const mode = parseMode(body?.mode)

    const components = await prisma.component.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        componentName: true,
        folderName: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Reactions: true,
          },
        },
      },
    })

    const safeCandidates = selectComponentTestFixtures(components).map(
      (component) => ({
        id: component.id,
        componentName: component.componentName,
        folderName: component.folderName,
        title: component.title,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
        reactionCount: component._count.Reactions,
      }),
    )

    if (mode === 'dry-run') {
      return {
        success: true,
        message: safeCandidates.length
          ? `Found ${safeCandidates.length} historical Component test fixture${safeCandidates.length === 1 ? '' : 's'}. No records were changed.`
          : 'No historical Component test fixtures were found.',
        data: {
          mode,
          applied: false,
          requestedBy: {
            id: auth.user.id,
            username: auth.user.username,
          },
          candidates: safeCandidates,
          deleted: {
            components: 0,
            reactions: 0,
          },
        },
        statusCode: 200,
      }
    }

    const candidateIds = parseComponentFixtureIds(body?.candidateIds)
    if (!candidateIds.length) {
      throw createError({
        statusCode: 400,
        message:
          'Apply requires candidate IDs from a reviewed cleanup dry run.',
      })
    }

    const safeById = new Map(
      safeCandidates.map((candidate) => [candidate.id, candidate]),
    )
    const unsafeIds = candidateIds.filter((id) => !safeById.has(id))

    if (unsafeIds.length) {
      throw createError({
        statusCode: 409,
        message:
          'One or more requested records no longer match the strict test-fixture rules. Run a new dry run.',
        data: { unsafeIds },
      })
    }

    const candidatesToDelete = candidateIds.map((id) => safeById.get(id)!)
    const deleted = await prisma.$transaction(async (tx) => {
      const reactions = await tx.reaction.deleteMany({
        where: {
          componentId: { in: candidateIds },
        },
      })

      const componentResult = await tx.component.deleteMany({
        where: {
          id: { in: candidateIds },
        },
      })

      return {
        reactions: reactions.count,
        components: componentResult.count,
      }
    })

    return {
      success: true,
      message: `Deleted ${deleted.components} historical Component test fixture${deleted.components === 1 ? '' : 's'} and ${deleted.reactions} attached reaction${deleted.reactions === 1 ? '' : 's'}.`,
      data: {
        mode,
        applied: true,
        requestedBy: {
          id: auth.user.id,
          username: auth.user.username,
        },
        candidates: candidatesToDelete,
        deleted,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message:
        handled.message || 'Failed to clean historical Component test fixtures.',
      data:
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: unknown }).data
          : null,
      statusCode: event.node.res.statusCode,
    }
  }
})
