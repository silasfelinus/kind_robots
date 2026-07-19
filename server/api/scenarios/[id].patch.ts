// /server/api/scenarios/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import {
  assertScenarioMutationInput,
  buildScenarioUpdateInput,
  scenarioPatchFields,
} from './mutation'
import { scenarioMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

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

    const body = await readBody<unknown>(event)

    assertScenarioMutationInput(body, {
      allowedFields: scenarioPatchFields,
      context: 'Scenario patch payload',
      requireNonEmpty: true,
      authenticatedUserId: user.id,
      routeId: id,
    })

    const data = await buildScenarioUpdateInput(body)

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

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Scenario updated successfully.',
      data: updatedScenario,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message ||
        `Failed to update scenario with ID ${id ?? 'unknown'}.`,
      data: null,
      statusCode,
    }
  }
})
