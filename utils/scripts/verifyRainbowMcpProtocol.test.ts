import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  isKnownMcpProtocolVersion,
  isLegacyMcpNotification,
  MODERN_MCP_PROTOCOL_VERSION,
  requestClaimsModernMcp,
  selectLegacyMcpProtocolVersion,
  SUPPORTED_MCP_PROTOCOL_VERSIONS,
  validateModernMcpRequest,
  type RainbowMcpHeaders,
  type RainbowMcpRequest,
} from '../../server/utils/rainbowMcpProtocol'

function modernRequest(
  method: string,
  extraParams: Record<string, unknown> = {},
): RainbowMcpRequest {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params: {
      ...extraParams,
      _meta: {
        'io.modelcontextprotocol/protocolVersion': MODERN_MCP_PROTOCOL_VERSION,
        'io.modelcontextprotocol/clientCapabilities': {},
        'io.modelcontextprotocol/clientInfo': {
          name: 'contract-test',
          version: '1.0.0',
        },
      },
    },
  }
}

function modernHeaders(method: string, name?: string): RainbowMcpHeaders {
  return {
    protocolVersion: MODERN_MCP_PROTOCOL_VERSION,
    method,
    ...(name ? { name } : {}),
  }
}

assert.deepEqual([...SUPPORTED_MCP_PROTOCOL_VERSIONS], [
  '2026-07-28',
  '2025-11-25',
  '2025-06-18',
])
assert.equal(isKnownMcpProtocolVersion('2026-07-28'), true)
assert.equal(isKnownMcpProtocolVersion('2025-11-25'), true)
assert.equal(isKnownMcpProtocolVersion('2099-01-01'), false)

const listRequest = modernRequest('tools/list')
assert.equal(requestClaimsModernMcp(listRequest, modernHeaders('tools/list')), true)
assert.equal(validateModernMcpRequest(listRequest, modernHeaders('tools/list')), null)

const callRequest = modernRequest('tools/call', {
  name: 'rainbow_check_in',
  arguments: { status: 'working' },
})
assert.equal(
  validateModernMcpRequest(
    callRequest,
    modernHeaders('tools/call', 'rainbow_check_in'),
  ),
  null,
)

assert.equal(
  validateModernMcpRequest(listRequest, { method: 'tools/list' })?.code,
  -32020,
  'modern POSTs must not silently accept a missing MCP-Protocol-Version header',
)
assert.equal(
  validateModernMcpRequest(listRequest, {
    protocolVersion: MODERN_MCP_PROTOCOL_VERSION,
    method: 'tools/call',
  })?.code,
  -32020,
  'Mcp-Method must agree with the JSON-RPC body',
)
assert.equal(
  validateModernMcpRequest(callRequest, modernHeaders('tools/call', 'wrong_tool'))
    ?.code,
  -32020,
  'Mcp-Name must agree with params.name',
)
assert.equal(
  validateModernMcpRequest(callRequest, {
    protocolVersion: '2099-01-01',
    method: 'tools/call',
    name: 'rainbow_check_in',
  })?.code,
  -32022,
)

const missingCapabilities = modernRequest('tools/list')
;(missingCapabilities.params as Record<string, unknown>)._meta = {
  'io.modelcontextprotocol/protocolVersion': MODERN_MCP_PROTOCOL_VERSION,
}
assert.equal(
  validateModernMcpRequest(missingCapabilities, modernHeaders('tools/list'))?.code,
  -32602,
)

assert.equal(selectLegacyMcpProtocolVersion('2025-11-25'), '2025-11-25')
assert.equal(selectLegacyMcpProtocolVersion('2025-06-18'), '2025-06-18')
assert.equal(selectLegacyMcpProtocolVersion('2024-01-01'), '2025-11-25')
assert.equal(
  isLegacyMcpNotification({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }),
  true,
)
assert.equal(
  requestClaimsModernMcp(
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    {},
  ),
  false,
)

const route = readFileSync('server/api/v1/mcp.post.ts', 'utf8')
const runtime = readFileSync('server/utils/agentProfileRuntime.ts', 'utf8')
const checkInRoute = readFileSync('server/api/v1/agent/check-in.post.ts', 'utf8')

const toolNames = Array.from(
  route.matchAll(/const TOOL_[A-Z_]+ = '([^']+)'/g),
  (match) => match[1],
).sort()
assert.deepEqual(toolNames, ['rainbow_agent_identity', 'rainbow_check_in'])

assert.match(route, /request\.method === 'server\/discover'/)
assert.match(route, /request\.method === 'initialize'/)
assert.match(route, /isLegacyMcpNotification\(request\)/)
assert.match(route, /request\.method === 'tools\/list'/)
assert.match(route, /request\.method === 'tools\/call'/)
assert.match(route, /requireBoundAgentProfile\(event, 'profile:read'\)/)
assert.match(route, /requireBoundAgentProfile\(event, 'agent:checkin'\)/)
assert.match(route, /assertAgentCheckInRateAllowed\(event, context\.auth\.credentialId\)/)
assert.match(route, /structuredContent: value/)
assert.match(route, /content: \[\{ type: 'text', text: toolText\(value\) \}\]/)
assert.match(route, /Object\.keys\(getQuery\(event\)\)\.length/)
assert.match(route, /query-string credentials/)
assert.match(route, /WWW-Authenticate/)
assert.doesNotMatch(route, /fetch\(|\$fetch\(/)
assert.doesNotMatch(route, /agentCredential\.create|agent-credentials|generation:art|forum:write/)
assert.doesNotMatch(route, /console\.log|console\.error|authorization.*log/i)

assert.match(runtime, /requireScopedApiUser\(event, scope\)/)
assert.match(runtime, /auth\.kind !== 'agent-credential'/)
assert.match(runtime, /profile\.userId !== auth\.user\.id/)
assert.match(runtime, /trimmed\.length > 5000/)
assert.match(runtime, /CHECKIN_WINDOW_LIMIT = 30/)
assert.match(runtime, /Retry-After/)
assert.match(runtime, /claimResolvedAgentAttentionRequests/)
assert.match(checkInRoute, /recordAgentCheckIn/)
assert.match(route, /recordAgentCheckIn/)

console.log('Rainbow MCP protocol + two-tool allowlist contract OK')
