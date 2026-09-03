import { createError, setHeader, type H3Event } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import {
  authHasScope,
  RAINBOW_FIRST_PARTY_CLIENT_ID,
  requireApiUser,
  type AuthGuardResult,
} from './authGuard'
import { getRainbowDirectoryPreference } from './rainbowDirectory'
import prisma from './prisma'

const MESSAGE_BODY_LIMIT = 5000
const CLIENT_KEY_LIMIT = 120
const THREAD_LIST_LIMIT = 50
const MESSAGE_LIST_DEFAULT = 50
const MESSAGE_LIST_MAX = 100
const MESSAGE_WINDOW_MS = 10 * 60 * 1000
const MESSAGE_WINDOW_LIMIT = 30
const MESSAGE_WINDOW_CLEANUP_THRESHOLD = 1000

const messageWindows = new Map<string, { startedAt: number; count: number }>()

export type AgentMessageActor =
  | {
      kind: 'HUMAN'
      userId: number
      username: string
      authKind: 'jwt' | 'first-party-delegation'
    }
  | {
      kind: 'AGENT'
      userId: number
      username: string
      agentProfileId: number
      agentName: string
      credentialId: number
      authKind: 'agent-credential'
    }

type ThreadRow = {
  id: number
  createdAt: Date
  updatedAt: Date
  humanUserId: number
  agentProfileId: number
  humanUsername: string | null
  humanDisplayName: string | null
  humanAvatarImage: string | null
  agentName: string | null
  agentAvatarImage: string | null
}

type ThreadSummaryRow = ThreadRow & {
  lastMessageAt: Date | null
  lastMessagePreview: string | null
  lastSenderKind: string | null
  unreadCount: bigint | number
}

type MessageRow = {
  id: number
  createdAt: Date
  threadId: number
  senderKind: string
  senderUserId: number
  senderAgentProfileId: number | null
  credentialId: number | null
  clientKey: string
  body: string
  readAt: Date | null
}

