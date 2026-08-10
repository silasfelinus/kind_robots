import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from 'h3'
import type {
  BrainstormBatchShape,
  BrainstormGeneratePayload,
  BrainstormGenerateRequest,
  BrainstormReferenceCandidate,
  BrainstormReturnTypeId,
  BrainstormReturnTypeRequest,
  BrainstormSourceRef,
} from '../../../types/brainstorm'
import {
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
  BRAINSTORM_RETURN_TYPES,
} from '../../../types/brainstorm'
import { errorHandler } from '../../utils/error'
import { manaGate } from '../../utils/manaGate'
import { estimateTextCostUsd } from '../../utils/manaCost'
import {
  canReadServer,
  readServerById,
  requireAuthUser,
} from '../../utils/serverApi'
import {
  deriveSuggestProvider,
  resolveSuggestModel,
  str,
} from '../../utils/suggest/suggestProviders'
import type {
  SuggestProvider,
  SuggestServerSnapshot,
} from '../../utils/suggest/suggestTypes'
import { parseBrainstormProviderOutput } from '../../utils/brainstorm/brainstormParser'
import { buildBrainstormPrompts } from '../../utils/brainstorm/brainstormPrompt'
import {
  brainstormProviderApiKey,
  callBrainstormProvider,
} from '../../utils/brainstorm/brainstormProvider'

const MAX_PREMISE_LENGTH = 12_000
const MAX_CONSTRAINT_LENGTH = 8_000
const MAX_EXAMPLE_LENGTH = 4_000
const MAX_EXAMPLES = 20
const MAX_MODE_LENGTH = 80
const MAX_FEEDBACK_LENGTH = 4_000
const RETURN_TYPE_IDS = new Set<BrainstormReturnTypeId>(
  BRAINSTORM_RETURN_TYPES.map((entry) => entry.id),
)

