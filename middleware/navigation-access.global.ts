// /middleware/navigation-access.global.ts
import { resolveChannelLocation } from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useUserStore } from '@/stores/userStore'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const userStore = useUserStore()
  const channelContentStore = useChannelContentStore()

  await Promise.all([
    userStore.initialize(),
    channelContentStore.initialize(),
  ])

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
