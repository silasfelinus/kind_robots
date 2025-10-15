// path: server/api/chatgpt/index.post.ts
// summary: entrypoint for ChatGPT actions (Nuxt/Nitro API)
import {
  defineEventHandler,
  readBody,
  getRequestHeader,
  setResponseStatus,
} from 'h3'
import { validateShape, expectString, optional, expectRecord } from './validate'
import { runAction } from './actions'

export default defineEventHandler(async (event) => {
  try {
    const envelope = await readBody(event)
    const { action, input } = validateShape(envelope, {
      action: expectString,
      input: optional(expectRecord),
    })

    const auth = getRequestHeader(event, 'authorization') || ''
    const apiKey = getRequestHeader(event, 'x-api-key') || ''
    const output = await runAction(action, input ?? {}, {
      authorization: auth,
      'x-api-key': apiKey,
    })

    return { ok: true, action, output }
  } catch (err: any) {
    const code = err?.statusCode || 500
    setResponseStatus(event, code)
    return {
      ok: false,
      error: String(err?.statusMessage || err?.message || err),
    }
  }
})
