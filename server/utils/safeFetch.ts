// /server/utils/safeFetch.ts
//
// text-generation/t-005 -- outbound-request wrapper for every route that
// dials a stored Server.baseUrl (or a cloud-provider endpoint derived from
// one). Validates the destination (networkSafety.ts) before dialing and
// again on every redirect hop -- plain `fetch` follows redirects
// automatically with no re-validation, which would let an otherwise-allowed
// destination hand back a 302 to a blocked one and bypass the check
// entirely -- and enforces one connect-timeout budget across the whole call
// (validation + every hop), not a fresh clock per hop, so a malicious/
// misbehaving upstream can't multiply the attacker-controlled stall time by
// chaining redirects that each take just under the timeout.
//
// Response-body size/idle-read enforcement is NOT this module's job: it
// lives in textProviderService.ts (`sendMeteredStream` for streaming
// responses, `readJsonWithSizeCap` for one-shot JSON), since those already
// own the only two places a response body is actually consumed.
import { createError } from 'h3'
import {
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_OUTBOUND_CONNECT_TIMEOUT_MS,
  resolveRedirectLocation,
  validateOutboundUrl,
} from './networkSafety'

export type SafeFetchOptions = {
  connectTimeoutMs?: number
  maxRedirects?: number
  /** External abort signal (e.g. tied to the client disconnecting) merged
   * with this call's own connect-timeout controller via `AbortSignal.any`. */
  signal?: AbortSignal
  /** Passed through to `validateOutboundUrl` on every hop -- see
   * `networkSafety.ts`'s module doc for when this is safe to set (an
   * operator-configured endpoint, not a DB-stored/user-settable one). */
  allowLoopback?: boolean
}

/**
 * Validates `rawUrl` (and every redirect hop it leads to) against
 * `networkSafety.ts`'s blocked-destination rules, then performs the fetch
 * with a connect timeout and a capped, re-validated manual redirect chain.
 * Throws an h3 `createError` (400 for a rejected destination/scheme, 502 for
 * an exhausted redirect budget or unusable Location header, 504 for a
 * timeout) rather than returning a rejected Response, so every call site's
 * existing try/catch → `getErrorStatusCode` handling picks it up unchanged.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit,
  options: SafeFetchOptions = {},
): Promise<Response> {
  const connectTimeoutMs =
    options.connectTimeoutMs ?? DEFAULT_OUTBOUND_CONNECT_TIMEOUT_MS
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS
  const safetyOptions = { allowLoopback: options.allowLoopback ?? false }

  const validated = await validateOutboundUrl(rawUrl, safetyOptions)

  if (!validated.ok) {
    throw createError({
      statusCode: 400,
      message: `Blocked outbound request: ${validated.reason}`,
    })
  }

  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), connectTimeoutMs)
  const signal = options.signal
    ? AbortSignal.any([timeoutController.signal, options.signal])
    : timeoutController.signal

  try {
    let currentUrl = validated.url
    let currentInit: RequestInit = { ...init, redirect: 'manual', signal }
    let redirectsLeft = maxRedirects

    for (;;) {
      let response: Response

      try {
        response = await fetch(currentUrl, currentInit)
      } catch (error) {
        if (timeoutController.signal.aborted) {
          throw createError({
            statusCode: 504,
            message: `Request to ${currentUrl.hostname} timed out after ${connectTimeoutMs}ms.`,
          })
        }

        throw error
      }

      const isRedirect =
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.has('location')

      if (!isRedirect) {
        return response
      }

      if (redirectsLeft <= 0) {
        throw createError({
          statusCode: 502,
          message: `Too many redirects (max ${maxRedirects}) while fetching ${rawUrl}.`,
        })
      }

      const location = response.headers.get('location')
      const nextUrl = resolveRedirectLocation(currentUrl, location)

      if (!nextUrl) {
        throw createError({
          statusCode: 502,
          message: `Redirect from ${currentUrl.href} carried an unusable Location header.`,
        })
      }

      const nextValidated = await validateOutboundUrl(
        nextUrl.href,
        safetyOptions,
      )

      if (!nextValidated.ok) {
        throw createError({
          statusCode: 400,
          message: `Blocked redirect destination: ${nextValidated.reason}`,
        })
      }

      // 301/302/303 downgrade a non-GET/HEAD method to GET and drop the body
      // (matches `fetch`'s own `redirect: 'follow'` semantics); 307/308
      // preserve method and body as-is.
      const downgradeToGet =
        (response.status === 301 ||
          response.status === 302 ||
          response.status === 303) &&
        currentInit.method != null &&
        currentInit.method !== 'GET' &&
        currentInit.method !== 'HEAD'

      currentUrl = nextValidated.url
      currentInit = downgradeToGet
        ? { ...currentInit, method: 'GET', body: undefined }
        : currentInit
      redirectsLeft -= 1
    }
  } finally {
    clearTimeout(timer)
  }
}
