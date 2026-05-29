// /server/api/mana/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { maybeRefill } from '../../utils/refill'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // You can only read your own wallet — unless you're ADMIN.
    if (user.id !== id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this wallet.',
      })
    }

    await maybeRefill(id)

    const walletUser = await prisma.user.findUnique({
      where: { id },
      select: { mana: true, manaCap: true, lastManaRefill: true },
    })
    if (!walletUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found.',
      })
    }

    const transactions = await prisma.manaTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    })

    response = {
      success: true,
      message: 'Wallet loaded successfully.',
      data: {
        balance: walletUser.mana,
        cap: walletUser.manaCap,
        lastRefill: walletUser.lastManaRefill?.toISOString() ?? null,
        transactions,
      },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to load wallet for user ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
