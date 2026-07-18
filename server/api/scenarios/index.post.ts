// /server/api/scenarios/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import {
  buildScenarioCreateInput,
  findExistingScenario,
  type ScenarioPostInput,
} from './create'
import { scenarioMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ScenarioPostInput | ScenarioPostInput[]>(event)

    if (Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message:
          'POST /api/scenarios creates one Scenario. Use /api/scenarios/batch for arrays.',
      })
    }

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    const createInput = buildScenarioCreateInput(body, user.id)
    const existingScenario = await findExistingScenario(
      createInput.title,
      user.id,
    )

    if (existingScenario) {
      throw createError({
        statusCode: 409,
        message: `Scenario already exists with ID ${existingScenario.id}.`,
      })
    }

    const data = await prisma.scenario.create({
      data: createInput,
      select: scenarioMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Scenario created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to create scenario.',
      statusCode,
    }
  }
})
