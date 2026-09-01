import { createError } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

export const AGENT_ATTENTION_KINDS = [
  'help',
  'approval',
  'decision',
  'review',
] as const

export const AGENT_ATTENTION_RESOLUTIONS = [
  'APPROVED',
  'DECLINED',
  'RESOLVED',
] as const

export type AgentAttentionKind = (typeof AGENT_ATTENTION_KINDS)[number]
export type AgentAttentionResolution =
  (typeof AGENT_ATTENTION_RESOLUTIONS)[number]

export type AgentAttentionRequestRow = {
  id: number
  createdAt: Date
  updatedAt: Date
  agentProfileId: number
  userId: number
  credentialId: number | null
  kind: AgentAttentionKind
  title: string
  body: string | null
  clientKey: string
  status: 'OPEN' | AgentAttentionResolution
  resolution: string | null
  resolvedAt: Date | null
  deliveredAt: Date | null
  deliveredCheckInId: number | null
}

type RawExecutor = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>

function asKind(value: unknown): AgentAttentionKind {
  if (
    typeof value !== 'string' ||
    !AGENT_ATTENTION_KINDS.includes(value as AgentAttentionKind)
  ) {
    throw createError({
      statusCode: 400,
      message: `kind must be one of: ${AGENT_ATTENTION_KINDS.join(', ')}.`,
    })
  }
  return value as AgentAttentionKind
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    throw createError({ statusCode: 400, message: `${field} is required.` })
  }
  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }
  return text
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be text.` })
  }
  const text = value.trim()
  if (!text) return null
  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }
  return text
}

export function parseAgentAttentionRequestInput(input: {
  kind?: unknown
  title?: unknown
  body?: unknown
  clientKey?: unknown
}) {
  return {
    kind: asKind(input.kind),
    title: requiredText(input.title, 'title', 255),
    body: optionalText(input.body, 'body', 5000),
    clientKey: requiredText(input.clientKey, 'clientKey', 120),
  }
}

export function parseAgentAttentionResolutionInput(input: {
  status?: unknown
  resolution?: unknown
}) {
  const status = input.status
  if (
    typeof status !== 'string' ||
    !AGENT_ATTENTION_RESOLUTIONS.includes(status as AgentAttentionResolution)
  ) {
    throw createError({
      statusCode: 400,
      message: `status must be one of: ${AGENT_ATTENTION_RESOLUTIONS.join(', ')}.`,
    })
  }

  return {
    status: status as AgentAttentionResolution,
    resolution: optionalText(input.resolution, 'resolution', 5000),
  }
}

async function findByProfileClientKey(
  executor: RawExecutor,
  agentProfileId: number,
  clientKey: string,
): Promise<AgentAttentionRequestRow | null> {
  const rows = await executor.$queryRaw<AgentAttentionRequestRow[]>(Prisma.sql`
    SELECT
      id, createdAt, updatedAt, agentProfileId, userId, credentialId,
      kind, title, body, clientKey, status, resolution, resolvedAt,
      deliveredAt, deliveredCheckInId
    FROM AgentAttentionRequest
    WHERE agentProfileId = ${agentProfileId}
      AND clientKey = ${clientKey}
    LIMIT 1
  `)
  return rows[0] ?? null
}

export async function createOrGetAgentAttentionRequest(input: {
  agentProfileId: number
  userId: number
  credentialId: number | null
  kind: AgentAttentionKind
  title: string
  body: string | null
  clientKey: string
}): Promise<{ request: AgentAttentionRequestRow; created: boolean }> {
  const existing = await findByProfileClientKey(
    prisma,
    input.agentProfileId,
    input.clientKey,
  )
  if (existing) return { request: existing, created: false }

  const inserted = await prisma.$executeRaw(Prisma.sql`
    INSERT INTO AgentAttentionRequest (
      agentProfileId, userId, credentialId, kind, title, body, clientKey, status
    ) VALUES (
      ${input.agentProfileId}, ${input.userId}, ${input.credentialId},
      ${input.kind}, ${input.title}, ${input.body}, ${input.clientKey}, 'OPEN'
    )
    ON DUPLICATE KEY UPDATE id = id
  `)

  const request = await findByProfileClientKey(
    prisma,
    input.agentProfileId,
    input.clientKey,
  )
  if (!request) {
    throw createError({
      statusCode: 500,
      message: 'Attention request could not be persisted.',
    })
  }

  return { request, created: inserted > 0 }
}

export async function listAgentAttentionRequests(input: {
  agentProfileId: number
  userId: number
  limit?: number
}): Promise<AgentAttentionRequestRow[]> {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 100))
  return await prisma.$queryRaw<AgentAttentionRequestRow[]>(Prisma.sql`
    SELECT
      id, createdAt, updatedAt, agentProfileId, userId, credentialId,
      kind, title, body, clientKey, status, resolution, resolvedAt,
      deliveredAt, deliveredCheckInId
    FROM AgentAttentionRequest
    WHERE agentProfileId = ${input.agentProfileId}
      AND userId = ${input.userId}
    ORDER BY
      CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END ASC,
      createdAt DESC
    LIMIT ${limit}
  `)
}

export async function resolveAgentAttentionRequest(input: {
  requestId: number
  agentProfileId: number
  userId: number
  status: AgentAttentionResolution
  resolution: string | null
}): Promise<AgentAttentionRequestRow> {
  const rows = await prisma.$queryRaw<AgentAttentionRequestRow[]>(Prisma.sql`
    SELECT
      id, createdAt, updatedAt, agentProfileId, userId, credentialId,
      kind, title, body, clientKey, status, resolution, resolvedAt,
      deliveredAt, deliveredCheckInId
    FROM AgentAttentionRequest
    WHERE id = ${input.requestId}
      AND agentProfileId = ${input.agentProfileId}
      AND userId = ${input.userId}
    LIMIT 1
  `)
  const current = rows[0]
  if (!current) {
    throw createError({ statusCode: 404, message: 'Attention request not found.' })
  }
  if (current.status !== 'OPEN') {
    throw createError({
      statusCode: 409,
      message: 'This attention request has already been resolved.',
    })
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE AgentAttentionRequest
    SET
      status = ${input.status},
      resolution = ${input.resolution},
      resolvedAt = CURRENT_TIMESTAMP(3),
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id = ${input.requestId}
      AND agentProfileId = ${input.agentProfileId}
      AND userId = ${input.userId}
      AND status = 'OPEN'
  `)

  const updated = await prisma.$queryRaw<AgentAttentionRequestRow[]>(Prisma.sql`
    SELECT
      id, createdAt, updatedAt, agentProfileId, userId, credentialId,
      kind, title, body, clientKey, status, resolution, resolvedAt,
      deliveredAt, deliveredCheckInId
    FROM AgentAttentionRequest
    WHERE id = ${input.requestId}
    LIMIT 1
  `)
  if (!updated[0]) {
    throw createError({ statusCode: 500, message: 'Attention request resolution was lost.' })
  }
  return updated[0]
}

