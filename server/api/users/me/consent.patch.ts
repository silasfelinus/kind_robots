// /server/api/users/me/consent.patch.ts
// Authenticated self-service consent/privacy toggles. Whitelisted so these stay
// out of the generic /api/users/[id] PATCH churn.
// Body may include: isPublic, showMature, listInDirectory, allowFriendRequests,
// messagePolicy (EVERYONE|FRIENDS|NONE).
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import type { MessagePolicy } from '~/prisma/generated/prisma/client'

const BOOL_FIELDS = [
  'isPublic',
  'showMature',
  'listInDirectory',
  'allowFriendRequests',
] as const

const VALID_POLICIES: MessagePolicy[] = ['EVERYONE', 'FRIENDS', 'NONE']

function toBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(s)) return true
    if (['false', '0', 'no', 'off'].includes(s)) return false
  }
  if (typeof v === 'number') return v !== 0
  return undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<Record<string, unknown>>(event)

    const data: Record<string, unknown> = {}

    for (const field of BOOL_FIELDS) {
      if (field in body) {
        const b = toBool(body[field])
        if (b !== undefined) data[field] = b
      }
    }

    if ('messagePolicy' in body) {
      const policy = String(body.messagePolicy).toUpperCase() as MessagePolicy
      if (!VALID_POLICIES.includes(policy)) {
        throw createError({ statusCode: 400, message: 'Invalid messagePolicy.' })
      }
      data.messagePolicy = policy
    }

    if (Object.keys(data).length === 0) {
      throw createError({ statusCode: 400, message: 'No consent fields provided.' })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        isPublic: true,
        showMature: true,
        listInDirectory: true,
        allowFriendRequests: true,
        messagePolicy: true,
      },
    })

    return { success: true, message: 'Consent settings updated.', data: updated }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message || 'Update failed.' }
  }
})
