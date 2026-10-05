// /server/utils/kindSessionCookie.ts
//
// The HttpOnly `kind-session` cookie: the browser-sent proof of who is logged
// in, for requests that cannot carry the Authorization header the API uses --
// first-party SSO (firstPartySso.ts) and <img> loads of gated art files
// (server/routes/images). One writer so login and token validation set it
// identically, and one clearer for logout.
import { deleteCookie, setCookie, type H3Event } from 'h3'

export const KIND_SESSION_COOKIE = 'kind-session'

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30

export function setKindSessionCookie(event: H3Event, token: string): void {
  const value = token.trim()
  if (!value) return
  setCookie(event, KIND_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS,
  })
}

export function clearKindSessionCookie(event: H3Event): void {
  deleteCookie(event, KIND_SESSION_COOKIE, { path: '/' })
}
