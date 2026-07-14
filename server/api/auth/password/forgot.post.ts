// /server/api/auth/password/forgot.post.ts
// Start a password reset. Body: { email }.
// Always returns success (no account enumeration). If a user with that email
// exists and has an email on file, mint a PASSWORD_RESET token and email a link.
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { createAuthToken } from '../../../utils/authToken'
import { sendPasswordResetEmail } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email?: string }>(event)
  const clean = String(email || '').trim().toLowerCase()

  const generic = {
    success: true,
    message: 'If that email is registered, a reset link is on its way.',
  }

  if (!clean) return generic

  const user = await prisma.user.findFirst({
    where: { email: clean },
    select: { id: true, email: true, name: true, username: true },
  })

  if (user?.email) {
    const { token } = await createAuthToken(user.id, 'PASSWORD_RESET')
    await sendPasswordResetEmail(user.email, user.name || user.username, token)
  }

  return generic
})
