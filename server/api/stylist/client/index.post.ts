// /server/api/stylist/client/index.post.ts
//
// Create or update a client in the authed user's book. Passing an id updates
// that client (owner-checked); otherwise a same-name client is updated in
// place (case-insensitive) or a new one is created.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

type ClientBody = {
  id?: number | null
  name?: string | null
  email?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = (await readBody(event)) as ClientBody | null

    const name = body?.name?.trim()

    if (!name) {
      throw createError({ statusCode: 400, message: 'Missing required field: name.' })
    }

    const email = body?.email?.trim() || null
    const id = Number(body?.id)

    if (Number.isInteger(id) && id > 0) {
      const existing = await prisma.stylistClient.findUnique({ where: { id } })

      if (!existing || existing.userId !== auth.user.id) {
        throw createError({ statusCode: 404, message: `Client ${id} not found.` })
      }

      const client = await prisma.stylistClient.update({
        where: { id },
        data: { name, email },
      })

      return { success: true, message: 'Client updated.', statusCode: 200, data: { client } }
    }

    const sameName = await prisma.stylistClient.findFirst({
      where: { userId: auth.user.id, name },
    })

    const client = sameName
      ? await prisma.stylistClient.update({
          where: { id: sameName.id },
          data: { email: email ?? sameName.email },
        })
      : await prisma.stylistClient.create({
          data: { userId: auth.user.id, name, email },
        })

    event.node.res.statusCode = sameName ? 200 : 201

    return {
      success: true,
      message: sameName ? 'Client updated.' : 'Client created.',
      statusCode: sameName ? 200 : 201,
      data: { client },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to save the client.',
    }
  }
})
