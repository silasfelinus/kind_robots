// path: server/utils/chatgpt/actions.ts
// summary: ChatGPT-facing actions using H3-native validation

import { PrismaClient } from '@prisma/client'
import { createError } from 'h3'
import {
  validateShape, expectString, expectNumber, expectRecord, optional
} from '~/server/utils/validate'
import { ensureSession, ChatGPTSessionInfo } from '~/server/utils/chatgpt/authAdapter'

const prisma = new PrismaClient()

type Ctx = { session: ChatGPTSessionInfo }
type Action = (input: any, ctx: Ctx) => Promise<any>

const actions: Record<string, Action> = {}

// if you want stricter control, tune this set
const WRITEABLE = new Set([
  'Art','ArtImage','ArtCollection','Bot','Character','Chat',
  'Component','Dominion','Gallery','Pitch','Prompt','Reaction',
  'Resource','Reward','Scenario','SmartIcon','Tag','Theme'
])

function delegateFor(model: string) {
  // @ts-ignore
  const d = (prisma as any)[model]
  if (!d) {
    throw createError({ statusCode: 400, statusMessage: `Unknown model: ${model}` })
  }
  return d
}

// session bootstrap (validate or create)
actions['kr.ensure_session'] = async (raw) => {
  const { token, registerIfMissing, registerPayload } = validateShape(raw, {
    token: optional(expectString),
    registerIfMissing: optional(expectNumber), // allows 0/1 in raw JSON
    registerPayload: optional(expectRecord)
  })
  const allowRegister = Boolean(registerIfMissing ?? 1)
  const session = await ensureSession({
    token,
    registerIfMissing: allowRegister,
    registerPayload
  })
  return { session }
}

// list
actions['kr.list_objects'] = async (raw) => {
  const { model, page, pageSize, where } = validateShape(raw, {
    model: expectString,
    page: optional(expectNumber),
    pageSize: optional(expectNumber),
    where: optional(expectRecord)
  })
  const p = page ?? 1
  const ps = pageSize ?? 20
  const skip = (p - 1) * ps
  const d = delegateFor(model)
  const [items, total] = await Promise.all([
    d.findMany({ where, skip, take: ps, orderBy: { id: 'desc' } }),
    d.count({ where })
  ])
  return { items, page: p, pageSize: ps, total }
}

// create
actions['kr.create_object'] = async (raw, ctx) => {
  const { model, data } = validateShape(raw, {
    model: expectString,
    data: expectRecord
  })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)

  // optional ownership stamp if model supports it
  try {
    if ('userId' in (await (d as any).fields ?? {})) {
      ;(data as any).userId = ctx.session.userId
    }
  } catch {
    // ignore capability check errors
  }

  const created = await d.create({ data })
  return { created }
}

// update
actions['kr.update_object'] = async (raw) => {
  const { model, id, data } = validateShape(raw, {
    model: expectString,
    id: expectNumber,
    data: expectRecord
  })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)
  const updated = await d.update({ where: { id }, data })
  return { updated }
}

// delete
actions['kr.delete_object'] = async (raw) => {
  const { model, id } = validateShape(raw, {
    model: expectString,
    id: expectNumber
  })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)
  const deleted = await d.delete({ where: { id } })
  return { deletedId: deleted.id }
}

// story stubs (wire these to your real endpoints later)
actions['kr.story_start'] = async (raw, ctx) => {
  const { seed } = validateShape(raw, { seed: optional(expectString) })
  return { sessionId: `story_${Date.now()}`, userId: ctx.session.userId, seed: seed ?? null }
}

actions['kr.story_continue'] = async (raw) => {
  const { sessionId, choice } = validateShape(raw, {
    sessionId: expectString,
    choice: optional(expectString)
  })
  return { sessionId, text: `Narrative advances… choice=${choice ?? '—'}` }
}

actions['kr.bot_chat'] = async (raw, ctx) => {
  const { botId, message } = validateShape(raw, {
    botId: expectNumber,
    message: expectString
  })
  return { botId, reply: `Bot(${botId}) says: hello about "${message}" for user ${ctx.session.userId}` }
}

export async function runAction(
  name: string,
  input: any,
  headers: { authorization?: string }
) {
  // require a valid session on all calls except explicit kr.ensure_session
  let session: ChatGPTSessionInfo | null = null

  if (name !== 'kr.ensure_session') {
    const token = (headers.authorization || '').replace(/^Bearer\s+/i, '') || undefined
    session = await ensureSession({ token, registerIfMissing: false })
  }

  const fn = actions[name]
  if (!fn) {
    throw createError({ statusCode: 400, statusMessage: `Unknown action: ${name}` })
  }
  return fn(input ?? {}, session ? { session } : ({ session: { userId: 10, token: '', includeSensitive: false } as ChatGPTSessionInfo }))
}