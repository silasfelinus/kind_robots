// /middleware/navigation-access.global.ts
import { resolveChannelLocation } from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useUserStore } from '@/stores/userStore'

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

  const userStore = useUserStore()
  const channelContentStore = useChannelContentStore()

  await Promise.all([
    userStore.initialize(),
    channelContentStore.initialize(),
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
  const requested = resolveChannelLocation(channelContentStore.channels, {
    path: to.path,
    tabKey: requestedTab,
  })

  // Routes outside the content navigation graph are not this middleware's job.
  if (!requested) return

  const visibleChannel = channelContentStore.visibleChannels.find(
    (channel) => channel.channelKey === requested.channel.channelKey,
  )
  const visibleTab = requested.tab
    ? visibleChannel?.tabs.find(
        (tab) => tab.tabKey === requested.tab?.tabKey,
      )
    : null

  if (visibleChannel && (!requested.tab || visibleTab)) return

  const requiredRole =
    requested.tab?.requiredRole || requested.channel.requiredRole
  const requiredPermission =
    requested.tab?.requiredPermission || requested.channel.requiredPermission
  const requiresAccount =
    Boolean(requiredRole && requiredRole !== 'GUEST') ||
    accountPermissions.has(requiredPermission.toLowerCase())

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
})
