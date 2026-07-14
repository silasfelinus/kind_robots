// /server/api/newsletter/subscribe.post.ts
// Authenticated: choose a newsletter cadence. Double opt-in — we store the
// pending frequency but the user is NOT subscribed in Brevo until they click
// the confirmation link (which sets newsletterConfirmedAt).
// Body: { frequency: NEVER|SPECIAL|MONTHLY|WEEKLY|DAILY }
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { createAuthToken } from '../../utils/authToken'
import { sendNewsletterConfirmEmail } from '../../utils/email'
import { syncBrevoContact, newsletterFrequencyLabel } from '../../utils/brevoContacts'
import type { NewsletterFrequency } from '~/prisma/generated/prisma/client'

const VALID: NewsletterFrequency[] = [
  'NEVER',
  'SPECIAL',
  'MONTHLY',
  'WEEKLY',
  'DAILY',
]

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const { frequency } = await readBody<{ frequency?: string }>(event)

    const freq = String(frequency || '').toUpperCase() as NewsletterFrequency
    if (!VALID.includes(freq)) {
      throw createError({ statusCode: 400, message: 'Invalid newsletter frequency.' })
    }

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, username: true },
    })

    // Opting out — clear cadence + confirmation, unsubscribe in Brevo.
    if (freq === 'NEVER') {
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
      return { success: true, message: 'Unsubscribed from updates.', data: { frequency: 'NEVER', pendingConfirmation: false } }
    }

    if (!record?.email) {
      throw createError({
        statusCode: 400,
        message: 'Add and verify an email before subscribing to updates.',
      })
    }

    // Store the pending cadence; confirmation clears the opt-in gate.
    await prisma.user.update({
      where: { id: user.id },
      data: { newsletterFrequency: freq, newsletterConfirmedAt: null },
    })

    const { token } = await createAuthToken(user.id, 'NEWSLETTER_CONFIRM')
    const result = await sendNewsletterConfirmEmail(
      record.email,
      record.name || record.username,
      token,
      newsletterFrequencyLabel(freq),
    )

    return {
      success: true,
      message: result.sent
        ? 'Almost there — check your email to confirm your subscription.'
        : 'Confirmation link created (email delivery is not configured).',
      data: { frequency: freq, pendingConfirmation: true, sent: result.sent },
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Subscription failed.' }
  }
})
