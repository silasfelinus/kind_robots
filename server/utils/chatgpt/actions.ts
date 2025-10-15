// path: server/utils/chatgpt/actions.ts
// summary: ChatGPT-facing actions, authenticated via ensureSession()

import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { ensureSession, ChatGPTSessionInfo } from '~/server/utils/chatgpt/authAdapter'

const prisma = new PrismaClient()

type Ctx = { session: ChatGPTSessionInfo }

type ActionSpec<I, O> = {
  name: string
  input: z.ZodType<I>
  run: (input: I, ctx: Ctx) => Promise<O>
  description?: string
}

const actions: Record<string, ActionSpec<any, any>> = {}

function addAction<I, O>(spec: ActionSpec<I, O>) { actions[spec.name] = spec }
function delegateFor(model: string) {
  // @ts-ignore
  const d = (prisma as any)[model]
  if (!d) throw new Error(`Unknown model: ${model}`)
  return d
}

const WRITEABLE = new Set([
  'Art','ArtImage','ArtCollection','Bot','Character','Chat',
  'Component','Dominion','Gallery','Pitch','Prompt','Reaction',
  'Resource','Reward','Scenario','SmartIcon','Tag','Theme'
])

// ---------- Session bootstrap (auth) ----------
addAction({
  name: 'kr.ensure_session',
  description: 'Validate existing token or auto-register a new user',
  input: z.object({
    token: z.string().optional(),
    userIdHint: z.number().optional(),
    registerIfMissing: z.boolean().default(true),
    registerPayload: z.record(z.any()).optional()
  }),
  run: async (inp) => {
    const session = await ensureSession(inp)
    return { session }
  }
})

// ---------- CRUD ----------
addAction({
  name: 'kr.list_objects',
  description: 'List records (paged) for a model',
  input: z.object({
    model: z.string(),
    page: z.number().int().default(1),
    pageSize: z.number().int().default(20),
    where: z.any().optional()
  }),
  run: async ({ model, page, pageSize, where }) => {
    const d = delegateFor(model)
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      d.findMany({ where, skip, take: pageSize, orderBy: { id: 'desc' } }),
      d.count({ where })
    ])
    return { items, page, pageSize, total }
  }
})

addAction({
  name: 'kr.create_object',
  description: 'Create record for a writeable model',
  input: z.object({ model: z.string(), data: z.record(z.any()) }),
  run: async ({ model, data }, ctx) => {
    if (!WRITEABLE.has(model)) throw new Error(`Model not writeable: ${model}`)
    // Example: if you enforce row ownership, attach userId here:
    if ('userId' in (await prisma[model].fields ?? {})) {
      // optional: only if your model has userId
      ;(data as any).userId = ctx.session.userId
    }
    const d = delegateFor(model)
    const created = await d.create({ data })
    return { created }
  }
})

addAction({
  name: 'kr.update_object',
  description: 'Update record by id',
  input: z.object({
    model: z.string(),
    id: z.union([z.string(), z.number()]),
    data: z.record(z.any())
  }),
  run: async ({ model, id, data }, ctx) => {
    if (!WRITEABLE.has(model)) throw new Error(`Model not writeable: ${model}`)
    const key = typeof id === 'string' ? Number(id) : id
    const d = delegateFor(model)
    // Optional: enforce ownership check, if present
    // await d.findFirstOrThrow({ where: { id: key, userId: ctx.session.userId }})
    const updated = await d.update({ where: { id: key }, data })
    return { updated }
  }
})

addAction({
  name: 'kr.delete_object',
  description: 'Delete record by id',
  input: z.object({ model: z.string(), id: z.union([z.string(), z.number()]) }),
  run: async ({ model, id }, ctx) => {
    if (!WRITEABLE.has(model)) throw new Error(`Model not writeable: ${model}`)
    const key = typeof id === 'string' ? Number(id) : id
    const d = delegateFor(model)
    // Optional: enforce ownership check
    // await d.findFirstOrThrow({ where: { id: key, userId: ctx.session.userId }})
    const deleted = await d.delete({ where: { id: key } })
    return { deletedId: deleted.id }
  }
})

// ---------- Story / Bot (call your endpoints or Prisma as needed) ----------
addAction({
  name: 'kr.story_start',
  description: 'Start a Story Mode session',
  input: z.object({ seed: z.string().optional() }),
  run: async ({ seed }, ctx) => {
    // If you already have a story start route, call it here with ctx.session
    // Example stub:
    return { sessionId: `story_${Date.now()}`, userId: ctx.session.userId, seed: seed ?? null }
  }
})

addAction({
  name: 'kr.story_continue',
  description: 'Advance Story Mode',
  input: z.object({ sessionId: z.string(), choice: z.string().optional() }),
  run: async ({ sessionId, choice }) => ({
    sessionId, text: `Narrative advances… choice=${choice ?? '—'}`
  })
})

addAction({
  name: 'kr.bot_chat',
  description: 'Send a message to a bot and get a reply',
  input: z.object({ botId: z.number(), message: z.string() }),
  run: async ({ botId, message }, ctx) => ({
    botId, reply: `Bot(${botId}) says: hello about "${message}" for user ${ctx.session.userId}`
  })
})

export async function runAction(name: string, input: any, ctxHeaders: { authorization?: string }) {
  // Every call requires a valid session; bootstrap first
  const token = (ctxHeaders.authorization || '').replace(/^Bearer\s+/i, '') || undefined
  const session = await ensureSession({ token, registerIfMissing: false })
  const spec = actions[name]
  if (!spec) throw new Error(`Unknown action: ${name}`)
  const parsed = spec.input.safeParse(input || {})
  if (!parsed.success) throw new Error(`Invalid input for ${name}: ${JSON.stringify(parsed.error.flatten())}`)
  return spec.run(parsed.data, { session })
}