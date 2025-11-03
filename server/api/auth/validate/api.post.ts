// /server/api/auth/validate/api.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKeyString } from '../../utils/validateKey'

function extractApiKeyFromReq(event: any): string | undefined {
  const headers = event.node.req.headers || {}

  // Authorization: Bearer <key>
  const auth = headers['authorization']
  const bearer =
    typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : undefined

  // x-api-key
  const xKey = (headers['x-api-key'] ||
    headers['x_api_key'] ||
    headers['x-apikey']) as string | undefined

  // ?apiKey=...
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const queryKey = url.searchParams.get('apiKey') || undefined

  return bearer || xKey || queryKey
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody<{ apiKey?: string }>(event)) || {}
    const supplied = body.apiKey || extractApiKeyFromReq(event)

    const result = await validateApiKeyString(supplied)

    return {
      success: result.isValid,
      message: result.isValid ? 'API key is valid.' : 'Invalid API key.',
      data: result.isValid
        ? {
            kind: result.kind ?? 'user',
            user: result.user ?? null,
          }
        : null,
    }
  } catch (err) {
    const { message, statusCode } = errorHandler(err)
    return { success: false, message, statusCode }
  }
})
