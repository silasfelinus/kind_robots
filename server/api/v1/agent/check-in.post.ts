import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { requireScopedApiUser } from '@/server/utils/authGuard'
import prisma from '@/server/utils/prisma'
import { claimResolvedAgentAttentionRequests } from '@/server/utils/agentAttentionRequests'

const allowedStatuses = new Set(['idle', 'working', 'blocked', 'completed'])

type CheckInBody = {
  status?: unknown
  summary?: unknown
}

function cleanStatus(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !allowedStatuses.has(value)) {
    throw createError({
      statusCode: 400,
      message: 'status must be one of: idle, working, blocked, completed.',
    })
  }
  return value
}

function cleanSummary(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'summary must be text.' })
  }
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 5000) {
    throw createError({ statusCode: 400, message: 'summary must be 5000 characters or fewer.' })
  }
  return trimmed
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const auth = await requireScopedApiUser(event, 'agent:checkin')

  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) {
    throw createError({
      statusCode: 403,
      message: 'Agent check-in requires a credential bound to an AgentProfile.',
    })
  }

  const profile = await prisma.agentProfile.findUnique({
    where: { id: auth.agentProfileId },
    select: { id: true, userId: true, name: true, isActive: true },
  })
  if (!profile || !profile.isActive || profile.userId !== auth.user.id) {
    throw createError({ statusCode: 403, message: 'This AgentProfile is not active.' })
  }

  const body = (await readBody<CheckInBody>(event)) ?? {}
  const status = cleanStatus(body.status)
  const summary = cleanSummary(body.summary)
  const deliveredAt = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const checkIn = await tx.agentCheckIn.create({
      data: {
        agentProfileId: profile.id,
        userId: auth.user.id,
        credentialId: auth.credentialId ?? null,
        status,
        summary,
      },
    })

    const pending = await tx.agentNote.findMany({
      where: {
        agentProfileId: profile.id,
        userId: auth.user.id,
        deliveredAt: null,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { id: true },
    })

    if (pending.length) {
      await tx.agentNote.updateMany({
        where: {
          id: { in: pending.map((note) => note.id) },
          deliveredAt: null,
        },
        data: {
          deliveredAt,
          deliveredCheckInId: checkIn.id,
        },
      })
    }

    const notes = await tx.agentNote.findMany({
      where: { deliveredCheckInId: checkIn.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        body: true,
      },
    })

    const attention = await claimResolvedAgentAttentionRequests({
      tx,
      agentProfileId: profile.id,
      userId: auth.user.id,
      checkInId: checkIn.id,
      deliveredAt,
    })

    return { checkIn, notes, attention }
  })

  const attention = result.attention.map((request) => ({
    id: request.id,
    kind: request.kind,
    title: request.title,
    body: request.body,
    clientKey: request.clientKey,
    status: request.status,
    resolution: request.resolution,
    resolvedAt: request.resolvedAt,
  }))
  const deliveries: string[] = []
  if (result.notes.length) {
    deliveries.push(
      `${result.notes.length} human note${result.notes.length === 1 ? '' : 's'}`,
    )
  }
  if (attention.length) {
    deliveries.push(
      `${attention.length} resolved attention request${attention.length === 1 ? '' : 's'}`,
    )
  }

  return {
    success: true,
    agent: {
      id: profile.id,
      name: profile.name,
    },
    checkIn: {
      id: result.checkIn.id,
      createdAt: result.checkIn.createdAt,
      status: result.checkIn.status,
      summary: result.checkIn.summary,
    },
    notes: result.notes,
    attention,
    message:
      deliveries.length > 0
        ? `${deliveries.join(' and ')} delivered.`
        : 'Check-in recorded. No new human notes or attention resolutions.',
  }
})
