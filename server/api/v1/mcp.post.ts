import {
  defineEventHandler,
  getHeader,
  getQuery,
  readBody,
  setHeader,
  type H3Event,
} from 'h3'
import { errorHandler } from '@/server/utils/error'
import {
  assertAgentCheckInRateAllowed,
  parseAgentCheckInInput,
  recordAgentCheckIn,
  requireBoundAgentProfile,
  serializeAgentIdentity,
} from '@/server/utils/agentProfileRuntime'
import {
  isKnownMcpProtocolVersion,
  isLegacyMcpNotification,
  isMcpObject,
  MCP_SERVER_INFO_META_KEY,
  MODERN_MCP_PROTOCOL_VERSION,
  requestClaimsModernMcp,
  selectLegacyMcpProtocolVersion,
  SUPPORTED_MCP_PROTOCOL_VERSIONS,
  validateModernMcpRequest,
  type RainbowMcpHeaders,
  type RainbowMcpRequest,
} from '@/server/utils/rainbowMcpProtocol'

const SERVER_INFO = { name: 'kind-robots-rainbow-agent', version: '1.0.0' } as const
const TOOL_IDENTITY = 'rainbow_agent_identity'
const TOOL_CHECK_IN = 'rainbow_check_in'

const tools = [
  {
    name: TOOL_IDENTITY,
    title: 'Rainbow Agent Identity',
    description:
      'Read the AgentProfile bound to this credential, its operator identity, granted scopes, and capability flags. Requires profile:read. This tool never returns the credential secret.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      additionalProperties: true,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: TOOL_CHECK_IN,
    title: 'Rainbow Agent Check-in',
    description:
      'Record a heartbeat for the AgentProfile bound to this credential and receive queued human notes, resolved attention requests, and bounded working context. Forum conversation context is included only when forum:read is granted. Requires agent:checkin.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['idle', 'working', 'blocked', 'completed'],
          description: 'Optional current agent status.',
        },
        summary: {
          type: 'string',
          maxLength: 5000,
          description: 'Optional concise progress or blocker summary.',
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      additionalProperties: true,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
] as const

type RpcError = {
  code: number
  message: string
  data?: unknown
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id, result }
}

function rpcError(id: unknown, error: RpcError) {
  return { jsonrpc: '2.0', id: id ?? null, error }
}

function modernMeta() {
  return { [MCP_SERVER_INFO_META_KEY]: SERVER_INFO }
}

function modernResult<T extends Record<string, unknown>>(result: T): T & { _meta: object } {
  return { ...result, _meta: modernMeta() }
}

function headersFor(event: H3Event): RainbowMcpHeaders {
  return {
    protocolVersion: getHeader(event, 'mcp-protocol-version') || undefined,
    method: getHeader(event, 'mcp-method') || undefined,
    name: getHeader(event, 'mcp-name') || undefined,
  }
}

function unsupportedVersion(event: H3Event, id: unknown, requested: string) {
  event.node.res.statusCode = 400
  return rpcError(id, {
    code: -32022,
    message: `Unsupported MCP protocol version "${requested}".`,
    data: { requested, supported: [...SUPPORTED_MCP_PROTOCOL_VERSIONS] },
  })
}

function validateArguments(value: unknown) {
  if (value === undefined) return {}
  if (!isMcpObject(value)) {
    throw new Error('Tool arguments must be a JSON object.')
  }
  return value
}

