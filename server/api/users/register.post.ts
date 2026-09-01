// /server/api/user/register.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { sendWelcomeMessage } from '../../utils/welcomeMessage'
import prisma from '../../utils/prisma'
import { awardKarma } from '../../utils/karma'
import { createUser } from '.'

export default defineEventHandler(async (event) => {
  console.log('🚀 Launching the user creation journey...')

  try {
    const userData = await readBody(event)
    // Never log registration bodies: they can contain plaintext passwords.
    console.log('📬 Received user registration request:', {
      hasUsername: Boolean(userData?.username),
      hasEmail: Boolean(userData?.email),
      hasReferralCode: Boolean(userData?.referralCode),
    })

    if (!userData.username && !userData.email) {
      return {
        success: false,
        message:
          '👤 Username or 📧 email is required to forge a new star in our universe.',
        statusCode: 400,
      }
    }
    if (userData.password && userData.password.length < 8) {
      return {
        success: false,
        message:
          '🔑 Password must be a strong shield with at least 8 characters.',
        statusCode: 400,
      }
    }

    const result = await createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    })

    if (result.success && result.user) {
      console.log('🌟 A new star is born in our user universe:', {
        id: result.user.id,
        username: result.user.username,
      })

      try {
        await sendWelcomeMessage(result.user.id, { markAsRead: false })
        console.log('💌 Welcome message delivered to', result.user.id)
      } catch (welcomeError) {
        console.error(
          '⚠️ Failed to send welcome message (registration still succeeded):',
          welcomeError,
        )
      }

      if (userData.referralCode && typeof userData.referralCode === 'string') {
        try {
          const referrer = await prisma.user.findFirst({
            where: { referralCode: userData.referralCode },
            select: { id: true },
          })
          if (referrer) {
            await prisma.referral.create({
              data: {
                referrerId: referrer.id,
                referredId: result.user.id,
                codeUsed: userData.referralCode,
              },
            })
            await awardKarma({
              userId: referrer.id,
              reason: 'REFERRAL_SIGNUP',
              refId: String(result.user.id),
            })
            console.log(`🎁 Referral recorded: referrer=${referrer.id} new_user=${result.user.id}`)
          }
        } catch (referralError) {
          console.error(
            '⚠️ Failed to process referral (registration still succeeded):',
            referralError,
          )
        }
      }

      const { password: _password, ...safeUser } = result.user
      void _password

      return {
        success: true,
        message:
          '🌟 Welcome to our cosmic family, brave explorer! Your account has been created.',
        user: safeUser,
        statusCode: 201,
      }
    }

    return {
      success: false,
      message:
        typeof result.message === 'string'
          ? `🌌 Cosmic anomaly detected: ${result.message}`
          : '🌌 An unexpected cosmic event occurred. Please try forging your star again.',
      statusCode: 500,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    console.error('🌩️ Cosmic storm encountered:', message)
    return {
      success: false,
      message: `🚀 Mission abort! ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