export async function claimResolvedAgentAttentionRequests(input: {
  tx: RawExecutor
  agentProfileId: number
  userId: number
  checkInId: number
  deliveredAt: Date
  limit?: number
}): Promise<AgentAttentionRequestRow[]> {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 20))
  const pending = await input.tx.$queryRaw<Array<{ id: number }>>(Prisma.sql`
    SELECT id
    FROM AgentAttentionRequest
    WHERE agentProfileId = ${input.agentProfileId}
      AND userId = ${input.userId}
      AND status <> 'OPEN'
      AND deliveredAt IS NULL
    ORDER BY resolvedAt ASC, id ASC
    LIMIT ${limit}
    FOR UPDATE
  `)

  if (!pending.length) return []
  const ids = pending.map((row) => row.id)

  await input.tx.$executeRaw(Prisma.sql`
    UPDATE AgentAttentionRequest
    SET
      deliveredAt = ${input.deliveredAt},
      deliveredCheckInId = ${input.checkInId},
      updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id IN (${Prisma.join(ids)})
      AND deliveredAt IS NULL
  `)

  return await input.tx.$queryRaw<AgentAttentionRequestRow[]>(Prisma.sql`
    SELECT
      id, createdAt, updatedAt, agentProfileId, userId, credentialId,
      kind, title, body, clientKey, status, resolution, resolvedAt,
      deliveredAt, deliveredCheckInId
    FROM AgentAttentionRequest
    WHERE deliveredCheckInId = ${input.checkInId}
    ORDER BY resolvedAt ASC, id ASC
  `)
}