function toolText(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function toolResult(value: Record<string, unknown>, modern: boolean) {
  const result = {
    ...(modern ? { resultType: 'complete' } : {}),
    content: [{ type: 'text', text: toolText(value) }],
    structuredContent: value,
    isError: false,
  }
  return modern ? modernResult(result) : result
}

function toolError(message: string, modern: boolean) {
  const result = {
    ...(modern ? { resultType: 'complete' } : {}),
    content: [{ type: 'text', text: message }],
    isError: true,
  }
  return modern ? modernResult(result) : result
}

async function callTool(
  event: H3Event,
  name: string,
  args: Record<string, unknown>,
  modern: boolean,
) {
  if (name === TOOL_IDENTITY) {
    if (Object.keys(args).length) {
      return toolError('rainbow_agent_identity does not accept arguments.', modern)
    }
    const context = await requireBoundAgentProfile(event, 'profile:read')
    return toolResult(serializeAgentIdentity(context), modern)
  }

  if (name === TOOL_CHECK_IN) {
    const unknownKeys = Object.keys(args).filter((key) => !['status', 'summary'].includes(key))
    if (unknownKeys.length) {
      return toolError(`Unknown check-in field: ${unknownKeys.join(', ')}.`, modern)
    }
    const context = await requireBoundAgentProfile(event, 'agent:checkin')
    const input = parseAgentCheckInInput(args)
    assertAgentCheckInRateAllowed(event, context.auth.credentialId)
    return toolResult(await recordAgentCheckIn({ context, ...input }), modern)
  }

  return null
}

function authRpcError(event: H3Event, id: unknown, error: unknown) {
  const handled = errorHandler(error)
  const statusCode = handled.statusCode || 500
  event.node.res.statusCode = statusCode
  if (statusCode === 401) {
    setHeader(event, 'WWW-Authenticate', 'Bearer realm="Kind Robots AgentProfile"')
  }
  return rpcError(id, {
    code: -32000,
    message: handled.message || 'MCP tool execution failed.',
  })
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Vary', 'Authorization, MCP-Protocol-Version')

  if (Object.keys(getQuery(event)).length) {
    event.node.res.statusCode = 400
    return rpcError(null, {
      code: -32600,
      message: 'The MCP endpoint does not accept query parameters or query-string credentials.',
    })
  }

  const contentType = getHeader(event, 'content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    event.node.res.statusCode = 415
    return rpcError(null, { code: -32600, message: 'Content-Type must be application/json.' })
  }

  let request: RainbowMcpRequest
  try {
    const body = await readBody<unknown>(event)
    if (!isMcpObject(body)) {
      event.node.res.statusCode = 400
      return rpcError(null, { code: -32600, message: 'MCP accepts one JSON-RPC request object.' })
    }
    request = body
  } catch {
    event.node.res.statusCode = 400
    return rpcError(null, { code: -32700, message: 'Invalid JSON.' })
  }

  if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
    event.node.res.statusCode = 400
    return rpcError(request.id, { code: -32600, message: 'Invalid JSON-RPC request.' })
  }

  const headers = headersFor(event)
  if (headers.protocolVersion && !isKnownMcpProtocolVersion(headers.protocolVersion)) {
    return unsupportedVersion(event, request.id, headers.protocolVersion)
  }

  const modern = requestClaimsModernMcp(request, headers)

  if (!modern && isLegacyMcpNotification(request)) {
    event.node.res.statusCode = 202
    return null
  }

  if (request.id === undefined) {
    event.node.res.statusCode = 400
    return rpcError(null, { code: -32600, message: 'MCP requests require a JSON-RPC id.' })
  }

  if (modern) {
    const protocolError = validateModernMcpRequest(request, headers)
    if (protocolError) {
      event.node.res.statusCode = protocolError.statusCode
      return rpcError(request.id, {
        code: protocolError.code,
        message: protocolError.message,
        data: protocolError.data,
      })
    }
  }

  if (!modern && request.method === 'initialize') {
    const params = isMcpObject(request.params) ? request.params : {}
    return rpcResult(request.id, {
      protocolVersion: selectLegacyMcpProtocolVersion(params.protocolVersion),
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
      instructions:
        'This endpoint exposes only Rainbow AgentProfile identity and heartbeat tools. Use a scoped AgentProfile credential; no generic Kind Robots API proxy is available.',
    })
  }

  if (modern && request.method === 'server/discover') {
    return rpcResult(
      request.id,
      modernResult({
        resultType: 'complete',
        supportedVersions: [MODERN_MCP_PROTOCOL_VERSION],
        capabilities: { tools: {} },
        instructions:
          'Two-tool Rainbow AgentProfile bridge: read bound identity/capabilities and submit a heartbeat. Credentials remain in the MCP transport, never in tool arguments.',
        ttlMs: 300_000,
        cacheScope: 'public',
      }),
    )
  }

  if (request.method === 'tools/list') {
    return rpcResult(
      request.id,
      modern
        ? modernResult({
            resultType: 'complete',
            tools,
            ttlMs: 300_000,
            cacheScope: 'public',
          })
        : { tools },
    )
  }

  if (request.method === 'tools/call') {
    const params = isMcpObject(request.params) ? request.params : {}
    const name = typeof params.name === 'string' ? params.name : ''
    if (!name) {
      return rpcResult(request.id, toolError('Tool name is required.', modern))
    }

    let args: Record<string, unknown>
    try {
      args = validateArguments(params.arguments)
    } catch (error) {
      return rpcResult(
        request.id,
        toolError(error instanceof Error ? error.message : 'Invalid tool arguments.', modern),
      )
    }

    try {
      const result = await callTool(event, name, args, modern)
      if (!result) {
        return rpcError(request.id, { code: -32601, message: `Unknown tool "${name}".` })
      }
      return rpcResult(request.id, result)
    } catch (error) {
      const handled = errorHandler(error)
      if ([401, 403, 429].includes(handled.statusCode || 500)) {
        return authRpcError(event, request.id, error)
      }
      return rpcResult(
        request.id,
        toolError(handled.message || 'MCP tool execution failed.', modern),
      )
    }
  }

  if (!modern && request.method === 'ping') {
    return rpcResult(request.id, {})
  }

  return rpcError(request.id, {
    code: -32601,
    message: `Method "${request.method}" is not exposed by this narrow MCP bridge.`,
  })
})