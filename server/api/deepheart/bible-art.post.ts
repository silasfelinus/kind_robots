import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { errorHandler } from '~/server/utils/error'
import { ANTHRO_LOOK } from '~/utils/deepheart/anthro'
import { COURT_DEITIES } from '~/utils/deepheart/court'
import { CHARACTERS } from '~/utils/deepheart/roster'

type Body = { kind?: unknown; id?: unknown; notes?: unknown }
type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string; deduplicated?: boolean }
}

const STYLE =
  'Hand-inked Western fantasy animation, expressive adult proportions, crisp silhouettes, colorful cel-painted shadows, richly textured clothing and stone, cinematic torch-amber and slate-blue lighting. No writing, logos or lettering.'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user))
      throw createError({ statusCode: 404, statusMessage: 'Not found.' })

    const input = (await readBody<Body>(event)) ?? {}
    const kind = input.kind
    const id = typeof input.id === 'string' ? input.id : ''
    const person = kind === 'cast' ? CHARACTERS.find((c) => c.id === id) : null
    const deity = kind === 'court' ? COURT_DEITIES.find((d) => d.id === id) : null
    if (!person && !deity)
      throw createError({ statusCode: 400, message: 'Unknown art bible subject.' })
    if (input.notes != null && typeof input.notes !== 'string')
      throw createError({ statusCode: 400, message: 'Invalid art notes.' })
    const notes = (input.notes as string | undefined)?.trim() ?? ''
    if (notes.length > 350)
      throw createError({ statusCode: 400, message: 'Art notes exceed 350 characters.' })

    const identity = `deepheart-bible:${kind}:${id}:`
    // The button is a deliberate new request, but repeat taps or reopened
    // devices must reuse an outstanding job rather than create duplicate work.
    const existing = await prisma.artJob.findFirst({
      where: {
        projectSlug: 'deepheart',
        status: { in: ['PENDING', 'RUNNING'] },
        payload: { contains: identity },
      },
      orderBy: { id: 'desc' },
      select: { id: true, status: true },
    })
    if (existing)
      return {
        success: true,
        data: { jobId: existing.id, status: existing.status, reused: true },
      }

    const subject = person
      ? `${ANTHRO_LOOK[person.id]} Full-body standing pose on worn dungeon stone, clearly visible face, eyes, costume and silhouette. Camera at chest height, character centered, dramatic lamplight.`
      : `${deity!.look} The human-faced immortal stands before the supernatural court on a stone dais, with a few small animal-folk witnesses in the distant background. Three-quarter full-body portrait, face clearly visible, natural proportions, warm lanterns.`
    const promptString = [subject, STYLE, notes].filter(Boolean).join(' ')
    const result = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      {
        method: 'POST',
        body: {
          engine: 'krea2',
          promptString,
          projectSlug: 'deepheart',
          designer: 'Deepheart Art Bible',
          width: 768,
          height: 1024,
          isPublic: false,
          isMature: false,
          priority: 100,
          requestKey: `${identity}${Date.now()}`,
        },
      },
    )
    const jobId = Number(result.data?.jobId)
    if (!result.success || !Number.isInteger(jobId) || jobId <= 0)
      throw createError({
        statusCode: 502,
        message: result.message || 'Could not queue a new painting.',
      })
    return {
      success: true,
      data: {
        jobId,
        status: result.data?.status ?? 'PENDING',
        reused: !!result.data?.deduplicated,
      },
    }
  } catch (error: unknown) {
    const result = errorHandler(error)
    event.node.res.statusCode = result.statusCode || 500
    return {
      success: false,
      message: result.message || 'Could not request Deepheart art.',
    }
  }
})
