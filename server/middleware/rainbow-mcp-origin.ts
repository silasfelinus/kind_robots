import { createError, defineEventHandler, getHeader, getRequestURL } from 'h3'
import { isAllowedMcpOrigin } from '@/server/utils/rainbowMcpProtocol'

export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname !== '/api/v1/mcp') return

  const origin = getHeader(event, 'origin') || undefined
  if (!isAllowedMcpOrigin(origin, process.env.NODE_ENV === 'production')) {
    throw createError({
      statusCode: 403,
      message: 'Origin is not allowed for the Kind Robots MCP endpoint.',
    })
  }
})
