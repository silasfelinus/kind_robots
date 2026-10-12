import { requireAdminApiUser } from '@/server/utils/authGuard'
import { applyPitchReady } from '@/server/utils/conductorPitchVote'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const body = await readBody<{ slug?: string; ready?: boolean }>(event)
  if (typeof body?.slug !== 'string' || typeof body?.ready !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'slug and boolean ready are required',
    })
  }
  return applyPitchReady(body.slug, body.ready)
})
