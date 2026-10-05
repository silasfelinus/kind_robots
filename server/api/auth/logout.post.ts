// /server/api/auth/logout.post.ts
//
// Clears the HttpOnly kind-session cookie, which client code cannot touch.
// Without this, logging out left the browser able to load the account's
// private and mature art files until the cookie expired.
import { defineEventHandler } from 'h3'
import { clearKindSessionCookie } from '../../utils/kindSessionCookie'

export default defineEventHandler((event) => {
  clearKindSessionCookie(event)
  return { success: true, message: 'Logged out.' }
})
