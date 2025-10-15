// path: server/api/chatgpt/actions.post.ts
// summary: entrypoint for ChatGPT actions (Nuxt/Nitro API)

import { defineEventHandler, readBody, getRequestHeader, setResponseStatus } from 'h3'
import { validateShape, expectString, optional, expectRecord } from '~/server/utils/validate'
import { runAction } from '~/server/utils/chatgpt/actions'

export default defineEventHandler(async (event) => {
  try {
    const envelope = await readBody(event)
    const { action, input } = validateShape(envelope, {
      action: expectString,
      input: optional(expectRecord)
    })

    const auth = getRequestHeader(event, 'authorization') || ''
    const output = await runAction(action, input ?? {}, { authorization: auth })

    return { ok: true, action, output }
  } catch (err: any) {
    const code = err?.statusCode || 500
    setResponseStatus(event, code)
    return { ok: false, error: String(err?.statusMessage || err?.message || err) }
  }
})