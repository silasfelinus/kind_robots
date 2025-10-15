// path: server/api/chatgpt/actions.ts
// summary: ChatGPT-facing actions using H3-native validation + your auth

import { PrismaClient } from '@prisma/client'
import { createError } from 'h3'
import {
  validateShape, expectString, expectNumber, expectRecord, optional, badRequest
} from './validate'
import { ensureSession, ChatGPTSessionInfo } from './authAdapter'

const prisma = new PrismaClient()

type Ctx = { session: ChatGPTSessionInfo }
type Action = (input: any, ctx: Ctx) => Promise<any>

const actions: Record<string, Action> = {}

const WRITEABLE = new Set([
  'Art','ArtImage','ArtCollection','Bot','Character','Chat',
  'Component','Dominion','Gallery','Pitch','Prompt','Reaction',
  'Resource','Reward','Scenario','SmartIcon','Tag','Theme'
])

function delegateFor(model: string) {
  // @ts-ignore
  const d = (prisma as any)[model]
  if (!d) throw createError({ statusCode: 400, statusMessage: `Unknown model: ${model}` })
  return d
}

// ---- Session bootstrap (auth) ----------------------------------------------
actions['kr.ensure_session'] = async (raw) => {
  const { token, apiKey, registerIfMissing, registerPayload } = validateShape(raw, {
    token: optional(expectString),
    apiKey: optional(expectString),
    registerIfMissing: optional((v: any, f: string) => {
      if (typeof v === 'boolean') return v
      if (v === undefined || v === null) return undefined
      const n = Number(v)
      if (Number.isFinite(n)) return !!n
      badRequest(`"${f}" must be boolean or 0/1`)
    }),
    registerPayload: optional(expectRecord)
  })
  const session = await ensureSession({
    token, apiKey,
    registerIfMissing: registerIfMissing ?? false,
    registerPayload
  })
  return { session }
}

// ---- CRUD ------------------------------------------------------------------
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

actions['kr.create_object'] = async (raw, ctx) => {
  const { model, data } = validateShape(raw, { model: expectString, data: expectRecord })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)
  // Optional: stamp ownership if supported
  try {
    if ('userId' in (data as any) || 'userId' in (d as any)) {
      ;(data as any).userId ??= ctx.session.userId
    }
  } catch {}
  const created = await d.create({ data })
  return { created }
}

actions['kr.update_object'] = async (raw, ctx) => {
  const { model, id, data } = validateShape(raw, {
    model: expectString,
    id: expectNumber,
    data: expectRecord
  })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)
  // Optional: enforce ownership if your schema supports it
  // await d.findFirstOrThrow({ where: { id, userId: ctx.session.userId }})
  const updated = await d.update({ where: { id }, data })
  return { updated }
}

actions['kr.delete_object'] = async (raw, ctx) => {
  const { model, id } = validateShape(raw, { model: expectString, id: expectNumber })
  if (!WRITEABLE.has(model)) {
    throw createError({ statusCode: 403, statusMessage: `Model not writeable: ${model}` })
  }
  const d = delegateFor(model)
  // Optional: enforce ownership
  // await d.findFirstOrThrow({ where: { id, userId: ctx.session.userId }})
  const deleted = await d.delete({ where: { id } })
  return { deletedId: deleted.id }
}

// ---- Story / Bot (stubs) ---------------------------------------------------
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

// ---- Dispatcher used by the route ------------------------------------------
export async function runAction(
  name: string,
  input: any,
  headers: { authorization?: string; ['x-api-key']?: string }
) {
  let session: ChatGPTSessionInfo | null = null

  if (name !== 'kr.ensure_session') {
    const token = (headers.authorization || '').replace(/^Bearer\s+/i, '') || undefined
    const apiKey = headers['x-api-key'] || undefined
    session = await ensureSession({ token, apiKey, registerIfMissing: false })
  }

  const fn = actions[name]
  if (!fn) throw createError({ statusCode: 400, statusMessage: `Unknown action: ${name}` })

  return fn(
    input ?? {},
    session ?? { userId: 10, token: '', includeSensitive: false, source: 'apiKey' }
  )
}