function requiredText(value: unknown, label: string, maxLength: number): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    throw createError({ statusCode: 400, message: `${label} is required.` })
  }
  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${label} must be ${maxLength} characters or fewer.`,
    })
  }
  return text
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!text) return undefined
  return text.slice(0, maxLength)
}

function requestedCount(value: unknown): number {
  const count = Number(value)
  if (
    !Number.isInteger(count) ||
    count < BRAINSTORM_MIN_RESULTS ||
    count > BRAINSTORM_MAX_RESULTS
  ) {
    throw createError({
      statusCode: 400,
      message: `count must be an integer from ${BRAINSTORM_MIN_RESULTS} to ${BRAINSTORM_MAX_RESULTS}.`,
    })
  }
  return count
}

function normalizedExamples(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of value.slice(0, MAX_EXAMPLES)) {
    const example = optionalText(item, MAX_EXAMPLE_LENGTH)
    if (!example || seen.has(example)) continue
    seen.add(example)
    result.push(example)
  }

  return result
}

function normalizedSource(value: unknown): BrainstormSourceRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const modelType = optionalText(record.modelType, 80)
  const id = Number(record.id)
  const slug = optionalText(record.slug, 160)
  const intent = optionalText(record.intent, 1_000)

  if (!modelType) return null

  return {
    modelType,
    ...(Number.isInteger(id) && id > 0 ? { id } : {}),
    ...(slug ? { slug } : {}),
    ...(intent ? { intent } : {}),
  }
}

function normalizedReference(
  value: unknown,
): BrainstormReferenceCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const text = optionalText(record.text, 8_000)
  const title = optionalText(record.title, 120)

  if (!text) return null
  return {
    text,
    ...(title ? { title } : {}),
  }
}

function normalizedBatchShape(value: unknown): BrainstormBatchShape {
  return value === 'assortment' ? 'assortment' : 'focused'
}

function normalizedReturnTypes(
  value: unknown,
  batchShape: BrainstormBatchShape,
  count: number,
): BrainstormReturnTypeRequest[] {
  if (batchShape !== 'assortment' || !Array.isArray(value)) return []

  const result: BrainstormReturnTypeRequest[] = []
  const seen = new Set<BrainstormReturnTypeId>()

  for (const raw of value.slice(0, BRAINSTORM_RETURN_TYPES.length)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const record = raw as Record<string, unknown>
    const id = optionalText(record.id, 80) as BrainstormReturnTypeId | undefined
    if (!id || !RETURN_TYPE_IDS.has(id) || seen.has(id)) continue

    const parsedCount = Number(record.count)
    const quota =
      Number.isInteger(parsedCount) && parsedCount > 0
        ? Math.min(BRAINSTORM_MAX_RESULTS, parsedCount)
        : undefined
    result.push({ id, ...(quota ? { count: quota } : {}) })
    seen.add(id)
  }

  const minimumRequired = result.reduce(
    (total, entry) => total + (entry.count ?? 1),
    0,
  )
  if (minimumRequired > count) {
    throw createError({
      statusCode: 400,
      message: `The selected response mix requires at least ${minimumRequired} ideas, but count is ${count}.`,
    })
  }

  return result
}

function normalizeRequest(body: BrainstormGeneratePayload): BrainstormGenerateRequest {
  const count = requestedCount(body.count)
  const batchShape = normalizedBatchShape(body.batchShape)

  return {
    premise: requiredText(body.premise, 'premise', MAX_PREMISE_LENGTH),
    count,
    constraints: optionalText(body.constraints, MAX_CONSTRAINT_LENGTH),
    examples: normalizedExamples(body.examples),
    mode: optionalText(body.mode, MAX_MODE_LENGTH) || 'freeform',
    batchShape,
    returnTypes: normalizedReturnTypes(body.returnTypes, batchShape, count),
    source: normalizedSource(body.source),
    replaceCandidateId: optionalText(body.replaceCandidateId, 200) || null,
    parentCandidateId: optionalText(body.parentCandidateId, 200) || null,
    referenceCandidate: normalizedReference(body.referenceCandidate),
    feedback: optionalText(body.feedback, MAX_FEEDBACK_LENGTH),
  }
}

function requiredServerId(body: BrainstormGeneratePayload): number {
  const id = Number(body.server?.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid text server is required for Brainstorm generation.',
    })
  }
  return id
}

function textCompatibleServer(server: {
  category?: string | null
  serverType?: string | null
}): boolean {
  const category = str(server.category).toLowerCase()
  if (category) return category === 'text' || category === 'chat'

  return ['OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM'].includes(
    str(server.serverType).toUpperCase(),
  )
}

function assertBackendProviderAccess(
  provider: SuggestProvider,
  server: {
    accessMode?: string | null
    baseUrl?: string | null
    isPublic?: boolean
    isOfficial?: boolean
    isDefault?: boolean
    label?: string | null
    title?: string | null
  },
  viewer: { isAdmin?: boolean },
): void {
  if (provider === 'openai' || provider === 'anthropic') return

  const accessMode = str(server.accessMode).toUpperCase()
  if (['BROWSER', 'TAILSCALE', 'LOCAL'].includes(accessMode)) {
    throw createError({
      statusCode: 503,
      message: `${server.label || server.title || 'The selected text server'} is configured for ${accessMode.toLowerCase()} access and cannot be called safely from the Brainstorm backend. Choose a backend/public text server.`,
    })
  }

  if (
    !viewer.isAdmin &&
    !server.isPublic &&
    !server.isOfficial &&
    !server.isDefault
  ) {
    throw createError({
      statusCode: 403,
      message:
        'Private custom text servers are not callable from the Brainstorm backend. Use an approved backend/public server.',
    })
  }

  const baseUrl = str(server.baseUrl)
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'The selected text server does not have a valid URL.',
    })
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError({
      statusCode: 400,
      message: 'Brainstorm text servers must use HTTP or HTTPS.',
    })
  }
}

function completionBudget(count: number): number {
  return Math.min(6_000, Math.max(512, 256 + count * 180))
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BrainstormGeneratePayload>(event)
    const request = normalizeRequest(body)
    const serverId = requiredServerId(body)

    const viewer = await requireAuthUser(event)
    const server = await readServerById(serverId)

    if (!canReadServer(server, viewer)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have access to the selected text server.',
      })
    }

    if (!textCompatibleServer(server)) {
      throw createError({
        statusCode: 400,
        message: 'The selected server is not configured for text generation.',
      })
    }

    const serverSnapshot: SuggestServerSnapshot = {
      id: server.id,
      serverType: server.serverType,
      baseUrl: server.baseUrl,
      endpointPath: server.endpointPath,
      model: server.model,
    }
    const provider = deriveSuggestProvider(serverSnapshot)
    assertBackendProviderAccess(provider, server, viewer)

    const model = resolveSuggestModel(provider, server.model)
    const maxTokens = completionBudget(request.count)

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({ model, maxTokens }),
      serverId: server.id,
    })

    const config = useRuntimeConfig()
    const { systemPrompt, userPrompt } = buildBrainstormPrompts(request)

    console.log('[brainstorm:generate]', {
      provider,
      model,
      serverId: server.id,
      count: request.count,
      mode: request.mode,
      batchShape: request.batchShape,
      returnTypes: request.returnTypes,
      replacement: Boolean(request.replaceCandidateId),
      branch: Boolean(request.parentCandidateId),
    })

    const raw = await callBrainstormProvider(systemPrompt, userPrompt, {
      provider,
      model,
      count: request.count,
      maxTokens,
      apiKey: brainstormProviderApiKey(provider, {
        serverApiKey: server.apiKey,
        anthropicApiKey: config.anthropicApiKey,
        openaiApiKey: config.openaiApiKey,
      }),
      baseUrl:
        provider === 'ollama'
          ? str(server.baseUrl, str(config.ollamaBaseUrl, 'http://localhost:11434'))
          : provider === 'openai_compatible'
            ? str(server.baseUrl)
            : undefined,
      endpointPath:
        provider === 'openai_compatible'
          ? str(server.endpointPath, '/v1/chat/completions')
          : undefined,
    })

    if (!raw.trim()) {
      throw createError({
        statusCode: 502,
        message: 'The selected text server returned an empty Brainstorm response.',
      })
    }

    const parsed = parseBrainstormProviderOutput(raw, request.count, request)
    if (!parsed) {
      throw createError({
        statusCode: 502,
        message:
          'The selected text server returned an incomplete, duplicate, malformed, or response-mix-invalid Brainstorm batch.',
      })
    }

    const { balance } = await gate.commit(`brainstorm:${Date.now()}`)

    return {
      success: true,
      message: `Generated ${parsed.candidates.length} Brainstorm candidate${parsed.candidates.length === 1 ? '' : 's'}.`,
      data: parsed,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)

    return {
      success: false,
      message: handled.message || 'Brainstorm generation failed.',
      statusCode: handled.statusCode || 500,
      data: { candidates: [] },
    }
  }
})
