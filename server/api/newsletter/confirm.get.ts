// /server/api/newsletter/confirm.get.ts
// Public: consume a NEWSLETTER_CONFIRM token (?token=), stamp
// newsletterConfirmedAt, and sync the (now confirmed) opt-in to Brevo.
import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import prisma from '../../utils/prisma'
import { appBaseUrl } from '../../utils/email'
import { consumeAuthToken } from '../../utils/authToken'
import { syncBrevoContact } from '../../utils/brevoContacts'

export default defineEventHandler(async (event) => {
  const token = String(getQuery(event).token || '')
  const base = appBaseUrl()

  const result = await consumeAuthToken(token, 'NEWSLETTER_CONFIRM')
  if (!result.ok) {
    return sendRedirect(event, `${base}/account?newsletter=invalid`, 302)
  }

  const updated = await prisma.user.update({
    where: { id: result.userId },
    data: { newsletterConfirmedAt: new Date() },
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

  return sendRedirect(event, `${base}/account?newsletter=success`, 302)
})
