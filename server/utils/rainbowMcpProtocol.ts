export const MODERN_MCP_PROTOCOL_VERSION = '2026-07-28' as const
export const LEGACY_MCP_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18'] as const
export const SUPPORTED_MCP_PROTOCOL_VERSIONS = [
  MODERN_MCP_PROTOCOL_VERSION,
  ...LEGACY_MCP_PROTOCOL_VERSIONS,
] as const

export const MCP_PROTOCOL_META_KEY = 'io.modelcontextprotocol/protocolVersion'
export const MCP_CLIENT_CAPABILITIES_META_KEY =
  'io.modelcontextprotocol/clientCapabilities'
export const MCP_SERVER_INFO_META_KEY = 'io.modelcontextprotocol/serverInfo'

const PUBLIC_MCP_ORIGINS = new Set([
  'https://kindrobots.org',
  'https://www.kindrobots.org',
  'https://rainbowbutterflies.org',
  'https://www.rainbowbutterflies.org',
])

export type RainbowMcpRequest = {
  jsonrpc?: unknown
  id?: unknown
  method?: unknown
  params?: unknown
}

export type RainbowMcpHeaders = {
  protocolVersion?: string
  method?: string
  name?: string
}

export type RainbowMcpProtocolError = {
  statusCode: number
  code: number
  message: string
  data?: unknown
}

export function isMcpObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isKnownMcpProtocolVersion(value: string): boolean {
  return (SUPPORTED_MCP_PROTOCOL_VERSIONS as readonly string[]).includes(value)
}

export function isAllowedMcpOrigin(
  origin: string | undefined,
  production = true,
): boolean {
  if (!origin) return true
  if (PUBLIC_MCP_ORIGINS.has(origin)) return true
  if (production) return false

  try {
    const parsed = new URL(origin)
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    )
  } catch {
    return false
  }
}

export function requestClaimsModernMcp(
  request: RainbowMcpRequest,
  headers: RainbowMcpHeaders,
): boolean {
  const params = isMcpObject(request.params) ? request.params : null
  const meta = params && isMcpObject(params._meta) ? params._meta : null
  return (
    request.method === 'server/discover' ||
    headers.protocolVersion === MODERN_MCP_PROTOCOL_VERSION ||
    meta?.[MCP_PROTOCOL_META_KEY] === MODERN_MCP_PROTOCOL_VERSION
  )
}

export function validateModernMcpRequest(
  request: RainbowMcpRequest,
  headers: RainbowMcpHeaders,
): RainbowMcpProtocolError | null {
  if (headers.protocolVersion !== MODERN_MCP_PROTOCOL_VERSION) {
    if (headers.protocolVersion) {
      return {
        statusCode: 400,
        code: -32022,
        message: `Unsupported MCP protocol version "${headers.protocolVersion}".`,
        data: {
          requested: headers.protocolVersion,
          supported: [...SUPPORTED_MCP_PROTOCOL_VERSIONS],
        },
      }
    }
    return {
      statusCode: 400,
      code: -32020,
      message: `MCP-Protocol-Version must be ${MODERN_MCP_PROTOCOL_VERSION}.`,
    }
  }

  if (typeof request.method !== 'string' || headers.method !== request.method) {
    return {
      statusCode: 400,
      code: -32020,
      message: 'Mcp-Method must match the JSON-RPC method.',
    }
  }

  const params = isMcpObject(request.params) ? request.params : null
  const meta = params && isMcpObject(params._meta) ? params._meta : null
  if (meta?.[MCP_PROTOCOL_META_KEY] !== MODERN_MCP_PROTOCOL_VERSION) {
    return {
      statusCode: 400,
      code: -32020,
      message: 'Request _meta protocolVersion must match MCP-Protocol-Version.',
    }
  }
  if (!isMcpObject(meta?.[MCP_CLIENT_CAPABILITIES_META_KEY])) {
    return {
      statusCode: 400,
      code: -32602,
      message: 'Modern MCP requests require clientCapabilities in params._meta.',
    }
  }

  if (request.method === 'tools/call') {
    const name = typeof params?.name === 'string' ? params.name : ''
    if (!name || headers.name !== name) {
      return {
        statusCode: 400,
        code: -32020,
        message: 'Mcp-Name must match params.name for tools/call.',
      }
    }
  }

  return null
}

export function selectLegacyMcpProtocolVersion(value: unknown): string {
  if (
    typeof value === 'string' &&
    (LEGACY_MCP_PROTOCOL_VERSIONS as readonly string[]).includes(value)
  ) {
    return value
  }
  return LEGACY_MCP_PROTOCOL_VERSIONS[0]
}

export function isLegacyMcpNotification(request: RainbowMcpRequest): boolean {
  return (
    request.jsonrpc === '2.0' &&
    request.id === undefined &&
    request.method === 'notifications/initialized'
  )
}
