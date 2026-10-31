import { defineEventHandler, readBody, createError } from 'h3'
import {
  claimSlimeCityChallenge,
  requireSlimeCityPreviewUser,
} from '~/server/utils/slimeCityProgress'

export default defineEventHandler(async (event) => {
  const auth = await requireSlimeCityPreviewUser(event)
  const body = await readBody<{ id?: string }>(event)
  if (typeof body?.id !== 'string' || body.id.length > 80)
    throw createError({ statusCode: 400, message: 'Invalid challenge id.' })
  const data = await claimSlimeCityChallenge(auth.user.id, body.id)
  return { success: true, data }
})
