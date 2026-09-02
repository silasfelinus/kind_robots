import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'Allow', 'POST')
  event.node.res.statusCode = 405
  return {
    error: 'This stateless MCP endpoint does not expose an SSE listen stream. Use POST.',
  }
})
