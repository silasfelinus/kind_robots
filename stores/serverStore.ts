// /stores/serverStore.ts
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type {
  Server,
  ServerAccessMode,
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
  success: boolean
  message: string
  data: {
    id?: number
    title?: string
    healthUrl?: string
    ok: boolean
    status: number
    statusText: string
    latencyMs: number
    responseBody: unknown
    runLocation?: 'server' | 'browser'
    accessMode?: ServerAccessMode | null
    requiresClientSideCheck?: boolean | null
    isPrivateNetwork?: boolean | null
    allowBrowserRequests?: boolean | null
    savedReport?: unknown
  }
  statusCode: number
}

interface FetchResponse<T> {
  success: boolean
  data?: T
  message?: string
  skipped?: string[]
  status?: number
  statusCode?: number
}

interface ServerHealthHandoffData {
  id: number
  title: string
  healthUrl: string
  accessMode?: ServerAccessMode | null
  requiresClientSideCheck?: boolean | null
  isPrivateNetwork?: boolean | null
  allowBrowserRequests?: boolean | null
  runLocation: 'browser'
}

interface ServerHealthResultData {
  id?: number
  title?: string
  healthUrl?: string
  ok: boolean
  status: number
  statusText: string
  latencyMs: number
  responseBody: unknown
  runLocation?: 'server' | 'browser'
}

type ServerHealthApiResponse = FetchResponse<
  ServerHealthHandoffData | ServerHealthResultData
>

type ServerInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

type SetActiveServerOptions = {
  persistUser?: boolean
}

const isClient = typeof window !== 'undefined'

const serversStorageKey = 'servers'
const serverFormStorageKey = 'serverForm'
const activeArtServerIdStorageKey = 'activeArtServerId'
const activeTextServerIdStorageKey = 'activeTextServerId'
const serverHealthResultsStorageKey = 'serverHealthResults'

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

function isServerHealthHandoffData(
  value: unknown,
): value is ServerHealthHandoffData {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ServerHealthHandoffData>

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.healthUrl === 'string' &&
    candidate.runLocation === 'browser'
  )
}

function isServerHealthResultData(
  value: unknown,
): value is ServerHealthResultData {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ServerHealthResultData>

  return (
    typeof candidate.ok === 'boolean' &&
    typeof candidate.status === 'number' &&
    typeof candidate.statusText === 'string' &&
    typeof candidate.latencyMs === 'number'
  )
}

