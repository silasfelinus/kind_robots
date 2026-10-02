import { requireAdminApiUser } from '@/server/utils/authGuard'
import {
  applyPitchVote,
  canonicalPitchStatus,
} from '@/server/utils/conductorPitchVote'

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const body = await readBody<{ slug?: string; vote?: string }>(event)
  const slug = body.slug?.trim() ?? ''
  const status = canonicalPitchStatus(body.vote ?? '')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  if (!status) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'vote must be awaiting-silas, approved, rejected, duplicate, superseded, or archived',
    })
  }

  return applyPitchVote(slug, status)
})
