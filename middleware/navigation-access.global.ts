// /middleware/navigation-access.global.ts
import { evaluateNavigationRouteAccess } from '@/stores/helpers/navigationRouteAccess'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useUserStore } from '@/stores/userStore'

/*
 * How long the first navigation will wait on the user and channel stores before
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

  const enforceNavigationAccess = async () => {
    const userStore = useUserStore()
    const channelContentStore = useChannelContentStore()

    /*
     * BOUNDED. This runs before the first route resolves, so anything it awaits
     * is on the critical path to the app being visible at all -- and
     * `channelContentStore.initialize()` ends in `queryCollection('channels')`,
     * while `userStore.initialize()` reaches the API. Neither carried a deadline,
     * so a slow or failing backend held the initial navigation open indefinitely.
     * Production has been logging both since 2026-08-06: AbortErrors on
     * `/[...slug]` and 40s function timeouts.
     *
     * Timing out here is SAFE, and deliberately so: the access check below opens
     * with `if (!access.matched || access.allowed) return`, and an unpopulated
     * channel list matches nothing. So the degraded outcome is "this middleware
     * declines to gate", never "this middleware locks someone out" or, worse,
     * bounces them to /login and back while the page underneath is still
     * suspended. Whatever did resolve is kept -- the stores hold their own state,
     * and the losing promise still settles into them for the next navigation.
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

  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    nuxtApp.hook('app:mounted', () => {
      void nuxtApp.runWithContext(enforceNavigationAccess)
    })
    return
  }

  return enforceNavigationAccess()
})
