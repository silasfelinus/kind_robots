// /middleware/navigation-access.global.ts
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useUserStore } from '@/stores/userStore'

/*
 * How long navigation will wait on the user and channel stores before
 * proceeding ungated. Comfortably above a healthy round trip and comfortably
 * below app.vue's 9s loader failsafe, so a degraded backend produces a usable
 * page rather than a race between two deadlines.
 */
const INITIALIZE_TIMEOUT_MS = 4000

const navigationReturnStorageKey = 'kindrobots:navigation-return-to'
const accountPermissions = new Set([
  'authenticated',
  'member',
  'family',
  'mature',
  'admin',
])

function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return ''

  const path = value.trim()
  return path.startsWith('/') && !path.startsWith('//') ? path : ''
}

function storedReturnPath(): string {
  try {
    return safeReturnPath(sessionStorage.getItem(navigationReturnStorageKey))
  } catch {
    return ''
  }
}

function rememberReturnPath(path: string): void {
  try {
    sessionStorage.setItem(navigationReturnStorageKey, path)
  } catch {}
}

function consumeReturnPath(): string {
  const path = storedReturnPath()

  try {
    sessionStorage.removeItem(navigationReturnStorageKey)
  } catch {}

  return path
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const nuxtApp = useNuxtApp()

  async function enforceNavigationAccess() {
    const userStore = useUserStore()
    const channelContentStore = useChannelContentStore()

    /*
     * BOUNDED. On normal client-side navigation this runs before the route
     * resolves, so anything it awaits is on the critical path to the next page.
     * On the initial SSR hydration the block below defers this whole function to
     * app:mounted instead: restoring localStorage-backed identity before Vue has
     * reconciled the server's guest markup changes header v-if branches and
     * produces a real hydration mismatch.
     *
     * Timing out is SAFE, and deliberately so: the access check below opens
     * with `if (!access.matched || access.allowed) return`, and an unpopulated
     * channel list matches nothing. So the degraded outcome is "this middleware
     * declines to gate", never "this middleware locks someone out" or, worse,
     * bounces them to /login while the page underneath is still suspended.
     * Whatever did resolve is kept -- the stores hold their own state, and the
     * losing promise still settles into them for the next navigation.
     */
    await Promise.race([
      Promise.all([userStore.initialize(), channelContentStore.initialize()]),
      new Promise((resolve) => setTimeout(resolve, INITIALIZE_TIMEOUT_MS)),
    ])

    const requestedLoginReturn = safeReturnPath(to.query.redirect)

    if (userStore.isLoggedIn && to.path === '/login' && requestedLoginReturn) {
      return navigateTo(requestedLoginReturn, { replace: true })
    }

    // The existing login page sends successful sessions to /dashboard. Resume a
    // previously denied channel destination from there without coupling the login
    // component to the navigation system.
    if (userStore.isLoggedIn && to.path === '/dashboard') {
      const returnPath = consumeReturnPath()

      if (returnPath && returnPath !== to.fullPath) {
        return navigateTo(returnPath, { replace: true })
      }
    }

    const requestedTab =
      typeof to.query.tab === 'string' ? to.query.tab.trim() : ''
    const access = evaluateNavigationRouteAccess(
      channelContentStore.channels,
      channelContentStore.visibleChannels,
      {
        path: to.path,
        tabKey: requestedTab,
      },
    )

    // Routes outside the content navigation graph are not this middleware's job.
    if (!access.matched || access.allowed) return

    const requiresAccount =
      Boolean(access.requiredRole && access.requiredRole !== 'GUEST') ||
      accountPermissions.has(access.requiredPermission.toLowerCase())

    if (!userStore.isLoggedIn && requiresAccount && to.path !== '/login') {
      rememberReturnPath(to.fullPath)

      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
        replace: true,
      })
    }

    // Avoid an impossible redirect loop if Home is ever accidentally gated.
    if (to.path === '/') return

    return navigateTo({
      path: '/',
      query: {
        access: 'denied',
      },
      replace: true,
    })
  }

  /*
   * Nuxt executes global route middleware twice for an SSR first load: once on
   * the server, then again in the browser before hydration. This middleware is
   * intentionally client-only because the session token lives in localStorage,
   * but that means the browser pass must NOT restore user state until the server
   * DOM has been hydrated. Nuxt documents this exact isHydrating/serverRendered
   * guard for initial client middleware.
   *
   * We still run the access check immediately after app:mounted so direct loads
   * of protected routes keep the same redirect behavior; only the timing moves.
   */
  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    nuxtApp.hook('app:mounted', () => {
      void nuxtApp.runWithContext(enforceNavigationAccess)
    })
    return
  }

  return enforceNavigationAccess()
})
