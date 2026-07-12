import { conductorGet, conductorPut } from '~/server/utils/conductor-github'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import type { PitchStatus } from '@/stores/conductorStore'

const allowedStatuses = new Set<PitchStatus>([
  'awaiting-silas',
  'approved',
  'rejected',
  'duplicate',
  'superseded',
  'archived',
])

function canonicalStatus(value: string): PitchStatus | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'passed' || normalized === 'declined') return 'rejected'
  return allowedStatuses.has(normalized as PitchStatus)
    ? (normalized as PitchStatus)
    : null
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const body = await readBody<{ slug?: string; vote?: string }>(event)
  const slug = body.slug?.trim() ?? ''
  const status = canonicalStatus(body.vote ?? '')

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

  const path = `pitches/${slug}.md`
  const file = await conductorGet(path)

  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: `Pitch not found: ${slug}`,
    })
  }

  const statusLine = `status: ${status}`
  const updated = /^status:.*$/m.test(file.content)
    ? file.content.replace(/^status:.*$/m, statusLine)
    : file.content.replace(
        /^(project-target:.*)$/m,
        `$1\n${statusLine}`,
      )

  if (updated === file.content) {
    return { success: true, changed: false, path, status }
  }

  await conductorPut(
    path,
    updated,
    `pitch: mark ${slug} ${status}`,
    file.sha,
  )

  return { success: true, changed: true, path, status }
})
