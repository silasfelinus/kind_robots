import { defineNuxtPlugin } from '#app'
import { performFetch } from '@/stores/utils'
import { useServerStore } from '@/stores/serverStore'
import { reconcileServerRows } from '@/stores/helpers/serverReconcile'
import type { Server } from '~/prisma/generated/prisma/client'

type ServerListResponse = {
  success: boolean
  data?: Server[]
  message?: string
}

/**
 * The server store intentionally caches safe server rows so locally entered API
 * keys can survive masked API responses. A full API refresh used to merge rows
 * additively, though, which meant deleted database rows could live forever in
 * localStorage. Reconcile once during client bootstrap so API membership is
 * authoritative while matching cached fields remain available.
 */
export default defineNuxtPlugin(async () => {
  const serverStore = useServerStore()

  if (!serverStore.isInitialized) {
    serverStore.loadFromLocalStorage()
  }

  const cachedIds = new Set(serverStore.servers.map((server) => server.id))
  const response = (await performFetch('/api/server')) as ServerListResponse

  if (!response.success || !Array.isArray(response.data)) return

  const nextServers = reconcileServerRows(serverStore.servers, response.data)
  const liveIds = new Set(nextServers.map((server) => server.id))
  const removedIds = [...cachedIds].filter((id) => !liveIds.has(id))

  serverStore.servers.splice(0, serverStore.servers.length, ...nextServers)

  if (
    serverStore.selectedServer &&
    !liveIds.has(serverStore.selectedServer.id)
  ) {
    serverStore.selectedServer = null
    serverStore.serverForm = {}
  }

  if (
    typeof serverStore.activeArtServerId === 'number' &&
    !liveIds.has(serverStore.activeArtServerId)
  ) {
    serverStore.activeArtServerId = null
  }

  if (
    typeof serverStore.activeTextServerId === 'number' &&
    !liveIds.has(serverStore.activeTextServerId)
  ) {
    serverStore.activeTextServerId = null
  }

  for (const id of removedIds) {
    delete serverStore.healthResults[id]
    serverStore.clearRuntimeReport(id)
  }

  serverStore.hasLoaded = true
  serverStore.syncToLocalStorage()
})
