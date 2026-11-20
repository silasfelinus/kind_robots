/**
 * Signed-in sessions for real-browser audits of account-gated routes
 * (conductor slime-city/t-069).
 *
 * /play/slime-city needs an account: an anonymous browser is sent to /login a
 * beat after hydration, so an audit that measures the game must sign in first.
 * A session comes from, in order:
 *
 *   --storage-state <file>   a Playwright storage-state file saved from a
 *                            signed-in QA browser. Keep it outside the repo.
 *   KR_AUDIT_USERNAME and KR_AUDIT_PASSWORD   an ordinary, non-admin account.
 *                            The audit signs in through /api/auth/login, the
 *                            same call the login page makes.
 *
 * With neither, resolveAuditSession returns null and the caller decides
 * whether that is a skip or a failure. Nothing here prints a credential.
 */

/** Playwright storage state that the SPA's userStore reads as a session. */
export function storageStateForToken(base, token) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(base).origin,
        localStorage: [
          { name: 'token', value: token },
          { name: 'stayLoggedIn', value: 'true' },
        ],
      },
    ],
  }
}

function tokenFrom(body) {
  const token = body?.token ?? body?.data?.token
  return typeof token === 'string' && token.length > 0 ? token : null
}

/**
 * @returns {Promise<null | { storageState: string | object, source: string }>}
 */
export async function resolveAuditSession({
  base,
  storageStatePath,
  env = process.env,
  fetchImpl = fetch,
}) {
  if (storageStatePath)
    return { storageState: storageStatePath, source: 'storage-state file' }

  const username = env.KR_AUDIT_USERNAME
  const password = env.KR_AUDIT_PASSWORD
  if (!username || !password) return null

  const response = await fetchImpl(
    base.replace(/\/$/, '') + '/api/auth/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    },
  )
  let body
  try {
    body = await response.json()
  } catch {
    body = null
  }
  const token = tokenFrom(body)
  if (!response.ok || !token)
    // Status only: the body can echo the username, and never the password.
    throw new Error(
      'AUDIT_LOGIN_FAILED: /api/auth/login answered ' +
        response.status +
        ' for the audit account.',
    )
  return {
    storageState: storageStateForToken(base, token),
    source: 'audit account',
  }
}

/** Throws SIGNED_OUT when the account gate sent the page to /login. */
export function assertSignedIn(page) {
  if (new URL(page.url()).pathname === '/login')
    throw new Error(
      'SIGNED_OUT: the route redirected to /login. Re-run with ' +
        '--storage-state <signed-in QA state file>, or set ' +
        'KR_AUDIT_USERNAME and KR_AUDIT_PASSWORD.',
    )
}

/**
 * Load an account-gated route and wait until it is clear whether the gate let
 * the browser through. The gate can fire a beat after hydration, so a
 * signed-out run waits long enough to see the redirect instead of racing it.
 */
export async function openGatedRoute(page, url, readySelector, signedIn) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page
    .waitForFunction(
      (selector) =>
        location.pathname === '/login' || document.querySelector(selector),
      readySelector,
      { timeout: 30000 },
    )
    .catch(() => {})
  await page.waitForTimeout(signedIn ? 500 : 4000)
  assertSignedIn(page)
  await page.locator(readySelector).first().waitFor({ timeout: 30000 })
  await waitForBootCover(page)
}

/**
 * The site's boot cover and loading overlay sit above the page with
 * pointer-events: none, so clicks and DOM measurements work through them but
 * a screenshot shows the loader, not the page. Wait until both are gone.
 */
export async function waitForBootCover(page) {
  await page.waitForFunction(
    () => !document.querySelector('.kr-boot-cover, .loading-overlay'),
    null,
    { timeout: 45000 },
  )
}

/**
 * Two site-wide dialogs can land on top of a game at any moment: the
 * first-launch walkthrough a new account gets a beat after it loads, and the
 * achievement pop-up, which blocks the page until it is acknowledged.
 * Locator handlers let Playwright clear each one whenever it appears, instead
 * of racing them with one-off checks. Both dismissals persist on the account.
 */
export async function dismissSiteDialogs(page) {
  const skip = page.getByRole('button', { name: /^skip$/i })
  await page.addLocatorHandler(skip, async () => {
    await skip.first().click()
  })
  const thanks = page
    .locator('[aria-labelledby="achievement-popup"]')
    .getByRole('button')
  await page.addLocatorHandler(thanks, async () => {
    await thanks.first().click()
  })
}

/**
 * Browser options for sandboxes that reach the site through an intercepting
 * HTTPS proxy, or that ship their own Chromium build. Opt in with
 * --proxy <url> / AUDIT_PROXY and AUDIT_CHROMIUM=<executable>; CI sets none.
 */
export function auditBrowserOptions(proxy, env = process.env) {
  const launch = { args: ['--no-sandbox'] }
  if (env.AUDIT_CHROMIUM) launch.executablePath = env.AUDIT_CHROMIUM
  if (!proxy) return { launch, context: {} }
  return {
    launch: { ...launch, proxy: { server: proxy } },
    context: { ignoreHTTPSErrors: true },
  }
}
