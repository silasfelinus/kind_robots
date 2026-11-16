/*
 * A gated page (Slime City, the art archive, comic studio...) sends signed-out
 * visitors to /login?redirect=<path>. Without these helpers the login tab was
 * titled "Robots" with no hint of why the visitor landed there.
 */

export const LOGIN_PAGE_TITLE = 'Sign in | Kind Robots'
export const LOGIN_PAGE_DESCRIPTION =
  'Sign in or create a free Kind Robots account to save progress, make art and open member pages.'

/** Same-origin path from ?redirect=, or '' when it is missing or unsafe. */
export function loginRedirectPath(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return ''

  const candidate = raw.trim()
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.length > 2048
  ) {
    return ''
  }

  try {
    const base = 'https://kindrobots.invalid'
    const parsed = new URL(candidate, base)
    if (parsed.origin !== base) return ''
    return parsed.pathname === '/login' ? '' : parsed.pathname
  } catch {
    return ''
  }
}

/** Tab title for a gated destination, e.g. "Sign in to open Slime City". */
export function loginPageTitle(destination: string): string {
  const name = destination.trim()
  return name ? `Sign in to open ${name} | Kind Robots` : LOGIN_PAGE_TITLE
}
