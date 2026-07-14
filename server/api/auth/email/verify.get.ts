// /server/api/auth/email/verify.get.ts
// Public: consume an EMAIL_VERIFY token (?token=) and stamp User.emailVerified.
// Redirects to a friendly landing page rather than returning raw JSON, since
// this URL is opened directly from an email client.
import { defineEventHandler, getQuery, sendRedirect } from 'h3'
import prisma from '../../../utils/prisma'
import { appBaseUrl } from '../../../utils/email'
import { consumeAuthToken } from '../../../utils/authToken'

export default defineEventHandler(async (event) => {
  const token = String(getQuery(event).token || '')
  const base = appBaseUrl()

  const result = await consumeAuthToken(token, 'EMAIL_VERIFY')
  if (!result.ok) {
    return sendRedirect(event, `${base}/account?verify=invalid`, 302)
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerified: new Date() },
  })

  return sendRedirect(event, `${base}/account?verify=success`, 302)
})
