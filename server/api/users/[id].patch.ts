// /server/api/users/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

function toBooleanLike(v: unknown): boolean | undefined {
  if (v === undefined) return undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false
  }
  if (typeof v === 'number') return v !== 0
  return undefined
}

function toDateLike(v: unknown): Date | undefined {
  if (v == null) return undefined
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? undefined : d
}

function toStringOrJson(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function normalizeSmartBar(v: unknown): string | null {
  if (v == null) return null

  const rawValues = Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? v.split(',')
      : [v]

  const ids = rawValues
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0)

  const uniqueIds = [...new Set(ids)]

  return uniqueIds.length ? uniqueIds.join(',') : ''
}

function normalizeOptionalId(v: unknown): number | null | undefined {
  if (v == null || v === '') return null

  const id = Number(v)

  return Number.isInteger(id) && id > 0 ? id : undefined
}

function isOversizedAvatarPayload(value: unknown): boolean {
  if (typeof value !== 'string') return false

  const clean = value.trim()

  return clean.startsWith('data:image/') || clean.length > 5000
}

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid User ID' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || user?.id !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this user.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({ statusCode: 400, message: 'No data provided.' })
    }

    // Explicit allowlist of self-editable profile + preference columns. Every
    // other User column is NOT writable through this self-service route and is
    // silently ignored, so a round-tripped full User object stays compatible
    // while no privileged column can be set. Deliberately excluded:
    //   - privilege: Role
    //   - economy: karma, mana, manaCap, questPoints, clickRecord, matchRecord,
    //     lastReward, signupBonusGiven, lastManaRefill
    //   - membership/billing: isMember, memberUntil, stripeCustomerId,
    //     stripeSubscriptionId, brevoContactId, referralCode
    //   - moderation: isRestricted, restrictedAt, restrictedById,
    //     restrictedReason, isActive, isGuest
    //   - identity/secrets: apiKey, token, password, emailVerified, googleId,
    //     googleEmail
    //   - system: id, createdAt, updatedAt, newsletterConfirmedAt
    // Ownership was verified above (user.id === userId); this route is
    // owner-only, never admin, so none of the above may be self-granted.
    const TEXT_FIELDS = new Set([
      'username',
      'email',
      'name',
      'address1',
      'address2',
      'avatarImage',
      'bio',
      'city',
      'country',
      'state',
      'phone',
      'timezone',
      'languages',
      'discordUrl',
      'facebookUrl',
      'instagramUrl',
      'kindrobotsUrl',
      'twitterUrl',
      'designerName',
      'artPrompt',
    ])
    const BOOL_FIELDS = new Set([
      'isPublic',
      'showMature',
      'customIcons',
      'allowFriendRequests',
      'listInDirectory',
    ])
    const JSON_FIELDS = new Set([
      'vibes',
      'artModels',
      'textModels',
      'blockList',
      'hiddenServerIds',
    ])
    const DATE_FIELDS = new Set(['birthday'])
    const ID_FIELDS = new Set([
      'artImageId',
      'preferredArtServerId',
      'preferredTextServerId',
    ])
    const ENUM_FIELDS: Record<string, Set<string>> = {
      messagePolicy: new Set(['EVERYONE', 'FRIENDS', 'NONE']),
      newsletterFrequency: new Set([
        'NEVER',
        'SPECIAL',
        'MONTHLY',
        'WEEKLY',
        'DAILY',
      ]),
    }

    const updateData: Record<string, unknown> = {}

    for (const [k, v] of Object.entries(body)) {
      if (k === 'smartBar') {
        updateData[k] = normalizeSmartBar(v)
        continue
      }

      if (ID_FIELDS.has(k)) {
        const id = normalizeOptionalId(v)
        if (id !== undefined) updateData[k] = id
        continue
      }

      if (DATE_FIELDS.has(k)) {
        const d = toDateLike(v)
        if (d) updateData[k] = d
        else if (v == null) updateData[k] = null
        continue
      }

      if (BOOL_FIELDS.has(k)) {
        const b = toBooleanLike(v)
        if (b !== undefined) updateData[k] = b
        continue
      }

      if (JSON_FIELDS.has(k)) {
        updateData[k] = toStringOrJson(v)
        continue
      }

      const enumValues = ENUM_FIELDS[k]
      if (enumValues) {
        if (typeof v === 'string' && enumValues.has(v)) updateData[k] = v
        continue
      }

      if (TEXT_FIELDS.has(k)) {
        updateData[k] = v
        continue
      }

      // Any other key (system, privilege, economy, moderation, secrets) is not
      // self-editable and is intentionally ignored.
    }

    if (isOversizedAvatarPayload(updateData.avatarImage)) {
      if (updateData.artImageId) {
        delete updateData.avatarImage
      } else {
        throw createError({
          statusCode: 400,
          message:
            'Avatar image payload is too large. Save the image as ArtImage and set artImageId instead.',
        })
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No updatable fields present.',
      })
    }

    if (
      typeof updateData.smartBar === 'string' &&
      updateData.smartBar.length > 5000
    ) {
      throw createError({
        statusCode: 400,
        message: 'smartBar payload is too large.',
      })
    }

    const data = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    event.node.res.statusCode = 200
    return { success: true, message: 'User updated.', data }
  } catch (err) {
    const handled = errorHandler(err)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Update failed.',
      statusCode: handled.statusCode || 500,
    }
  }
})
