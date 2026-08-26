// /server/api/mandarin/sets/index.post.ts
//
// mandarin-tutor/t-016: upserts one custom study set (create or rename/re-save) into
// MandarinCustomSet, keyed on the store's own client-generated `clientId` (see
// stores/mandarinTutorStore.ts's `safeId`) rather than the autoincrement id, so a set
// created offline keeps the same identity once it syncs. Never deletes -- the store
// does not expose deleting a custom set today, and this endpoint mirrors exactly the
// mutations it does expose (create, rename, toggle a card in/out of `cardKeys`).
import { createError, defineEventHandler, readBody } from 'h3'
import { requireApiUser } from '../../../utils/authGuard'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

const MAX_CLIENT_ID_LENGTH = 64
const MAX_NAME_LENGTH = 80
const MAX_CARD_KEYS = 2000
const MAX_CARD_KEY_LENGTH = 255

type RequestBody = {
  clientId?: unknown
  name?: unknown
  cardKeys?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = ((await readBody(event)) ?? {}) as RequestBody

    const clientId = String(body.clientId ?? '').trim()
    if (!clientId || clientId.length > MAX_CLIENT_ID_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid clientId is required.',
      })
    }

    const name = String(body.name ?? '')
      .trim()
      .slice(0, MAX_NAME_LENGTH)
    if (!name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A non-empty name is required.',
      })
    }

    if (!Array.isArray(body.cardKeys)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'cardKeys must be an array.',
      })
    }
    const cardKeys = [
      ...new Set(
        body.cardKeys
          .filter((key): key is string => typeof key === 'string')
          .map((key) => key.trim())
          .filter((key) => key && key.length <= MAX_CARD_KEY_LENGTH),
      ),
    ].slice(0, MAX_CARD_KEYS)

    const userId = auth.user.id

    const set = await prisma.mandarinCustomSet.upsert({
      where: { userId_clientId: { userId, clientId } },
      create: { userId, clientId, name, cardKeys: JSON.stringify(cardKeys) },
      update: { name, cardKeys: JSON.stringify(cardKeys) },
    })

    return {
      success: true,
      statusCode: 200,
      message: 'Mandarin custom set saved.',
      data: {
        id: set.clientId,
        name: set.name,
        cardKeys,
        createdAt: set.createdAt.toISOString(),
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to save the Mandarin custom set.',
    }
  }
})
