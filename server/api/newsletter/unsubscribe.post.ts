// /server/api/newsletter/unsubscribe.post.ts
// Authenticated: immediately opt out of all newsletter cadences.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { syncBrevoContact } from '../../utils/brevoContacts'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { newsletterFrequency: 'NEVER', newsletterConfirmedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        newsletterFrequency: true,
        newsletterConfirmedAt: true,
        brevoContactId: true,
      },
    })

    await syncBrevoContact(updated)

    return { success: true, message: 'Unsubscribed from updates.' }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Unsubscribe failed.' }
  }
})
