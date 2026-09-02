import { createError, setHeader, type H3Event } from 'h3'
import type { AgentCredentialScope } from './agentCredentials'
import { claimResolvedAgentAttentionRequests } from './agentAttentionRequests'
import {
  agentCapabilityFlags,
  buildAgentWorkingContext,
} from './agentWorkingContext'
import { requireScopedApiUser, type AuthGuardResult } from './authGuard'
import { effectiveShowMature } from './contentAccess'
import prisma from './prisma'

const AGENT_CHECKIN_STATUSES = new Set(['idle', 'working', 'blocked', 'completed'])
const CHECKIN_WINDOW_MS = 10 * 60 * 1000
const CHECKIN_WINDOW_LIMIT = 30
const CHECKIN_WINDOW_CLEANUP_THRESHOLD = 1000
const checkInWindows = new Map<number, { startedAt: number; count: number }>()

type AgentCheckInInput = {
  status?: unknown
  summary?: unknown
}

export type BoundAgentProfile = {
  id: number
  userId: number
  name: string
  avatarImage: string | null
  description: string | null
  isPublic: boolean
  allowMessages: boolean
  isActive: boolean
}

export type BoundAgentContext = {
  auth: AuthGuardResult & {
    kind: 'agent-credential'
    agentProfileId: number
  }
  profile: BoundAgentProfile
}

export function cleanAgentCheckInStatus(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !AGENT_CHECKIN_STATUSES.has(value)) {
    throw createError({
      statusCode: 400,
      message: 'status must be one of: idle, working, blocked, completed.',
    })
  }
  return value
}

export function cleanAgentCheckInSummary(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'summary must be text.' })
  }
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 5000) {
    throw createError({
      statusCode: 400,
      message: 'summary must be 5000 characters or fewer.',
    })
  }
  return trimmed
}

export function parseAgentCheckInInput(input: AgentCheckInInput | null | undefined) {
  return {
    status: cleanAgentCheckInStatus(input?.status),
    summary: cleanAgentCheckInSummary(input?.summary),
  }
}

export async function requireBoundAgentProfile(
  event: H3Event,
  scope: AgentCredentialScope,
): Promise<BoundAgentContext> {
  const auth = await requireScopedApiUser(event, scope)

  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) {
    throw createError({
      statusCode: 403,
      message: 'This action requires a credential bound to an AgentProfile.',
    })
  }

  const profile = await prisma.agentProfile.findUnique({
    where: { id: auth.agentProfileId },
    select: {
      id: true,
      userId: true,
      name: true,
      avatarImage: true,
      description: true,
      isPublic: true,
      allowMessages: true,
      isActive: true,
    },
  })

  if (!profile || !profile.isActive || profile.userId !== auth.user.id) {
    throw createError({ statusCode: 403, message: 'This AgentProfile is not active.' })
  }

  return {
    auth: auth as BoundAgentContext['auth'],
    profile,
  }
}

function cleanupExpiredCheckInWindows(now: number) {
  if (checkInWindows.size < CHECKIN_WINDOW_CLEANUP_THRESHOLD) return

  for (const [credentialId, window] of checkInWindows) {
    if (now - window.startedAt >= CHECKIN_WINDOW_MS) {
      checkInWindows.delete(credentialId)
    }
  }
}

export function assertAgentCheckInRateAllowed(event: H3Event, credentialId: number | undefined) {
  if (!credentialId) {
    throw createError({
      statusCode: 403,
      message: 'Agent check-in requires a persistent AgentProfile credential.',
    })
  }

  const now = Date.now()
  cleanupExpiredCheckInWindows(now)
  const existing = checkInWindows.get(credentialId)
  if (!existing || now - existing.startedAt >= CHECKIN_WINDOW_MS) {
    checkInWindows.set(credentialId, { startedAt: now, count: 1 })
    return
  }

  if (existing.count >= CHECKIN_WINDOW_LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil((existing.startedAt + CHECKIN_WINDOW_MS - now) / 1000),
    )
    setHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Agent check-in rate limit exceeded. Try again later.',
    })
  }

  existing.count += 1
}

async function safeAgentWorkingContext(context: BoundAgentContext) {
  const { auth, profile } = context

  try {
    return await buildAgentWorkingContext({
      agentProfileId: profile.id,
      userId: auth.user.id,
      scopes: auth.scopes ?? [],
      includeMature: effectiveShowMature(auth.user),
    })
  } catch {
    // The heartbeat has already been durably recorded at this point. Context is
    // additive, so a transient read-side failure must not turn a successful
    // check-in into an apparent failure that provider schedulers retry.
    return {
      available: false as const,
      message:
        'Working context is temporarily unavailable; the check-in was still recorded.',
    }
  }
}

export async function recordAgentCheckIn(input: {
  context: BoundAgentContext
  status: string | null
  summary: string | null
}) {
  const { auth, profile } = input.context
  const deliveredAt = new Date()

  const result = await prisma.$transaction(async (tx) => {
    const checkIn = await tx.agentCheckIn.create({
      data: {
        agentProfileId: profile.id,
        userId: auth.user.id,
        credentialId: auth.credentialId ?? null,
        status: input.status,
        summary: input.summary,
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

  const workingContext = await safeAgentWorkingContext(input.context)

  return {
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
    context: workingContext,
    message:
      deliveries.length > 0
        ? `${deliveries.join(' and ')} delivered.`
        : 'Check-in recorded. No new human notes or attention resolutions.',
  }
}

export function serializeAgentIdentity(context: BoundAgentContext) {
  const { auth, profile } = context
  const scopes = auth.scopes ?? []
  return {
    actorKind: 'AI_AGENT' as const,
    authKind: auth.kind,
    operator: {
      id: auth.user.id,
      username: auth.user.username,
    },
    agentProfile: {
      id: profile.id,
      name: profile.name,
      avatarImage: profile.avatarImage,
      description: profile.description,
      isPublic: profile.isPublic,
      allowMessages: profile.allowMessages,
      isActive: profile.isActive,
    },
    credential: {
      id: auth.credentialId ?? null,
      scopes,
    },
    capabilities: agentCapabilityFlags(scopes),
  }
}
