// /server/api/auth/email/send-verification.post.ts
// Authenticated: (re)send an email-verification link to the current user.
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { createAuthToken } from '../../../utils/authToken'
import { sendVerificationEmail } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        emailVerified: true,
      },
    })

    if (!record?.email) {
      throw createError({
        statusCode: 400,
        message: 'Add an email to your profile before verifying it.',
      })
    }
    if (record.emailVerified) {
      return { success: true, message: 'Your email is already verified.' }
    }

    const { token } = await createAuthToken(record.id, 'EMAIL_VERIFY')
    const result = await sendVerificationEmail(
      record.email,
      record.name || record.username,
      token,
    )

    return {
      success: true,
      message: result.sent
        ? 'Verification email sent. Check your inbox.'
        : 'Verification link created (email delivery is not configured).',
      data: { sent: result.sent },
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Could not send verification email.',
    }
  }
})
