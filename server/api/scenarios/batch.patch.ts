// /server/api/scenarios/batch.patch.ts
// Batch-update multiple scenarios in a single request.
// Body shape: { "updates": [ { "id": number, ...scenarioFields }, ... ] }
// Each scenario is validated and updated independently; a single failing
// entry does not abort the others. Returns a per-item results array.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import {
  assertScenarioMutationInput,
  assertScenarioRelationsAttachable,
  buildScenarioUpdateInput,
  SCENARIO_BATCH_LIMIT,
  scenarioBatchPatchFields,
  type ScenarioMutationInput,
} from './mutation'
import { scenarioMutationSelect } from './selects'

type ScenarioBatchEntry = ScenarioMutationInput & { id?: unknown }

type BatchResult = {
  id: number | null
  success: boolean
  message: string
  statusCode: number
  data?: unknown
}

async function processEntry(
  rawEntry: unknown,
  index: number,
  user: { id: number; Role?: string | null },
): Promise<BatchResult> {
  let id: number | null = null

  try {
    if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
      throw createError({
        statusCode: 400,
        message: `Scenario batch update item ${index} must be a JSON object.`,
      })
    }

    const candidateId = Number((rawEntry as Record<string, unknown>).id)

    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
      })
    }

    id = candidateId

    // Unlike the singular PATCH route, batch entries carry their own routing
    // id in the body (there's no per-item URL). assertScenarioMutationInput's
    // id handling rejects a bare `id` field unless told what it's allowed to
    // match against, so pass the id we just validated as `routeId` -- this
    // is the same "id must match the route" contract as [id].patch.ts, just
    // with the entry itself acting as its own route.
    assertScenarioMutationInput(rawEntry, {
      allowedFields: scenarioBatchPatchFields,
      context: `Scenario batch update item ${index}`,
      requireNonEmpty: true,
      routeId: id,
    })

    const entry = rawEntry as ScenarioBatchEntry

    const existingScenario = await prisma.scenario.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingScenario) {
      throw createError({
        statusCode: 404,
        message: 'Scenario not found.',
      })
    }

    if (existingScenario.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this scenario.',
      })
    }

    const { id: _routingId, ...fields } = entry
    void _routingId

    if (Object.keys(fields).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    await assertScenarioRelationsAttachable(fields, user.id, userIsAdmin(user))

    const data = await buildScenarioUpdateInput(fields)

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid scenario fields provided for update.',
      })
    }

    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data,
      select: scenarioMutationSelect,
    })

    return {
      id,
      success: true,
      message: 'Scenario updated successfully.',
      statusCode: 200,
      data: updatedScenario,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    return {
      id,
      success: false,
      message:
        handledError.message ||
        `Failed to update scenario with ID ${id ?? 'unknown'}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<unknown>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Request body must be a JSON object.',
      })
    }

    const record = body as Record<string, unknown>
    const unsupported = Object.keys(record).filter((field) => field !== 'updates')

    if (unsupported.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported Scenario batch patch fields: ${unsupported.join(', ')}.`,
      })
    }

    if (!Array.isArray(record.updates) || record.updates.length === 0) {
      throw createError({
        statusCode: 400,
        message:
          'Request body must include a non-empty "updates" array of scenario objects.',
      })
    }

    if (record.updates.length > SCENARIO_BATCH_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `Scenario batch patch may contain at most ${SCENARIO_BATCH_LIMIT} entries.`,
      })
    }

    const results: BatchResult[] = []

    for (const [index, entry] of record.updates.entries()) {
      results.push(await processEntry(entry, index, user))
    }

    const updatedCount = results.filter((result) => result.success).length
    const failedCount = results.length - updatedCount

    event.node.res.statusCode = failedCount === 0 ? 200 : 207

    return {
      success: failedCount === 0,
      message: `${updatedCount} updated, ${failedCount} failed.`,
      data: results,
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to batch-update scenarios.',
      data: null,
      statusCode,
    }
  }
})
