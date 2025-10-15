// path: server/api/chatgpt/actions.post.ts
import { defineEventHandler, readBody, getRequestHeader, setResponseStatus } from 'h3'
import { runAction } from '~/server/utils/chatgpt/actions'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const auth = getRequestHeader(event, 'authorization') || ''
    const { action, input } = body || {}

    if (!action) {
      setResponseStatus(event, 400)
      return { ok: false, error: 'Missing "action"' }
    }
    const output = await runAction(action, input ?? {}, { authorization: auth })
    return { ok: true, action, output }
  } catch (err: any) {
    setResponseStatus(event, /Invalid input|Unknown action/i.test(String(err)) ? 400 : 500)
    return { ok: false, error: String(err?.message || err) }
  }
})