function getResponseStatusCode(response: FetchResponse<unknown>): number {
  return response.statusCode ?? response.status ?? 0
}

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function parseStoredValue<T>(key: string, fallback: T): T {
  const rawValue = safeGetLocalStorage(key)

  if (!rawValue) return fallback

  try {
    return JSON.parse(rawValue) as T
  } catch {
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
  const isInitializing = ref(false)
  const loading = ref(false)
  const testingHealth = ref(false)
  const showHiddenServers = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Server[]> | null>(null)
  const fetchServerByIdPromises = ref<Record<number, Promise<Server | null>>>(
    {},
  )
  const healthPromises = ref<Record<number, Promise<ServerHealthResponse>>>({})
  const hasLoaded = ref(false)

  const userStore = useUserStore()
  const errorStore = useErrorStore()

  const hiddenServerIds = computed<number[]>(() => {
    const ids = userStore.user?.hiddenServerIds

    if (!Array.isArray(ids)) return []

    return ids.filter((id): id is number => typeof id === 'number')
  })

  const hiddenServerIdSet = computed<Set<number>>(
    () => new Set(hiddenServerIds.value),
  )

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

  const hiddenServers = computed<Server[]>(() =>
    activeServers.value.filter((server: Server): boolean =>
      hiddenServerIdSet.value.has(server.id),
    ),
  )

  const visibleActiveServers = computed<Server[]>(() =>
    activeServers.value.filter((server: Server): boolean => {
      if (showHiddenServers.value) return true
      return !hiddenServerIdSet.value.has(server.id)
    }),
  )

  const artServers = computed<Server[]>(() =>
    visibleActiveServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'ART' ||
        server.serverType === 'A1111' ||
        server.serverType === 'COMFY' ||
        Boolean(server.supportsTxt2Img) ||
        Boolean(server.supportsImg2Img) ||
        Boolean(server.supportsComfyWorkflow)
      )
    }),
  )

  const textServers = computed<Server[]>(() =>
    visibleActiveServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'TEXT' ||
        server.serverType === 'OPENAI_COMPATIBLE' ||
        Boolean(server.supportsChat)
      )
    }),
  )

  const comfyServers = computed<Server[]>(() =>
    visibleActiveServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)
      )
    }),
  )

  const dropdownServers = computed<Server[]>(() =>
    [...visibleActiveServers.value].sort((a: Server, b: Server): number =>
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

  function setStoreError(
    errorType: ErrorType,
    message: string,
    context: string,
  ): void {
    lastError.value = message
    errorStore.setError(errorType, message)

    if (import.meta.dev) {
      console.error(`[serverStore] ${context}: ${message}`)
    }
  }

  function clearStoreError(): void {
    lastError.value = null
  }

  function isServerHidden(id: number): boolean {
    return hiddenServerIdSet.value.has(id)
  }

  function joinServerUrl(baseUrl: string, path: string): string {
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    return `${cleanBase}${cleanPath}`
  }

  function shouldSendCredentials(server: Server): boolean {
    return Boolean(
      server.useOidc ||
      server.accessMode === 'PUBLIC_OIDC' ||
      server.accessMode === 'PUBLIC_PROTECTED',
    )
  }

  function buildCorsHeaders(options: RequestInit): HeadersInit {
    const headers = new Headers(options.headers)

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, text/plain, */*')
    }

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    return headers
  }

  async function requestServer(
    serverInput: Server,
    pathOverride?: string,
    options: RequestInit = {},
  ) {
    const server = getHydratedServer(serverInput)

    if (!server.allowBrowserRequests) {
      throw new Error(
        `Server "${server.title || server.label || server.id}" is not configured to allow browser requests. | allowBrowserRequests=${server.allowBrowserRequests} | requiresClientSideCheck=${server.requiresClientSideCheck} | isPrivateNetwork=${server.isPrivateNetwork} | accessMode=${server.accessMode} | baseUrl=${server.baseUrl} | healthPath=${server.healthPath} | serverType=${server.serverType} | id=${server.id}`,
      )
    }

    const baseUrl = String(server.baseUrl || '').replace(/\/$/, '')
    const path = String(pathOverride || server.healthPath || '').startsWith('/')
      ? String(pathOverride || server.healthPath || '')
      : `/${String(pathOverride || server.healthPath || '')}`

    return await fetch(`${baseUrl}${path}`, options)
  }

  function upsertServer(server: Server): void {
    const index = servers.value.findIndex(
      (entry: Server): boolean => entry.id === server.id,
    )

    if (index >= 0) {
      servers.value.splice(index, 1, server)
    } else {
      servers.value.push(server)
    }

    servers.value.sort(sortServers)
  }

  function mergeServers(incoming: Server[]): void {
    const incomingIds = new Set<number>(
      incoming.map((server: Server): number => server.id),
    )

    servers.value = [
      ...servers.value.filter(
        (server: Server): boolean => !incomingIds.has(server.id),
      ),
      ...incoming,
    ].sort(sortServers)
  }

  function applyPreferredServersFromUser(): void {
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
  }

  function syncToLocalStorage(): void {
    safeSetLocalStorage(serversStorageKey, JSON.stringify(servers.value))
    safeSetLocalStorage(serverFormStorageKey, JSON.stringify(serverForm.value))
    safeSetLocalStorage(
      activeArtServerIdStorageKey,
      JSON.stringify(activeArtServerId.value),
    )
    safeSetLocalStorage(
      activeTextServerIdStorageKey,
      JSON.stringify(activeTextServerId.value),
    )
    safeSetLocalStorage(
      serverHealthResultsStorageKey,
      JSON.stringify(healthResults.value),
    )
  }

  function loadFromLocalStorage(): void {
    if (!isClient) return

    const storedServers = parseStoredValue<unknown[]>(serversStorageKey, [])
    const storedForm = parseStoredValue<ServerForm>(serverFormStorageKey, {})
    const storedActiveArtServerId = parseStoredValue<number | null>(
      activeArtServerIdStorageKey,
      null,
    )
    const storedActiveTextServerId = parseStoredValue<number | null>(
      activeTextServerIdStorageKey,
      null,
    )
    const storedHealthResults = parseStoredValue<
      Record<number, ServerHealthResponse>
    >(serverHealthResultsStorageKey, {})

    servers.value = isServerArray(storedServers)
      ? storedServers.slice().sort(sortServers)
      : []
    serverForm.value = storedForm
    activeArtServerId.value = storedActiveArtServerId
    activeTextServerId.value = storedActiveTextServerId
    healthResults.value = storedHealthResults
  }

  async function initialize(
    options: ServerInitializeOptions = {},
  ): Promise<void> {
    const wantsRemote = Boolean(options.fetchRemote)
    const needsRemote = wantsRemote && !hasLoaded.value

    if (isInitialized.value && !options.force && !needsRemote) return

    if (initializePromise.value && !options.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearStoreError()

        loadFromLocalStorage()
        applyPreferredServersFromUser()

        if (wantsRemote && (!hasLoaded.value || options.force)) {
          const fetchedServers = await fetchAllServers(Boolean(options.force))
          mergeServers(fetchedServers)
        }

        applyPreferredServersFromUser()
        syncToLocalStorage()
        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing server store')
        setStoreError(
          ErrorType.STORE_ERROR,
          'Failed to initialize server store.',
          'initialize',
        )
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchAllServers(force = false): Promise<Server[]> {
    if (!force && hasLoaded.value && servers.value.length) {
      return servers.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearStoreError()

        const res = (await performFetch('/api/server')) as FetchResponse<
          Server[]
        >

        if (res.success && isServerArray(res.data)) {
          servers.value = res.data.slice().sort(sortServers)
          hasLoaded.value = true
          syncToLocalStorage()
          return servers.value
        }

        throw new Error(res.message || 'Failed to fetch servers')
      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching servers')
        setStoreError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch servers.',
          'fetchAllServers',
        )
        return servers.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchServerById(id: number): Promise<Server | null> {
    const existing = getServerById(id)

    if (existing) {
      return existing
    }

    if (fetchServerByIdPromises.value[id]) {
      return fetchServerByIdPromises.value[id]
    }

    fetchServerByIdPromises.value[id] = (async () => {
      loading.value = true

      try {
        clearStoreError()

        const res = (await performFetch(
          `/api/server/${id}`,
        )) as FetchResponse<Server>

        if (res.success && res.data && isServer(res.data)) {
          upsertServer(res.data)
          syncToLocalStorage()
          return res.data
        }

        throw new Error(res.message || 'Failed to fetch server')
      } catch (error) {
        handleError(error, 'fetching server by ID')
        setStoreError(
          ErrorType.NETWORK_ERROR,
          'Failed to fetch server.',
          'fetchServerById',
        )
        return null
      } finally {
        loading.value = false
        delete fetchServerByIdPromises.value[id]
      }
    })()

    return fetchServerByIdPromises.value[id]
  }

  async function addServer(
    payload: Partial<Server>,
  ): Promise<{ success: boolean; data?: Server; message?: string }> {
    isSaving.value = true

    try {
      clearStoreError()

      const res = (await performFetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as FetchResponse<Server>

      if (!res.success || !res.data || !isServer(res.data)) {
        throw new Error(res.message || 'Failed to create server')
      }

      upsertServer(res.data)
      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
        message: res.message || 'Server created successfully.',
      }
    } catch (error) {
      handleError(error, 'creating server')
      const message = (error as Error).message || 'Failed to create server.'
      setStoreError(ErrorType.STORE_ERROR, message, 'addServer')
      return { success: false, message }
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
      clearStoreError()

      const res = (await performFetch('/api/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as FetchResponse<Server[]>

      const createdServers = isServerArray(res.data) ? res.data : []

      if (!res.success) {
        throw new Error(res.message || 'Failed to create servers')
      }

      mergeServers(createdServers)
      syncToLocalStorage()

      return {
        success: true,
        data: createdServers,
        skipped: Array.isArray(res.skipped) ? res.skipped : [],
        message: res.message || 'Servers created successfully.',
      }
    } catch (error) {
      handleError(error, 'creating servers')
      const message = (error as Error).message || 'Failed to create servers.'
      setStoreError(ErrorType.STORE_ERROR, message, 'addServers')

      return {
        success: false,
        data: [],
        message,
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
      clearStoreError()

      const res = (await performFetch(`/api/server/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })) as FetchResponse<Server>

      if (!res.success || !res.data || !isServer(res.data)) {
        throw new Error(res.message || 'Failed to update server')
      }

      upsertServer(res.data)

      if (selectedServer.value?.id === id) {
        selectedServer.value = res.data
        serverForm.value = { ...res.data }
      }

      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
        message: res.message || 'Server updated successfully.',
      }
    } catch (error) {
      handleError(error, 'updating server')
      const message = (error as Error).message || 'Failed to update server.'
      setStoreError(ErrorType.STORE_ERROR, message, 'updateServer')
      return { success: false, message }
    } finally {
      isSaving.value = false
    }
  }

  const isServerFormOpen = ref(false)

  function openServerForm() {
    isServerFormOpen.value = true
  }

  function closeServerForm() {
    isServerFormOpen.value = false
  }

  function toggleServerForm() {
    isServerFormOpen.value = !isServerFormOpen.value
  }

  async function updateServerApiKey(
    id: number,
    payload: {
      apiKey?: string | null
      apiKeyName?: string | null
      clearKey?: boolean
    },
  ): Promise<{ success: boolean; message?: string }> {
    isSaving.value = true

    try {
      clearStoreError()

      const res = (await performFetch(`/api/server/key/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })) as FetchResponse<Server>

      if (!res.success || !res.data || !isServer(res.data)) {
        throw new Error(res.message || 'Failed to update server API key.')
      }

      upsertServer(res.data)

      if (selectedServer.value?.id === id) {
        selectedServer.value = res.data
        serverForm.value = { ...res.data }
      }

      syncToLocalStorage()

      return {
        success: true,
        message: res.message || 'Server API key updated.',
      }
    } catch (error) {
      handleError(error, 'updating server API key')
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update server API key.',
      }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteServer(
    id: number,
  ): Promise<{ success: boolean; message?: string }> {
    loading.value = true

    try {
      clearStoreError()

      const response = (await performFetch(`/api/server/${id}`, {
        method: 'DELETE',
      })) as FetchResponse<undefined>

      if (!response.success) {
        const message = response.message || 'Failed to delete server.'
        setStoreError(ErrorType.STORE_ERROR, message, 'deleteServer')

        return {
          success: false,
          message,
        }
      }

      servers.value = servers.value.filter(
        (server: Server): boolean => server.id !== id,
      )

      if (selectedServer.value?.id === id) {
        selectedServer.value = null
        serverForm.value = {}
      }

      if (activeArtServerId.value === id) {
        activeArtServerId.value = null
      }

      if (activeTextServerId.value === id) {
        activeTextServerId.value = null
      }

      delete healthResults.value[id]
      syncToLocalStorage()

      return {
        success: true,
        message: response.message || 'Server deleted successfully.',
      }
    } catch (error) {
      handleError(error, 'deleting server')
      const message = 'Failed to delete server.'
      setStoreError(ErrorType.STORE_ERROR, message, 'deleteServer')

      return {
        success: false,
        message,
      }
    } finally {
      loading.value = false
    }
  }

  async function hideServer(id: number): Promise<{
    success: boolean
    message?: string
  }> {
    if (!userStore.isLoggedIn) {
      return {
        success: false,
        message: 'Please log in to hide servers.',
      }
    }

    if (hiddenServerIdSet.value.has(id)) {
      return {
        success: true,
        message: 'Server already hidden.',
      }
    }

    const nextHiddenServerIds = [...new Set([...hiddenServerIds.value, id])]

    try {
      await userStore.updateUser({
        hiddenServerIds: nextHiddenServerIds,
      })

      if (activeArtServerId.value === id) {
        activeArtServerId.value = null
      }

      if (activeTextServerId.value === id) {
        activeTextServerId.value = null
      }

      syncToLocalStorage()

      return {
        success: true,
        message: 'Server hidden.',
      }
    } catch (error) {
      handleError(error, 'hiding server')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to hide server.',
      }
    }
  }

  async function unhideServer(id: number): Promise<{
    success: boolean
    message?: string
  }> {
    if (!userStore.isLoggedIn) {
      return {
        success: false,
        message: 'Please log in to restore servers.',
      }
    }

    if (!hiddenServerIdSet.value.has(id)) {
      return {
        success: true,
        message: 'Server already visible.',
      }
    }

    const nextHiddenServerIds = hiddenServerIds.value.filter(
      (serverId: number): boolean => serverId !== id,
    )

    try {
      await userStore.updateUser({
        hiddenServerIds: nextHiddenServerIds,
      })

      syncToLocalStorage()

      return {
        success: true,
        message: 'Server restored.',
      }
    } catch (error) {
      handleError(error, 'restoring server')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to restore server.',
      }
    }
  }

  async function testServerHealthFromBrowser(
    id: number,
    healthUrl: string,
  ): Promise<ServerHealthResponse> {
    const startedAt = Date.now()
    const server = getServerById(id)

    const healthPath =
      server && healthUrl.startsWith(server.baseUrl)
        ? healthUrl.slice(server.baseUrl.length) || server.healthPath || '/'
        : server?.healthPath || '/'

    let report = {
      ok: false,
      status: 0,
      statusText: 'Browser request failed',
      latencyMs: 0,
      responseBody: null as unknown,
      message:
        'Browser could not reach this server. Check CORS and server access.',
    }

    try {
      if (!server) {
        throw new Error(`Server ${id} not found in serverStore.`)
      }

      const response = await requestServer(server, healthPath, {
        method: 'GET',
      })

      const contentType = response.headers.get('content-type') || ''
      const responseBody = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null)

      report = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText || 'Unknown',
        latencyMs: Date.now() - startedAt,
        responseBody,
        message: response.ok
          ? 'Server health check succeeded from browser.'
          : `Health endpoint returned HTTP ${response.status}.`,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Browser could not reach this server. Check CORS and server access.'

      report = {
        ...report,
        latencyMs: Date.now() - startedAt,
        message,
        responseBody: {
          error: message,
          attemptedHealthUrl: healthUrl,
          attemptedHealthPath: healthPath,
          browserLocation: isClient ? window.location.origin : null,
          server: server
            ? {
                id: server.id,
                title: server.title,
                label: server.label,
                serverType: server.serverType,
                baseUrl: server.baseUrl,
                healthPath: server.healthPath,
                endpointPath: server.endpointPath,
                accessMode: server.accessMode,
                allowBrowserRequests: server.allowBrowserRequests,
                requiresClientSideCheck: server.requiresClientSideCheck,
                isPrivateNetwork: server.isPrivateNetwork,
                useOidc: server.useOidc,
                oidcProvider: server.oidcProvider,
                isActive: server.isActive,
                isDefault: server.isDefault,
                isOfficial: server.isOfficial,
                isPublic: server.isPublic,
                requiresApiKey: server.requiresApiKey,
                apiKeyName: server.apiKeyName,
                lastStatus: server.lastStatus,
              }
            : null,
        },
      }
    }

    const updateResult = (await performFetch(`/api/server/health/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })) as FetchResponse<unknown>

    const result: ServerHealthResponse = {
      success: report.ok,
      message: report.message,
      data: {
        id,
        title: server?.title,
        healthUrl,
        accessMode: server?.accessMode,
        requiresClientSideCheck: server?.requiresClientSideCheck,
        isPrivateNetwork: server?.isPrivateNetwork,
        allowBrowserRequests: server?.allowBrowserRequests,
        ok: report.ok,
        status: report.status,
        statusText: report.statusText,
        latencyMs: report.latencyMs,
        responseBody: report.responseBody,
        runLocation: 'browser',
        savedReport: updateResult,
      },
      statusCode: report.ok ? 200 : 502,
    }

    healthResults.value[id] = result
    patchServerFromHealthResponse(result)
    syncToLocalStorage()

    return result
  }

  async function testServerHealth(id: number): Promise<ServerHealthResponse> {
    if (healthPromises.value[id]) {
      return healthPromises.value[id]
    }

    healthPromises.value[id] = (async () => {
      testingHealth.value = true

      try {
        const result = (await performFetch(
          `/api/server/health/${id}`,
        )) as ServerHealthApiResponse

        const statusCode = getResponseStatusCode(result)

        if (statusCode === 202 && isServerHealthHandoffData(result.data)) {
          const handoffResult: ServerHealthResponse = {
            success: true,
            message:
              result.message ||
              'This server must be tested from the browser because it uses a private or Tailscale connection.',
            data: {
              id: result.data.id,
              title: result.data.title,
              healthUrl: result.data.healthUrl,
              accessMode: result.data.accessMode,
              requiresClientSideCheck: result.data.requiresClientSideCheck,
              isPrivateNetwork: result.data.isPrivateNetwork,
              allowBrowserRequests: result.data.allowBrowserRequests,
              ok: false,
              status: 202,
              statusText: 'Browser health check required',
              latencyMs: 0,
              responseBody: null,
              runLocation: 'browser',
            },
            statusCode,
          }

          patchServerFromHealthResponse(handoffResult)

          return await testServerHealthFromBrowser(id, result.data.healthUrl)
        }

        if (isServerHealthResultData(result.data)) {
          const healthResult: ServerHealthResponse = {
            success: result.success,
            message: result.message || 'Server health check completed.',
            data: result.data,
            statusCode,
          }

          healthResults.value[id] = healthResult
          patchServerFromHealthResponse(healthResult)
          syncToLocalStorage()

          return healthResult
        }

        const fallback: ServerHealthResponse = {
          success: false,
          message: result.message || 'Server health check failed.',
          data: {
            id,
            ok: false,
            status: statusCode,
            statusText: 'Invalid health response',
            latencyMs: 0,
            responseBody: result.data ?? null,
            runLocation: 'server',
          },
          statusCode,
        }

        healthResults.value[id] = fallback
        syncToLocalStorage()

        return fallback
      } finally {
        testingHealth.value = false
        delete healthPromises.value[id]
      }
    })()

    return healthPromises.value[id]
  }
  function selectServer(id: number): void {
    const server = servers.value.find((item: Server): boolean => item.id === id)

    if (!server) {
      setStoreError(
        ErrorType.VALIDATION_ERROR,
        'Server not found.',
        'selectServer',
      )
      return
    }

    selectedServer.value = server
    serverForm.value = { ...server }
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
      accessMode: 'LOCAL',
      requiresClientSideCheck: false,
      isPrivateNetwork: false,
      allowBrowserRequests: true,
      useOidc: false,
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
      const message = 'No server form loaded.'
      setStoreError(ErrorType.VALIDATION_ERROR, message, 'saveServer')
      return { success: false, message }
    }

    isSaving.value = true

    try {
      if (typeof serverForm.value.id === 'number') {
        return await updateServer(serverForm.value.id, serverForm.value)
      }

      return await addServer(serverForm.value)
    } catch (error) {
      handleError(error, 'saving server')
      const message = (error as Error).message || 'Failed to save server.'
      setStoreError(ErrorType.STORE_ERROR, message, 'saveServer')
      return { success: false, message }
    } finally {
      isSaving.value = false
    }
  }

  function validateTextServer(id: number | null): {
    success: boolean
    message?: string
  } {
    if (id === null) return { success: true }

    const server = getServerById(id)

    if (!server) {
      return {
        success: false,
        message: 'Text server not found.',
      }
    }

    const canUse =
      Boolean(server.isActive) &&
      (server.serverType === 'TEXT' ||
        server.serverType === 'OPENAI_COMPATIBLE' ||
        Boolean(server.supportsChat))

    if (!canUse) {
      return {
        success: false,
        message: 'This server is not compatible with text generation.',
      }
    }

    return { success: true }
  }

  async function setActiveTextServer(
    id: number | null,
    options: SetActiveServerOptions = { persistUser: true },
  ): Promise<{
    success: boolean
    message?: string
  }> {
    const result = validateTextServer(id)

    if (!result.success) {
      setStoreError(
        ErrorType.VALIDATION_ERROR,
        result.message || 'Invalid text server.',
        'setActiveTextServer',
      )
      return result
    }

    if (activeTextServerId.value === id) {
      return {
        success: true,
        message:
          id === null
            ? 'Using Kind Robots default text server.'
            : 'Preferred text server unchanged.',
      }
    }

    activeTextServerId.value = id
    syncToLocalStorage()

    if (
      options.persistUser !== false &&
      userStore.isLoggedIn &&
      userStore.user?.preferredTextServerId !== id
    ) {
      await userStore.updateUser({
        preferredTextServerId: id,
      })
    }

    return {
      success: true,
      message:
        id === null
          ? 'Using Kind Robots default text server.'
          : 'Preferred text server updated.',
    }
  }

  function validateArtServer(id: number | null): {
    success: boolean
    message?: string
  } {
    if (id === null) return { success: true }

    const server = getServerById(id)

    if (!server) {
      return {
        success: false,
        message: 'Art server not found.',
      }
    }

    const canUse =
      Boolean(server.isActive) &&
      (server.serverType === 'ART' ||
        server.serverType === 'COMFY' ||
        server.serverType === 'A1111' ||
        Boolean(server.supportsTxt2Img) ||
        Boolean(server.supportsImg2Img) ||
        Boolean(server.supportsComfyWorkflow))

    if (!canUse) {
      return {
        success: false,
        message: 'This server is not compatible with art generation.',
      }
    }

    return { success: true }
  }

  async function setActiveArtServer(
    id: number | null,
    options: SetActiveServerOptions = { persistUser: true },
  ): Promise<{
    success: boolean
    message?: string
  }> {
    const result = validateArtServer(id)

    if (!result.success) {
      setStoreError(
        ErrorType.VALIDATION_ERROR,
        result.message || 'Invalid art server.',
        'setActiveArtServer',
      )
      return result
    }

    if (activeArtServerId.value === id) {
      return {
        success: true,
        message:
          id === null
            ? 'Using Kind Robots default image server.'
            : 'Preferred image server unchanged.',
      }
    }

    activeArtServerId.value = id
    syncToLocalStorage()

    if (
      options.persistUser !== false &&
      userStore.isLoggedIn &&
      userStore.user?.preferredArtServerId !== id
    ) {
      await userStore.updateUser({
        preferredArtServerId: id,
      })
    }

    return {
      success: true,
      message:
        id === null
          ? 'Using Kind Robots default image server.'
          : 'Preferred image server updated.',
    }
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

  function getHydratedServer(serverInput: Server): Server {
    const storedServer = serverInput.id ? getServerById(serverInput.id) : null

    return {
      ...serverInput,
      ...(storedServer ?? {}),
      allowBrowserRequests:
        storedServer?.allowBrowserRequests ?? serverInput.allowBrowserRequests,
      requiresClientSideCheck:
        storedServer?.requiresClientSideCheck ??
        serverInput.requiresClientSideCheck,
      isPrivateNetwork:
        storedServer?.isPrivateNetwork ?? serverInput.isPrivateNetwork,
      accessMode: storedServer?.accessMode ?? serverInput.accessMode,
      baseUrl: storedServer?.baseUrl ?? serverInput.baseUrl,
      healthPath: storedServer?.healthPath ?? serverInput.healthPath,
      endpointPath: storedServer?.endpointPath ?? serverInput.endpointPath,
      serverType: storedServer?.serverType ?? serverInput.serverType,
    }
  }

  function patchServerFromHealthResponse(result: ServerHealthResponse): void {
    const data = result.data

    if (!data?.id) return

    const index = servers.value.findIndex(
      (server: Server): boolean => server.id === data.id,
    )

    if (index < 0) return

    const currentServer = servers.value[index]

    if (!currentServer) return

    const nextStatus: ServerStatus = data.ok
      ? 'ONLINE'
      : data.runLocation === 'browser'
        ? 'UNKNOWN'
        : 'OFFLINE'

    const patchedServer: Server = {
      ...currentServer,
      accessMode: data.accessMode ?? currentServer.accessMode,
      requiresClientSideCheck:
        data.requiresClientSideCheck ?? currentServer.requiresClientSideCheck,
      isPrivateNetwork: data.isPrivateNetwork ?? currentServer.isPrivateNetwork,
      allowBrowserRequests:
        data.allowBrowserRequests ?? currentServer.allowBrowserRequests,
      lastStatus: nextStatus,
    }

    servers.value.splice(index, 1, patchedServer)

    if (selectedServer.value?.id === data.id) {
      selectedServer.value = patchedServer
    }

    if (serverForm.value.id === data.id) {
      serverForm.value = {
        ...serverForm.value,
        ...patchedServer,
      }
    }

    syncToLocalStorage()
  }

  function getCompatibleServers(
    capability: 'art' | 'text' | 'comfy',
  ): Server[] {
    if (capability === 'art') return artServers.value
    if (capability === 'text') return textServers.value
    return comfyServers.value
  }

  function cloneServerPayload(
    source: Server | null,
    updates: Partial<Server>,
  ): Partial<Server> {
    const base = source
      ? {
          title: source.title,
          label: source.label,
          description: source.description,
          category: source.category,
          serverType: source.serverType,
          baseUrl: source.baseUrl,
          endpointPath: source.endpointPath,
          healthPath: source.healthPath,
          isActive: source.isActive,
          requiresApiKey: source.requiresApiKey,
          apiKeyName: source.apiKeyName,
          supportsTxt2Img: source.supportsTxt2Img,
          supportsImg2Img: source.supportsImg2Img,
          supportsChat: source.supportsChat,
          supportsComfyWorkflow: source.supportsComfyWorkflow,
          supportsCheckpointOverride: source.supportsCheckpointOverride,
          supportsSampler: source.supportsSampler,
          supportsNegativePrompt: source.supportsNegativePrompt,
          supportsSeed: source.supportsSeed,
          supportsSteps: source.supportsSteps,
          designer: source.designer,
          version: source.version,
          notes: source.notes,
          sortOrder: source.sortOrder,
          accessMode: source.accessMode,
          requiresClientSideCheck: source.requiresClientSideCheck,
          isPrivateNetwork: source.isPrivateNetwork,
          allowBrowserRequests: source.allowBrowserRequests,
          useOidc: source.useOidc,
          lastStatus: 'UNKNOWN' as ServerStatus,
        }
      : {}

    return {
      ...base,
      ...updates,
      userId: userStore.user?.id,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: updates.isActive ?? base.isActive ?? true,
      lastStatus: 'UNKNOWN',
    }
  }

  async function saveServerAsUserCopy(
    sourceServerId: number | null,
    updates: Partial<Server>,
    mode: 'art' | 'text',
  ): Promise<{ success: boolean; data?: Server; message?: string }> {
    if (!userStore.isLoggedIn || !userStore.user?.id) {
      return {
        success: false,
        message: 'Please log in before saving a custom server.',
      }
    }

    const source =
      typeof sourceServerId === 'number' ? getServerById(sourceServerId) : null

    const payload = cloneServerPayload(source, updates)
    const result = await addServer(payload)

    if (!result.success || !result.data) {
      return result
    }

    if (mode === 'art') {
      await setActiveArtServer(result.data.id)
    } else {
      await setActiveTextServer(result.data.id)
    }

    return {
      success: true,
      data: result.data,
      message: 'Saved as your custom server.',
    }
  }

  function resetInitialization(): void {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchServerByIdPromises.value = {}
    healthPromises.value = {}
    hasLoaded.value = false
    lastError.value = null
  }

  function toServerForm(server: Server): ServerForm {
    return {
      ...server,
    }
  }

  function createDefaultServerForm(): ServerForm {
    return {
      title: '',
      label: '',
      description: '',
      category: '',
      serverType: 'TEXT',
      baseUrl: '',
      endpointPath: '',
      healthPath: '/health',
      userId: userStore.user?.id ?? null,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,

      accessMode: 'LOCAL',
      requiresClientSideCheck: false,
      isPrivateNetwork: false,
      allowBrowserRequests: true,

      requiresApiKey: false,
      apiKeyName: '',
      apiKey: '',

      useOidc: false,
      oidcProvider: '',

      supportsTxt2Img: false,
      supportsImg2Img: false,
      supportsChat: true,
      supportsComfyWorkflow: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsSteps: false,
      supportsVideo: false,

      apiLink: '',
      model: '',
      designer: userStore.user?.username ?? '',
      version: '',
      notes: '',
      sortOrder: 0,
      lastCheckedAt: null,
      lastStatus: null,
    }
  }

  function startAddingServer(overrides: ServerForm = {}): void {
    selectedServer.value = null

    serverForm.value = {
      ...createDefaultServerForm(),
      ...overrides,
    }

    syncToLocalStorage()
  }

  async function startEditingServer(id?: number): Promise<Server | null> {
    const serverId = id ?? selectedServer.value?.id

    if (!serverId) {
      serverForm.value = createDefaultServerForm()
      syncToLocalStorage()
      return null
    }

    const server = getServerById(serverId) ?? (await fetchServerById(serverId))

    if (!server) {
      setStoreError(
        ErrorType.STORE_ERROR,
        `Server ${serverId} was not found.`,
        'startEditingServer',
      )

      return null
    }

    selectedServer.value = server
    serverForm.value = toServerForm(server)

    syncToLocalStorage()

    return server
  }

  function startCloningServer(
    id: number,
    overrides: ServerForm = {},
  ): Server | null {
    const source = getServerById(id)

    if (!source) {
      setStoreError(
        ErrorType.STORE_ERROR,
        `Server ${id} was not found.`,
        'startCloningServer',
      )

      return null
    }

    selectedServer.value = source

    serverForm.value = {
      ...toServerForm(source),
      ...overrides,
      id: undefined,
      title: `${source.title} Custom`,
      label: source.label ? `${source.label} Custom` : `${source.title} Custom`,
      userId: userStore.user?.id ?? null,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    }

    syncToLocalStorage()

    return source
  }

  const selectedBlueprintServerId = ref<number | null>(null)

  const blueprintServers = computed(() => {
    return servers.value.filter((server) => {
      return (
        server.isDefault ||
        server.isOfficial ||
        server.isPublic ||
        server.userId === userStore.user?.id
      )
    })
  })

  function setBlueprintServer(id: number | null) {
    selectedBlueprintServerId.value = id

    if (!id) return

    const blueprint = getServerById(id)

    if (!blueprint) return

    serverForm.value = {
      ...blueprint,
      id: undefined,
      title: `${blueprint.title || blueprint.label || 'Server'} Custom`,
      label: blueprint.label || blueprint.title || 'Custom Server',
      userId: userStore.user?.id,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
      apiKey: undefined,
      apiKeyName: blueprint.apiKeyName || null,
    }
  }

  function deselectServer(): void {
    selectedServer.value = null
    serverForm.value = {}
    syncToLocalStorage()
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
    isInitializing,
    loading,
    testingHealth,
    showHiddenServers,
    lastError,

    initializePromise,
    fetchPromise,
    fetchServerByIdPromises,
    healthPromises,
    hasLoaded,

    ownedServers,
    publicServers,
    officialServers,
    activeServers,
    hiddenServers,
    visibleActiveServers,
    artServers,
    textServers,
    comfyServers,
    dropdownServers,
    activeArtServer,
    activeTextServer,
    artServerOptions,
    textServerOptions,

    selectedBlueprintServerId,
    blueprintServers,
    setBlueprintServer,

    syncToLocalStorage,
    loadFromLocalStorage,
    initialize,
    resetInitialization,
    fetchAllServers,
    fetchServerById,

    addServer,
    addServers,
    updateServer,
    updateServerApiKey,
    deleteServer,

    hideServer,
    unhideServer,
    isServerHidden,

    testServerHealth,
    testServerHealthFromBrowser,
    requestServer,

    selectServer,
    deselectServer,
    createNewServer,
    saveServer,

    validateArtServer,
    validateTextServer,
    setActiveArtServer,
    setActiveTextServer,
    clearActiveServers,

    getServerById,
    getServersByType,
    getCompatibleServers,

    cloneServerPayload,
    saveServerAsUserCopy,
    startAddingServer,
    startEditingServer,
    toServerForm,
    createDefaultServerForm,
    startCloningServer,
    isServerFormOpen,
    openServerForm,
    closeServerForm,
    toggleServerForm,
  }
})

export type { Server, ServerStatus, ServerType }
