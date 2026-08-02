// /server/api/users/me/intro.patch.ts
// Authenticated self-service first-launch-intro dismissal toggle. Whitelisted
// so it stays out of the generic /api/users/[id] PATCH churn, same pattern
// as consent.patch.ts. Persisted on the User record (not localStorage) so it
// follows the account across devices and can be re-opened from any of them.
// Body: { dismissed: boolean } — true sets introDismissedAt to now, false
// (re-opening the walkthrough) clears it back to null.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<Record<string, unknown>>(event)

    if (typeof body.dismissed !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'dismissed must be a boolean.',
      })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { introDismissedAt: body.dismissed ? new Date() : null },
      select: { id: true, introDismissedAt: true },
    })

    return {
      success: true,
      message: body.dismissed
        ? 'Intro dismissed.'
        : 'Intro re-opened.',
      data: updated,
    }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Update failed.' }
  }
})
