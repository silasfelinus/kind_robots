// /server/api/scenarios/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import {
  buildScenarioCreateInput,
  fallbackScenarioTitle,
  findExistingScenario,
  getScenarioErrorMessage,
  isScenarioInfrastructureError,
  type FailedScenario,
  type ScenarioPostInput,
  type SkippedScenario,
} from './create'
import {
  scenarioMutationSelect,
  type ScenarioMutationResult,
} from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ScenarioPostInput[]>(event)

    if (!Array.isArray(body) || !body.length) {
      throw createError({
        statusCode: 400,
        message: 'Scenario batch body must be a non-empty array.',
      })
    }

    const created: ScenarioMutationResult[] = []
    const skipped: SkippedScenario[] = []
    const failed: FailedScenario[] = []

    for (const scenarioData of body) {
      const fallbackTitle = fallbackScenarioTitle(scenarioData)

      try {
        const createInput = buildScenarioCreateInput(scenarioData, user.id)
        const existingScenario = await findExistingScenario(
          createInput.title,
          user.id,
        )

        if (existingScenario) {
          skipped.push({
            title: createInput.title,
            existingId: existingScenario.id,
            reason: 'Scenario with this title already exists for this user.',
          })
          continue
        }

        const createdScenario = await prisma.scenario.create({
          data: createInput,
          select: scenarioMutationSelect,
        })

        created.push(createdScenario)
      } catch (error) {
        if (isScenarioInfrastructureError(error)) throw error

        failed.push({
          title: fallbackTitle,
          message: getScenarioErrorMessage(error),
        })
      }
    }

    if (failed.length && !created.length && !skipped.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        data: { created, skipped, failed },
        message: `No scenarios were created. ${failed.length} failed.`,
        statusCode: 400,
      }
    }

    const statusCode = failed.length ? 207 : created.length ? 201 : 200
    event.node.res.statusCode = statusCode

    return {
      success: failed.length === 0,
      data: { created, skipped, failed },
      message: `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`,
      statusCode,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to batch-create scenarios.',
      statusCode,
    }
  }
})