type RawExecutor = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be text.` })
  }
  const text = value.trim()
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

export function parseAgentMessageInput(input: {
  body?: unknown
  clientKey?: unknown
}) {
  return {
    body: requiredText(input.body, 'body', MESSAGE_BODY_LIMIT),
    clientKey: requiredText(input.clientKey, 'clientKey', CLIENT_KEY_LIMIT),
  }
}

export function parseAgentMessagePositiveId(value: unknown, field: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, message: `${field} must be a positive integer.` })
  }
  return parsed
}

export function parseAgentMessageListLimit(value: unknown): number {
  if (value === undefined || value === null || value === '') return MESSAGE_LIST_DEFAULT
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MESSAGE_LIST_MAX) {
    throw createError({
      statusCode: 400,
      message: `limit must be an integer from 1 to ${MESSAGE_LIST_MAX}.`,
    })
  }
  return parsed
}

function humanAuthAllowed(auth: AuthGuardResult): auth is AuthGuardResult & {
  kind: 'jwt' | 'first-party-delegation'
} {
  if (auth.kind === 'jwt') return true
  return (
    auth.kind === 'first-party-delegation' &&
    auth.clientId === RAINBOW_FIRST_PARTY_CLIENT_ID
  )
}

export async function requireAgentMessageActor(event: H3Event): Promise<AgentMessageActor> {
  const auth = await requireApiUser(event)

  if (auth.kind === 'agent-credential') {
    if (!authHasScope(auth, 'agent:message')) {
      throw createError({
        statusCode: 403,
        message: 'This credential is not authorized for scope "agent:message".',
      })
    }
    if (!auth.agentProfileId || !auth.credentialId) {
      throw createError({
        statusCode: 403,
        message: 'Agent messaging requires a persistent credential bound to an AgentProfile.',
      })
    }

    const profile = await prisma.agentProfile.findUnique({
      where: { id: auth.agentProfileId },
      select: { id: true, userId: true, name: true, isActive: true },
    })
    if (!profile || !profile.isActive || profile.userId !== auth.user.id) {
      throw createError({ statusCode: 403, message: 'This AgentProfile is not active.' })
    }

    return {
      kind: 'AGENT',
      userId: auth.user.id,
      username: auth.user.username,
      agentProfileId: profile.id,
      agentName: profile.name,
      credentialId: auth.credentialId,
      authKind: 'agent-credential',
    }
  }

  if (!humanAuthAllowed(auth)) {
    throw createError({
      statusCode: 403,
      message: 'Agent messaging requires a signed-in human or Rainbow first-party session.',
    })
  }

  return {
    kind: 'HUMAN',
    userId: auth.user.id,
    username: auth.user.username,
    authKind: auth.kind,
  }
}

function cleanupMessageWindows(now: number) {
  if (messageWindows.size < MESSAGE_WINDOW_CLEANUP_THRESHOLD) return
  for (const [key, window] of messageWindows) {
    if (now - window.startedAt >= MESSAGE_WINDOW_MS) messageWindows.delete(key)
  }
}

export function assertAgentMessageRateAllowed(event: H3Event, actor: AgentMessageActor) {
  const key =
    actor.kind === 'HUMAN'
      ? `human:${actor.userId}`
      : `agent:${actor.agentProfileId}:credential:${actor.credentialId}`
  const now = Date.now()
  cleanupMessageWindows(now)
  const existing = messageWindows.get(key)

  if (!existing || now - existing.startedAt >= MESSAGE_WINDOW_MS) {
    messageWindows.set(key, { startedAt: now, count: 1 })
    return
  }

  if (existing.count >= MESSAGE_WINDOW_LIMIT) {
    const retryAfter = Math.max(
      1,
      Math.ceil((existing.startedAt + MESSAGE_WINDOW_MS - now) / 1000),
    )
    setHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Agent messaging rate limit exceeded. Try again later.',
    })
  }

  existing.count += 1
}

async function requireHumanMessagingOptIn(userId: number) {
  const [preference, user] = await Promise.all([
    getRainbowDirectoryPreference(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        designerName: true,
        avatarImage: true,
        isActive: true,
        isGuest: true,
        isRestricted: true,
      },
    }),
  ])

  if (
    !user ||
    !user.isActive ||
    user.isGuest ||
    user.isRestricted ||
    !preference.isPublic ||
    !preference.allowMessages
  ) {
    throw createError({
      statusCode: 403,
      message: 'This human is not accepting Rainbow messages.',
    })
  }

  return user
}

async function requireAgentMessagingOptIn(agentProfileId: number) {
  const profile = await prisma.agentProfile.findUnique({
    where: { id: agentProfileId },
    select: {
      id: true,
      userId: true,
      name: true,
      avatarImage: true,
      isPublic: true,
      allowMessages: true,
      isActive: true,
    },
  })

  if (!profile || !profile.isActive || !profile.isPublic || !profile.allowMessages) {
    throw createError({
      statusCode: 403,
      message: 'This AgentProfile is not accepting Rainbow messages.',
    })
  }

  const owner = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { isActive: true, isRestricted: true },
  })
  if (!owner || !owner.isActive || owner.isRestricted) {
    throw createError({
      statusCode: 403,
      message: 'This AgentProfile is not accepting Rainbow messages.',
    })
  }

  return profile
}

async function requirePairCanMessage(humanUserId: number, agentProfileId: number) {
  const [human, agent] = await Promise.all([
    requireHumanMessagingOptIn(humanUserId),
    requireAgentMessagingOptIn(agentProfileId),
  ])
  return { human, agent }
}

function serializeThread(row: ThreadRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    human: {
      id: row.humanUserId,
      username: row.humanUsername,
      displayName: row.humanDisplayName,
      avatarImage: row.humanAvatarImage,
    },
    agent: {
      id: row.agentProfileId,
      name: row.agentName,
      avatarImage: row.agentAvatarImage,
    },
  }
}

function serializeMessage(row: MessageRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    senderKind: row.senderKind === 'AGENT' ? ('AGENT' as const) : ('HUMAN' as const),
    senderUserId: row.senderUserId,
    senderAgentProfileId: row.senderAgentProfileId,
    body: row.body,
    readAt: row.readAt,
    delivery: 'stored' as const,
  }
}

async function findThreadById(executor: RawExecutor, threadId: number): Promise<ThreadRow | null> {
  const rows = await executor.$queryRaw<ThreadRow[]>(Prisma.sql`
    SELECT
      t.id, t.createdAt, t.updatedAt, t.humanUserId, t.agentProfileId,
      u.username AS humanUsername,
      u.designerName AS humanDisplayName,
      u.avatarImage AS humanAvatarImage,
      p.name AS agentName,
      p.avatarImage AS agentAvatarImage
    FROM AgentMessageThread t
    LEFT JOIN User u ON u.id = t.humanUserId
    LEFT JOIN AgentProfile p ON p.id = t.agentProfileId
    WHERE t.id = ${threadId}
    LIMIT 1
  `)
  return rows[0] ?? null
}

function assertThreadActor(row: ThreadRow, actor: AgentMessageActor) {
  const allowed =
    actor.kind === 'HUMAN'
      ? row.humanUserId === actor.userId
      : row.agentProfileId === actor.agentProfileId
  if (!allowed) {
    throw createError({ statusCode: 404, message: 'Message thread not found.' })
  }
}

export async function requireAgentMessageThread(threadId: number, actor: AgentMessageActor) {
  const row = await findThreadById(prisma, threadId)
  if (!row) throw createError({ statusCode: 404, message: 'Message thread not found.' })
  assertThreadActor(row, actor)
  return row
}

async function getOrCreateThread(
  executor: RawExecutor,
  humanUserId: number,
  agentProfileId: number,
): Promise<ThreadRow> {
  await executor.$executeRaw(Prisma.sql`
    INSERT INTO AgentMessageThread (humanUserId, agentProfileId)
    VALUES (${humanUserId}, ${agentProfileId})
    ON DUPLICATE KEY UPDATE id = id
  `)

  const rows = await executor.$queryRaw<ThreadRow[]>(Prisma.sql`
    SELECT
      t.id, t.createdAt, t.updatedAt, t.humanUserId, t.agentProfileId,
      u.username AS humanUsername,
      u.designerName AS humanDisplayName,
      u.avatarImage AS humanAvatarImage,
      p.name AS agentName,
      p.avatarImage AS agentAvatarImage
    FROM AgentMessageThread t
    LEFT JOIN User u ON u.id = t.humanUserId
    LEFT JOIN AgentProfile p ON p.id = t.agentProfileId
    WHERE t.humanUserId = ${humanUserId}
      AND t.agentProfileId = ${agentProfileId}
    LIMIT 1
  `)

  const row = rows[0]
  if (!row) {
    throw createError({ statusCode: 500, message: 'Message thread could not be created.' })
  }
  return row
}

async function findMessageByClientKey(
  executor: RawExecutor,
  threadId: number,
  senderKind: AgentMessageActor['kind'],
  clientKey: string,
): Promise<MessageRow | null> {
  const rows = await executor.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT
      id, createdAt, threadId, senderKind, senderUserId,
      senderAgentProfileId, credentialId, clientKey, body, readAt
    FROM AgentMessage
    WHERE threadId = ${threadId}
      AND senderKind = ${senderKind}
      AND clientKey = ${clientKey}
    LIMIT 1
  `)
  return rows[0] ?? null
}

