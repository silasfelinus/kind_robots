// /server/utils/chatRooms.ts
//
// Shared live group chat. Reading and posting need a signed-in human account
// that is not maturity-restricted (child accounts never join open rooms with
// strangers). Blocks are honored both ways. Posting is rate limited, and
// authors or admins can hide a message. Clients poll; there is no socket.
import { createError, getRouterParam, type H3Event } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { isMaturityRestricted } from '~/server/utils/contentAccess'
import {
  CHAT_MESSAGE_MAX,
  CHAT_PAGE_SIZE,
  chatRoomBySlug,
  cleanChatBody,
} from '~/utils/community/rooms'

const BURST_MS = 4000
const MINUTE_LIMIT = 12

export async function requireChatMember(event: H3Event) {
  const auth = await requireHumanApiUser(event)
  if (isMaturityRestricted(auth.user)) {
    throw createError({
      statusCode: 403,
      message: 'Group chat is for adult accounts.',
    })
  }
  return auth
}

export async function roomFromEvent(event: H3Event) {
  const spec = chatRoomBySlug(getRouterParam(event, 'slug') ?? '')
  if (!spec) throw createError({ statusCode: 404, message: 'Unknown room.' })
  const room = await prisma.chatRoom.upsert({
    where: { slug: spec.slug },
    create: {
      slug: spec.slug,
      projectSlug: spec.projectSlug,
      title: spec.title,
    },
    update: {},
  })
  return { spec, room }
}

async function blockedUserIds(userId: number): Promise<number[]> {
  const rows = await prisma.userRelation.findMany({
    where: {
      type: 'BLOCK',
      OR: [{ userId }, { relatedUserId: userId }],
    },
    select: { userId: true, relatedUserId: true },
  })
  return rows.map((row) =>
    row.userId === userId ? row.relatedUserId : row.userId,
  )
}

export async function listRoomMessages(
  roomId: number,
  viewer: { id: number; isAdmin: boolean },
  afterId: number | null,
) {
  const blocked = await blockedUserIds(viewer.id)
  const rows = await prisma.chatRoomMessage.findMany({
    where: {
      roomId,
      ...(afterId ? { id: { gt: afterId } } : {}),
      ...(viewer.isAdmin ? {} : { hiddenAt: null }),
      ...(blocked.length ? { userId: { notIn: blocked } } : {}),
    },
    orderBy: { id: afterId ? 'asc' : 'desc' },
    take: CHAT_PAGE_SIZE,
  })
  const messages = afterId ? rows : rows.reverse()
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(messages.map((m) => m.userId))] } },
    select: { id: true, username: true, designerName: true },
  })
  const byId = new Map(users.map((user) => [user.id, user]))
  return messages.map((message) => {
    const author = byId.get(message.userId)
    return {
      id: message.id,
      userId: message.userId,
      author: author?.designerName || author?.username || 'Someone',
      body: message.hiddenAt ? '' : message.body,
      hidden: Boolean(message.hiddenAt),
      mine: message.userId === viewer.id,
      createdAt: message.createdAt.toISOString(),
    }
  })
}

export async function postRoomMessage(
  roomId: number,
  userId: number,
  raw: unknown,
) {
  const body = cleanChatBody(raw)
  if (!body)
    throw createError({ statusCode: 400, message: 'Say something first.' })
  if (body.length > CHAT_MESSAGE_MAX) {
    throw createError({
      statusCode: 400,
      message: `Keep messages under ${CHAT_MESSAGE_MAX} characters.`,
    })
  }
  const since = new Date(Date.now() - 60000)
  const recent = await prisma.chatRoomMessage.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { body: true, createdAt: true },
    orderBy: { id: 'desc' },
  })
  const last = recent[0]
  if (last && Date.now() - last.createdAt.getTime() < BURST_MS) {
    throw createError({ statusCode: 429, message: 'Slow down a little.' })
  }
  if (recent.length >= MINUTE_LIMIT) {
    throw createError({
      statusCode: 429,
      message: 'That is a lot of messages. Take a breath and try again soon.',
    })
  }
  if (recent.some((entry) => entry.body === body)) {
    throw createError({ statusCode: 429, message: 'You just said that.' })
  }
  return prisma.chatRoomMessage.create({ data: { roomId, userId, body } })
}

export async function hideRoomMessage(
  messageId: number,
  viewer: { id: number; isAdmin: boolean },
) {
  const message = await prisma.chatRoomMessage.findUnique({
    where: { id: messageId },
    select: { id: true, userId: true, hiddenAt: true },
  })
  if (!message)
    throw createError({ statusCode: 404, message: 'Message not found.' })
  if (message.userId !== viewer.id && !viewer.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'You can only remove your own messages.',
    })
  }
  if (message.hiddenAt) return message
  return prisma.chatRoomMessage.update({
    where: { id: messageId },
    data: { hiddenAt: new Date(), hiddenById: viewer.id },
  })
}
