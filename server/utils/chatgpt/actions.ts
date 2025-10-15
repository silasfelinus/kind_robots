// path: server/utils/chatgpt/actions.ts
// summary: defines ChatGPT-accessible actions with schemas & handlers
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getDMMF } from '@prisma/sdk'
import fs from 'node:fs/promises'
import path from 'node:path'

const prisma = new PrismaClient()

type Ctx = { user: { userId: number; isValid: boolean; includeSensitive: boolean } }
type ActionSpec<I, O> = {
  name: string
  input: z.ZodType<I>
  run: (input: I, ctx: Ctx) => Promise<O>
  description?: string
}

const actions: Record<string, ActionSpec<any, any>> = {}

// ---- helpers ---------------------------------------------------------------
async function prismaModelNames() {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma')
  const datamodel = await fs.readFile(schemaPath, 'utf8')
  const dmmf = await getDMMF({ datamodel })
  return dmmf.datamodel.models.map(m => m.name)
}

async function prismaModelSchema(model: string) {
  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma')
  const datamodel = await fs.readFile(schemaPath, 'utf8')
  const dmmf = await getDMMF({ datamodel })
  const m = dmmf.datamodel.models.find(x => x.name === model)
  if (!m) throw new Error(`Model not found: ${model}`)
  return {
    name: m.name,
    fields: m.fields.map(f => ({
      name: f.name,
      type: typeof f.type === 'string' ? f.type : 'Json',
      kind: f.kind, isList: f.isList, isRequired: f.isRequired,
      isId: !!f.isId, isUnique: !!f.isUnique, default: f.default ?? null
    }))
  }
}

// whitelist writeable models (adjust to taste)
const WRITEABLE = new Set([
  'Art','ArtImage','ArtCollection','Bot','Character','Chat',
  'Component','Dominion','Gallery','Pitch','Prompt','Reaction',
  'Resource','Reward','Scenario','SmartIcon','Tag','Theme'
])

function delegateFor(model: string) {
  // @ts-ignore
  const d = (prisma as any)[model]
  if (!d) throw new Error(`Unknown model: ${model}`)
  return d
}

function addAction<I, O>(spec: ActionSpec<I, O>) {
  actions[spec.name] = spec
}

// ---- actions: meta ---------------------------------------------------------
addAction({
  name: 'kr.list_models',
  description: 'Return all Prisma models (friendly list)',
  input: z.object({}),
  run: async () => ({ models: await prismaModelNames() })
})

addAction({
  name: 'kr.get_model_schema',
  description: 'Return a single model schema with fields & types',
  input: z.object({ model: z.string() }),
  run: async ({ model }) => ({ modelSchema: await prismaModelSchema(model) })
})

// ---- actions: generic CRUD -------------------------------------------------
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
    const delegate = delegateFor(model)
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      delegate.findMany({ where, skip, take: pageSize, orderBy: { id: 'desc' } }),
      delegate.count({ where })
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
    const delegate = delegateFor(model)
    const created = await delegate.create({ data })
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
  run: async ({ model, id, data }) => {
    if (!WRITEABLE.has(model)) throw new Error(`Model not writeable: ${model}`)
    const delegate = delegateFor(model)
    const key = typeof id === 'string' ? Number(id) : id
    const updated = await delegate.update({ where: { id: key }, data })
    return { updated }
  }
})

addAction({
  name: 'kr.delete_object',
  description: 'Delete record by id',
  input: z.object({ model: z.string(), id: z.union([z.string(), z.number()]) }),
  run: async ({ model, id }) => {
    if (!WRITEABLE.has(model)) throw new Error(`Model not writeable: ${model}`)
    const delegate = delegateFor(model)
    const key = typeof id === 'string' ? Number(id) : id
    const deleted = await delegate.delete({ where: { id: key } })
    return { deletedId: deleted.id }
  }
})

// ---- actions: game/story (wire these to your real routes soon) -------------
addAction({
  name: 'kr.story_start',
  description: 'Start a Story Mode session',
  input: z.object({ userId: z.number().default(10), seed: z.string().optional() }),
  run: async ({ userId, seed }) => {
    // TODO: POST to /server/api/story/start if you have it; for now return stub
    return { sessionId: 'demo-session', userId, seed: seed ?? null }
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
  run: async ({ botId, message }) => ({
    botId, reply: `Bot(${botId}) says: hello about "${message}"`
  })
})

// ---- public dispatcher ------------------------------------------------------
export async function runAction(name: string, input: any, ctx: Ctx) {
  const spec = actions[name]
  if (!spec) throw new Error(`Unknown action: ${name}`)
  const parsed = spec.input.safeParse(input || {})
  if (!parsed.success) {
    throw new Error(`Invalid input for ${name}: ` + JSON.stringify(parsed.error.flatten()))
  }
  return spec.run(parsed.data, ctx)
}