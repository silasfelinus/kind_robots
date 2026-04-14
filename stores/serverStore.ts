// /stores/serverStore.ts
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type {
  Server,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'

export interface ServerForm extends Partial<Server> {}

export interface ServerOption {
  value: number
  label: string
  description: string
  serverType: ServerType
  isOfficial: boolean
  isDefault: boolean
}

export interface ServerHealthResponse {
  id: number
  title: string
  healthUrl: string
  ok: boolean
  status: number
  statusText: string
  latencyMs: number
  responseBody: unknown
}

interface FetchResponse<T> {
  success: boolean
  data?: T
  message?: string
  skipped?: string[]
}

const isClient = typeof window !== 'undefined'

function isServer(value: unknown): value is Server {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Server>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.baseUrl === 'string'
  )
}

function isServerArray(value: unknown): value is Server[] {
  return Array.isArray(value) && value.every((item: unknown) => isServer(item))
}

function parseStoredValue<T>(key: string, fallback: T): T {
  if (!isClient) return fallback

  try {
    const rawValue = localStorage.getItem(key)
    if (!rawValue) return fallback
    return JSON.parse(rawValue) as T
  } catch (error) {
    console.error(
      `[serverStore] Failed to parse localStorage key "${key}":`,
      error,
    )
    return fallback
  }
}

function sortServers(a: Server, b: Server): number {
  if ((a.isOfficial ?? false) !== (b.isOfficial ?? false)) {
    return a.isOfficial ? -1 : 1
  }

  if ((a.isDefault ?? false) !== (b.isDefault ?? false)) {
    return a.isDefault ? -1 : 1
  }

  if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  }

  return a.title.localeCompare(b.title)
}