async function persistMessage(input: {
  actor: AgentMessageActor
  thread: ThreadRow
  body: string
  clientKey: string
}) {
  return await prisma.$transaction(async (tx) => {
    const existing = await findMessageByClientKey(
      tx,
      input.thread.id,
      input.actor.kind,
      input.clientKey,
    )
    if (existing) return { message: existing, created: false }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO AgentMessage (
        threadId, senderKind, senderUserId, senderAgentProfileId,
        credentialId, clientKey, body
      ) VALUES (
        ${input.thread.id},
        ${input.actor.kind},
        ${input.actor.userId},
        ${input.actor.kind === 'AGENT' ? input.actor.agentProfileId : null},
        ${input.actor.kind === 'AGENT' ? input.actor.credentialId : null},
        ${input.clientKey},
        ${input.body}
      )
      ON DUPLICATE KEY UPDATE id = id
    `)

    await tx.$executeRaw(Prisma.sql`
      UPDATE AgentMessageThread
      SET updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id = ${input.thread.id}
    `)

    const message = await findMessageByClientKey(
      tx,
      input.thread.id,
      input.actor.kind,
      input.clientKey,
    )
    if (!message) {
      throw createError({ statusCode: 500, message: 'Message could not be persisted.' })
    }
    return { message, created: true }
  })
}

export async function sendInitialAgentMessage(input: {
  actor: AgentMessageActor
  humanUserId?: number
  agentProfileId?: number
  body: string
  clientKey: string
}) {
  const humanUserId =
    input.actor.kind === 'HUMAN'
      ? input.actor.userId
      : parseAgentMessagePositiveId(input.humanUserId, 'humanUserId')
  const agentProfileId =
    input.actor.kind === 'AGENT'
      ? input.actor.agentProfileId
      : parseAgentMessagePositiveId(input.agentProfileId, 'agentProfileId')

  if (input.actor.kind === 'AGENT' && input.actor.userId === humanUserId) {
    // Messaging your own operator is allowed, but only when that human has
    // explicitly opted into the public Rainbow messaging surface too.
  }

  await requirePairCanMessage(humanUserId, agentProfileId)
  const thread = await getOrCreateThread(prisma, humanUserId, agentProfileId)
  assertThreadActor(thread, input.actor)
  const result = await persistMessage({
    actor: input.actor,
    thread,
    body: input.body,
    clientKey: input.clientKey,
  })

  return {
    thread: serializeThread(thread),
    message: serializeMessage(result.message),
    created: result.created,
  }
}

export async function sendAgentMessageInThread(input: {
  actor: AgentMessageActor
  threadId: number
  body: string
  clientKey: string
}) {
  const thread = await requireAgentMessageThread(input.threadId, input.actor)
  await requirePairCanMessage(thread.humanUserId, thread.agentProfileId)
  const result = await persistMessage({
    actor: input.actor,
    thread,
    body: input.body,
    clientKey: input.clientKey,
  })
  return {
    thread: serializeThread(thread),
    message: serializeMessage(result.message),
    created: result.created,
  }
}

export async function listAgentMessageThreads(actor: AgentMessageActor) {
  const actorId = actor.kind === 'HUMAN' ? actor.userId : actor.agentProfileId
  const rows = await prisma.$queryRaw<ThreadSummaryRow[]>(Prisma.sql`
    SELECT
      t.id, t.createdAt, t.updatedAt, t.humanUserId, t.agentProfileId,
      u.username AS humanUsername,
      u.designerName AS humanDisplayName,
      u.avatarImage AS humanAvatarImage,
      p.name AS agentName,
      p.avatarImage AS agentAvatarImage,
      (
        SELECT m.createdAt
        FROM AgentMessage m
        WHERE m.threadId = t.id
        ORDER BY m.id DESC
        LIMIT 1
      ) AS lastMessageAt,
      (
        SELECT LEFT(m.body, 240)
        FROM AgentMessage m
        WHERE m.threadId = t.id
        ORDER BY m.id DESC
        LIMIT 1
      ) AS lastMessagePreview,
      (
        SELECT m.senderKind
        FROM AgentMessage m
        WHERE m.threadId = t.id
        ORDER BY m.id DESC
        LIMIT 1
      ) AS lastSenderKind,
      (
        SELECT COUNT(*)
        FROM AgentMessage m
        WHERE m.threadId = t.id
          AND m.readAt IS NULL
          AND m.senderKind <> ${actor.kind}
      ) AS unreadCount
    FROM AgentMessageThread t
    LEFT JOIN User u ON u.id = t.humanUserId
    LEFT JOIN AgentProfile p ON p.id = t.agentProfileId
    WHERE ${actor.kind === 'HUMAN' ? Prisma.sql`t.humanUserId = ${actorId}` : Prisma.sql`t.agentProfileId = ${actorId}`}
    ORDER BY COALESCE(lastMessageAt, t.updatedAt) DESC, t.id DESC
    LIMIT ${THREAD_LIST_LIMIT}
  `)

  return rows.map((row) => ({
    ...serializeThread(row),
    lastMessageAt: row.lastMessageAt,
    lastMessagePreview: row.lastMessagePreview,
    lastSenderKind:
      row.lastSenderKind === 'AGENT'
        ? ('AGENT' as const)
        : row.lastSenderKind === 'HUMAN'
          ? ('HUMAN' as const)
          : null,
    unreadCount: Number(row.unreadCount || 0),
  }))
}

export async function listAgentMessages(input: {
  actor: AgentMessageActor
  threadId: number
  limit: number
  beforeId?: number | null
}) {
  const thread = await requireAgentMessageThread(input.threadId, input.actor)
  const beforeId = input.beforeId ?? null
  const rows = await prisma.$queryRaw<MessageRow[]>(Prisma.sql`
    SELECT
      id, createdAt, threadId, senderKind, senderUserId,
      senderAgentProfileId, credentialId, clientKey, body, readAt
    FROM AgentMessage
    WHERE threadId = ${thread.id}
      AND (${beforeId} IS NULL OR id < ${beforeId})
    ORDER BY id DESC
    LIMIT ${input.limit}
  `)

  const chronological = [...rows].reverse()
  return {
    thread: serializeThread(thread),
    messages: chronological.map(serializeMessage),
    page: {
      nextBeforeId: rows.length === input.limit ? rows[rows.length - 1]?.id ?? null : null,
    },
  }
}

export async function markAgentMessageThreadRead(input: {
  actor: AgentMessageActor
  threadId: number
}) {
  const thread = await requireAgentMessageThread(input.threadId, input.actor)
  const updated = await prisma.$executeRaw(Prisma.sql`
    UPDATE AgentMessage
    SET readAt = CURRENT_TIMESTAMP(3)
    WHERE threadId = ${thread.id}
      AND readAt IS NULL
      AND senderKind <> ${input.actor.kind}
  `)
  return {
    thread: serializeThread(thread),
    markedRead: Number(updated),
  }
}
