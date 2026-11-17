import { createError, setHeader, type H3Event } from 'h3'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { isSuperkateServicesViewer } from '~/stores/helpers/superkateNavigation'

export async function requireK8Viewer(
  event: H3Event,
  writing = false,
): Promise<{ readonly: boolean }> {
  const auth = await requireHumanApiUser(event)
  if (
    auth.isServerKey ||
    auth.user.isGuest ||
    !isSuperkateServicesViewer(auth.user, auth.isAdmin)
  ) {
    throw createError({ statusCode: 403, message: 'K8 account required.' })
  }
  if (writing && auth.isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Administrator preview cannot modify trading settings.',
    })
  }
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { readonly: auth.isAdmin }
}

export async function forwardK8Fund(
  path: 'fund' | 'fund/risk' | 'fund/levels',
  method: 'GET' | 'PUT',
  body?: { level: number; fingerprint: string; overrides?: object | null },
): Promise<Record<string, unknown>> {
  const token = process.env.K8_BRIDGE_TOKEN || ''
  if (token.length < 32) {
    throw createError({
      statusCode: 503,
      message: 'K8 bridge is not configured. Animal preview remains available.',
    })
  }
  const raw = String(useRuntimeConfig().public.k8PortalUrl || '')
  let origin: URL
  try {
    origin = new URL(raw)
  } catch {
    throw createError({ statusCode: 503, message: 'K8 portal URL is invalid.' })
  }
  if (
    origin.protocol !== 'https:' ||
    origin.hostname !== 'critical-mass.acrocatranch.com' ||
    origin.port ||
    origin.username ||
    origin.password
  ) {
    throw createError({
      statusCode: 503,
      message: 'K8 bridge endpoint is not an approved HTTPS host.',
    })
  }

  let response: Response
  try {
    response = await fetch(new URL('/api/k8/' + path, origin), {
      method,
      headers: {
        'x-k8-bridge-token': token,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
      cache: 'no-store',
    })
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Critical Mass is unreachable. No settings were changed.',
    })
  }
  const data: unknown = await response.json().catch(() => null)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw createError({
      statusCode: 502,
      message: 'Critical Mass returned an invalid response.',
    })
  }
  const result = data as Record<string, unknown>
  if (!response.ok || result.success !== true) {
    throw createError({
      statusCode: response.status === 409 ? 409 : 502,
      message:
        typeof result.error === 'string'
          ? result.error
          : 'Critical Mass rejected the K8 request.',
    })
  }
  return result
}