export const useServerStore = defineStore('serverStore', () => {
  const servers: Ref<Server[]> = ref([])
  const selectedServer: Ref<Server | null> = ref(null)
  const serverForm: Ref<ServerForm> = ref({})
  const activeArtServerId: Ref<number | null> = ref(null)
  const activeTextServerId: Ref<number | null> = ref(null)
  const healthResults: Ref<Record<number, ServerHealthResponse>> = ref({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const testingHealth = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Server[]> | null>(null)
  const hasLoaded = ref(false)

  const userStore = useUserStore()

  const ownedServers = computed<Server[]>(() =>
    servers.value.filter(
      (server: Server): boolean => server.userId === userStore.user?.id,
    ),
  )

  const publicServers = computed<Server[]>(() =>
    servers.value.filter((server: Server): boolean => Boolean(server.isPublic)),
  )

  const officialServers = computed<Server[]>(() =>
    servers.value.filter((server: Server): boolean =>
      Boolean(server.isOfficial),
    ),
  )

  const activeServers = computed<Server[]>(() =>
    servers.value.filter((server: Server): boolean => Boolean(server.isActive)),
  )

  const artServers = computed<Server[]>(() =>
    activeServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'ART' ||
        server.serverType === 'A1111' ||
        Boolean(server.supportsTxt2Img) ||
        Boolean(server.supportsImg2Img)
      )
    }),
  )

  const textServers = computed<Server[]>(() =>
    activeServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'TEXT' ||
        server.serverType === 'OPENAI_COMPATIBLE' ||
        Boolean(server.supportsChat)
      )
    }),
  )

  const comfyServers = computed<Server[]>(() =>
    activeServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)
      )
    }),
  )

  const dropdownServers = computed<Server[]>(() =>
    [...activeServers.value].sort((a: Server, b: Server): number =>
      sortServers(a, b),
    ),
  )

  const activeArtServer = computed<Server | null>(() => {
    if (activeArtServerId.value !== null) {
      const match = servers.value.find(
        (server: Server): boolean => server.id === activeArtServerId.value,
      )
      if (match) return match
    }

    if (typeof userStore.user?.preferredArtServerId === 'number') {
      const preferred = servers.value.find(
        (server: Server): boolean =>
          server.id === userStore.user?.preferredArtServerId,
      )
      if (preferred) return preferred
    }

    return (
      artServers.value.find((server: Server): boolean =>
        Boolean(server.isDefault),
      ) ||
      artServers.value.find((server: Server): boolean =>
        Boolean(server.isOfficial),
      ) ||
      artServers.value[0] ||
      null
    )
  })

  const activeTextServer = computed<Server | null>(() => {
    if (activeTextServerId.value !== null) {
      const match = servers.value.find(
        (server: Server): boolean => server.id === activeTextServerId.value,
      )
      if (match) return match
    }

    if (typeof userStore.user?.preferredTextServerId === 'number') {
      const preferred = servers.value.find(
        (server: Server): boolean =>
          server.id === userStore.user?.preferredTextServerId,
      )
      if (preferred) return preferred
    }

    return (
      textServers.value.find((server: Server): boolean =>
        Boolean(server.isDefault),
      ) ||
      textServers.value.find((server: Server): boolean =>
        Boolean(server.isOfficial),
      ) ||
      textServers.value[0] ||
      null
    )
  })

  const artServerOptions = computed<ServerOption[]>(() =>
    artServers.value
      .slice()
      .sort((a: Server, b: Server): number => sortServers(a, b))
      .map(
        (server: Server): ServerOption => ({
          value: server.id,
          label: server.label || server.title,
          description: server.description || '',
          serverType: server.serverType,
          isOfficial: Boolean(server.isOfficial),
          isDefault: Boolean(server.isDefault),
        }),
      ),
  )

  const textServerOptions = computed<ServerOption[]>(() =>
    textServers.value
      .slice()
      .sort((a: Server, b: Server): number => sortServers(a, b))
      .map(
        (server: Server): ServerOption => ({
          value: server.id,
          label: server.label || server.title,
          description: server.description || '',
          serverType: server.serverType,
          isOfficial: Boolean(server.isOfficial),
          isDefault: Boolean(server.isDefault),
        }),
      ),
  )

  function syncToLocalStorage(): void {
    if (!isClient) return

    try {
      localStorage.setItem('servers', JSON.stringify(servers.value))
      localStorage.setItem('serverForm', JSON.stringify(serverForm.value))
      localStorage.setItem(
        'activeArtServerId',
        JSON.stringify(activeArtServerId.value),
      )
      localStorage.setItem(
        'activeTextServerId',
        JSON.stringify(activeTextServerId.value),
      )
      localStorage.setItem(
        'serverHealthResults',
        JSON.stringify(healthResults.value),
      )
    } catch (error) {
      console.error('[serverStore] localStorage sync error:', error)
    }
  }

  function loadFromLocalStorage(): void {
    if (!isClient) return

    const storedServers = parseStoredValue<unknown[]>('servers', [])
    const storedForm = parseStoredValue<ServerForm>('serverForm', {})
    const storedActiveArtServerId = parseStoredValue<number | null>(
      'activeArtServerId',
      null,
    )
    const storedActiveTextServerId = parseStoredValue<number | null>(
      'activeTextServerId',
      null,
    )
    const storedHealthResults = parseStoredValue<
      Record<number, ServerHealthResponse>
    >('serverHealthResults', {})

    servers.value = isServerArray(storedServers) ? storedServers : []
    serverForm.value = storedForm
    activeArtServerId.value = storedActiveArtServerId
    activeTextServerId.value = storedActiveTextServerId
    healthResults.value = storedHealthResults
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        loadFromLocalStorage()

        const fetchedServers = await fetchAllServers()
        const fetchedIds = new Set<number>(
          fetchedServers.map((server: Server): number => server.id),
        )

        servers.value = [
          ...servers.value.filter(
            (server: Server): boolean => !fetchedIds.has(server.id),
          ),
          ...fetchedServers,
        ]

        if (
          activeArtServerId.value === null &&
          typeof userStore.user?.preferredArtServerId === 'number'
        ) {
          activeArtServerId.value = userStore.user.preferredArtServerId
        }

        if (
          activeTextServerId.value === null &&
          typeof userStore.user?.preferredTextServerId === 'number'
        ) {
          activeTextServerId.value = userStore.user.preferredTextServerId
        }

        syncToLocalStorage()
        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing server store')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchAllServers(force = false): Promise<Server[]> {
    if (!force && hasLoaded.value) return servers.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        const res = (await performFetch('/api/server')) as FetchResponse<
          Server[]
        >

        if (res.success && isServerArray(res.data)) {
          hasLoaded.value = true
          return res.data
        }

        throw new Error(res.message || 'Failed to fetch servers')
      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching servers')
        return []
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchServerById(id: number): Promise<Server | null> {
    try {
      const res = (await performFetch(
        `/api/server/${id}`,
      )) as FetchResponse<Server>

      if (res.success && res.data && isServer(res.data)) {
        const index = servers.value.findIndex(
          (server: Server): boolean => server.id === id,
        )

        if (index !== -1) {
          servers.value[index] = res.data
        } else {
          servers.value.push(res.data)
        }

        syncToLocalStorage()
        return res.data
      }

      throw new Error(res.message || 'Failed to fetch server')
    } catch (error) {
      handleError(error, 'fetching server by ID')
      return null
    }
  }

  async function addServer(
    payload: Partial<Server>,
  ): Promise<{ success: boolean; data?: Server; message?: string }> {
    isSaving.value = true

    try {
      const res = (await performFetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as FetchResponse<Server>

      if (!res.success || !res.data || !isServer(res.data)) {
        throw new Error(res.message || 'Failed to create server')
      }

      servers.value.push(res.data)
      syncToLocalStorage()

      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'creating server')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function addServers(payload: Partial<Server>[]): Promise<{
    success: boolean
    data: Server[]
    skipped?: string[]
    message?: string
  }> {
    isSaving.value = true

    try {
      const res = (await performFetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as FetchResponse<Server[]>

      const createdServers = isServerArray(res.data) ? res.data : []

      if (!res.success) {
        throw new Error(res.message || 'Failed to create servers')
      }

      const createdIds = new Set<number>(
        createdServers.map((server: Server): number => server.id),
      )

      servers.value = [
        ...servers.value.filter(
          (server: Server): boolean => !createdIds.has(server.id),
        ),
        ...createdServers,
      ]

      syncToLocalStorage()

      return {
        success: true,
        data: createdServers,
        skipped: Array.isArray(res.skipped) ? res.skipped : [],
      }
    } catch (error) {
      handleError(error, 'creating servers')
      return {
        success: false,
        data: [],
        message: (error as Error).message,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function updateServer(
    id: number,
    updates: Partial<Server>,
  ): Promise<{ success: boolean; data?: Server; message?: string }> {
    isSaving.value = true

    try {
      const res = (await performFetch(`/api/server/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })) as FetchResponse<Server>

      if (!res.success || !res.data || !isServer(res.data)) {
        throw new Error(res.message || 'Failed to update server')
      }

      const index = servers.value.findIndex(
        (server: Server): boolean => server.id === id,
      )

      if (index !== -1) {
        servers.value[index] = res.data
      } else {
        servers.value.push(res.data)
      }

      if (selectedServer.value?.id === id) {
        selectedServer.value = res.data
        serverForm.value = { ...res.data }
      }

      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'updating server')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteServer(
    id: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = (await performFetch(`/api/server/${id}`, {
        method: 'DELETE',
      })) as FetchResponse<null>

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete server')
      }

      servers.value = servers.value.filter(
        (server: Server): boolean => server.id !== id,
      )

      if (selectedServer.value?.id === id) {
        deselectServer()
      }

      if (activeArtServerId.value === id) {
        activeArtServerId.value = null
      }

      if (activeTextServerId.value === id) {
        activeTextServerId.value = null
      }

      delete healthResults.value[id]
      syncToLocalStorage()

      return { success: true }
    } catch (error) {
      handleError(error, 'deleting server')
      return { success: false, message: (error as Error).message }
    }
  }

  async function testServerHealth(id: number): Promise<{
    success: boolean
    data?: ServerHealthResponse
    message?: string
  }> {
    testingHealth.value = true

    try {
      const res = (await performFetch(
        `/api/server/health/${id}`,
      )) as FetchResponse<ServerHealthResponse>

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to test server health')
      }

      healthResults.value[id] = res.data

      const serverIndex = servers.value.findIndex(
        (server: Server): boolean => server.id === id,
      )

      if (serverIndex !== -1) {
        const nextStatus: ServerStatus = res.data.ok ? 'ONLINE' : 'OFFLINE'
        const currentServer = servers.value[serverIndex]

        if (!currentServer) {
          throw new Error('Server not found in local state')
        }

        servers.value[serverIndex] = {
          ...currentServer,
          lastCheckedAt: new Date(),
          lastStatus: nextStatus,
        }
      }

      syncToLocalStorage()
      return { success: true, data: res.data }
    } catch (error) {
      handleError(error, 'testing server health')
      return { success: false, message: (error as Error).message }
    } finally {
      testingHealth.value = false
    }
  }

  function selectServer(id: number): void {
    const server = servers.value.find((item: Server): boolean => item.id === id)

    if (server) {
      selectedServer.value = server
      serverForm.value = { ...server }
      syncToLocalStorage()
    }
  }

  function deselectServer(): void {
    selectedServer.value = null
    serverForm.value = {}
    syncToLocalStorage()
  }

  function createNewServer(serverType: ServerType = 'ART'): void {
    const isArtLike = serverType === 'ART' || serverType === 'A1111'
    const isTextLike =
      serverType === 'TEXT' || serverType === 'OPENAI_COMPATIBLE'
    const isComfyLike = serverType === 'COMFY'

    serverForm.value = {
      title: '',
      label: '',
      description: '',
      category: '',
      serverType,
      baseUrl: '',
      endpointPath: isComfyLike
        ? '/prompt'
        : isTextLike
          ? '/v1/chat/completions'
          : '/sdapi/v1/txt2img',
      healthPath: isComfyLike
        ? '/history'
        : isTextLike
          ? '/health'
          : '/sdapi/v1/progress',
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      requiresApiKey: false,
      apiKeyName: '',
      supportsTxt2Img: isArtLike,
      supportsImg2Img: isArtLike,
      supportsChat: isTextLike,
      supportsComfyWorkflow: isComfyLike,
      supportsCheckpointOverride: isArtLike,
      supportsSampler: isArtLike,
      supportsNegativePrompt: isArtLike,
      supportsSeed: isArtLike,
      supportsSteps: isArtLike,
      designer: userStore.user?.designerName || '',
      version: '',
      notes: '',
      sortOrder: 0,
      lastStatus: 'UNKNOWN',
    }

    selectedServer.value = null
    syncToLocalStorage()
  }

  async function saveServer(): Promise<{
    success: boolean
    data?: Server
    message?: string
  }> {
    if (!serverForm.value) {
      return { success: false, message: 'No server form loaded.' }
    }

    isSaving.value = true

    try {
      if (typeof serverForm.value.id === 'number') {
        return await updateServer(serverForm.value.id, serverForm.value)
      }

      return await addServer(serverForm.value)
    } catch (error) {
      handleError(error, 'saving server')
      return { success: false, message: (error as Error).message }
    } finally {
      isSaving.value = false
    }
  }

  function setActiveArtServer(id: number | null): void {
    activeArtServerId.value = id
    syncToLocalStorage()
  }

  function setActiveTextServer(id: number | null): void {
    activeTextServerId.value = id
    syncToLocalStorage()
  }

  function clearActiveServers(): void {
    activeArtServerId.value = null
    activeTextServerId.value = null
    syncToLocalStorage()
  }

  function getServerById(id: number): Server | null {
    return (
      servers.value.find((server: Server): boolean => server.id === id) || null
    )
  }

  function getServersByType(serverType: ServerType): Server[] {
    return servers.value.filter(
      (server: Server): boolean => server.serverType === serverType,
    )
  }

  function getCompatibleServers(
    capability: 'art' | 'text' | 'comfy',
  ): Server[] {
    if (capability === 'art') return artServers.value
    if (capability === 'text') return textServers.value
    return comfyServers.value
  }

  return {
    servers,
    selectedServer,
    serverForm,
    activeArtServerId,
    activeTextServerId,
    healthResults,
    isSaving,
    isInitialized,
    loading,
    testingHealth,
    initializePromise,
    fetchPromise,
    hasLoaded,
    ownedServers,
    publicServers,
    officialServers,
    activeServers,
    artServers,
    textServers,
    comfyServers,
    dropdownServers,
    activeArtServer,
    activeTextServer,
    artServerOptions,
    textServerOptions,
    syncToLocalStorage,
    loadFromLocalStorage,
    initialize,
    fetchAllServers,
    fetchServerById,
    addServer,
    addServers,
    updateServer,
    deleteServer,
    testServerHealth,
    selectServer,
    deselectServer,
    createNewServer,
    saveServer,
    setActiveArtServer,
    setActiveTextServer,
    clearActiveServers,
    getServerById,
    getServersByType,
    getCompatibleServers,
  }
})

export type { Server, ServerStatus, ServerType }
