// path: server/api/chatgpt/mcp.post.ts
// summary: ChatGPT MCP-like endpoint that dispatches "actions" by name.
import { defineEventHandler, readBody, getRequestHeader, setResponseStatus } from 'h3'
import { runAction } from '~/server/utils/chatgpt/actions'
import { validateToken } from '~/server/utils/auth/token' // see file 2

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const auth = getRequestHeader(event, 'authorization') || ''
    const user = await validateToken(auth) // returns { userId, isValid, includeSensitive }
    const { action, input } = body || {}

    if (!action) {
      setResponseStatus(event, 400)
      return { ok: false, error: 'Missing "action" in payload' }
    }

    const result = await runAction(action, input ?? {}, { user })
    return { ok: true, action, output: result }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return { ok: false, error: String(err?.message || err) }
  }
})