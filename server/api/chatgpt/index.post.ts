// /server/api/chatgpt/index.post.ts
import {
  defineEventHandler,
  getRequestHeader,
  readBody,
  setResponseStatus,
} from 'h3'
import {
  expectRecord,
  expectString,
  optional,
  validateShape,
} from './_utils/validate'
import { runPublicAction } from './_utils/actionRunner'

export default defineEventHandler(async (event) => {
  try {
    const envelope = await readBody(event)

    const { action, input } = validateShape(envelope, {
      action: expectString,
      input: optional(expectRecord),
    })

    const authorization = getRequestHeader(event, 'authorization') || ''
    const apiKey = getRequestHeader(event, 'x-api-key') || ''
    const userToken = getRequestHeader(event, 'x-kindrobots-user-token') || ''

    const output = await runPublicAction(action, input ?? {}, {
      authorization,
      'x-api-key': apiKey,
      'x-kindrobots-user-token': userToken,
    })

    return {
      success: true,
      action,
      data: output,
    }
  } catch (error: any) {
    const statusCode = Number(error?.statusCode || error?.status || 500)
    setResponseStatus(event, statusCode)

    return {
      success: false,
      message: String(error?.statusMessage || error?.message || error),
      statusCode,
    }
  }
})
