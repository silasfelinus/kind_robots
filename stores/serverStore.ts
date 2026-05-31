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
import {
  getModelStatusEngine,
  type ServerRuntimeReport,
} from './helpers/serverHelper'

export interface ServerForm extends Partial<Server> {}

type CurrentServerMode = 'art' | 'text' | 'selected'

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

function parseHiddenServerIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }

  if (typeof value !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((id): id is number => Number.isInteger(id))
  } catch {
    return value
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id))
  }
}

function stringifyHiddenServerIds(ids: number[]): string {
  return JSON.stringify([...new Set(ids.filter((id) => Number.isInteger(id)))])
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
    typeof candidate.serverType === 'string'
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
  const currentServerMode = ref<CurrentServerMode>('selected')
  const serverForm: Ref<ServerForm> = ref({})
  const activeArtServerId: Ref<number | null> = ref(null)
  const activeTextServerId: Ref<number | null> = ref(null)
  const healthResults: Ref<Record<number, ServerHealthResponse>> = ref({})

  const runtimeReportsByServerId = ref<Record<number, ServerRuntimeReport>>({})
  const runtimeLoadingByServerId = ref<Record<number, boolean>>({})
  const runtimeErrorByServerId = ref<Record<number, string>>({})

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
    return parseHiddenServerIds(userStore.user?.hiddenServerIds)
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
      return server.serverType === 'A1111' || server.serverType === 'COMFY'
    }),
  )

  const textServers = computed<Server[]>(() =>
    visibleActiveServers.value.filter((server: Server): boolean => {
      return (
        server.serverType === 'OPENAI' ||
        server.serverType === 'ANTHROPIC' ||
        server.serverType === 'CUSTOM'
      )
    }),
  )

  const comfyServers = computed<Server[]>(() =>
    visibleActiveServers.value.filter((server: Server): boolean => {
      return server.serverType === 'COMFY'
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

  const currentServer = computed<Server | null>(() => {
    if (selectedServer.value) return selectedServer.value

    if (currentServerMode.value === 'art') {
      return activeArtServer.value
    }

    if (currentServerMode.value === 'text') {
      return activeTextServer.value
    }

    return activeArtServer.value || activeTextServer.value || null
  })

  const activeRuntimeReport = computed<ServerRuntimeReport | null>(() => {
    const serverId = currentServer.value?.id || 0
    return serverId ? runtimeReportsByServerId.value[serverId] || null : null
  })

  const activeRuntimeLoading = computed(() => {
    const serverId = currentServer.value?.id || 0
    return serverId ? Boolean(runtimeLoadingByServerId.value[serverId]) : false
  })

  const activeRuntimeError = computed(() => {
    const serverId = currentServer.value?.id || 0
    return serverId ? runtimeErrorByServerId.value[serverId] || '' : ''
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

  function getRuntimeReportForServer(server: Server | null | undefined) {
    if (!server?.id) return null
    return getRuntimeReport(server.id)
  }

  function isServerHidden(id: number): boolean {
    return hiddenServerIdSet.value.has(id)
  }

  function getRuntimeReport(serverId: number): ServerRuntimeReport | null {
    return runtimeReportsByServerId.value[serverId] || null
  }

  function setRuntimeReport(report: ServerRuntimeReport): void {
    runtimeReportsByServerId.value = {
      ...runtimeReportsByServerId.value,
      [report.serverId]: report,
    }
  }

  function clearRuntimeReport(serverId: number): void {
    const reports = { ...runtimeReportsByServerId.value }
    const loading = { ...runtimeLoadingByServerId.value }
    const errors = { ...runtimeErrorByServerId.value }

    delete reports[serverId]
    delete loading[serverId]
    delete errors[serverId]

    runtimeReportsByServerId.value = reports
    runtimeLoadingByServerId.value = loading
    runtimeErrorByServerId.value = errors
  }

  function clearAllRuntimeReports(): void {
    runtimeReportsByServerId.value = {}
    runtimeLoadingByServerId.value = {}
    runtimeErrorByServerId.value = {}
  }

  function setRuntimeLoading(serverId: number, loading: boolean): void {
    runtimeLoadingByServerId.value = {
      ...runtimeLoadingByServerId.value,
      [serverId]: loading,
    }
  }

  function setRuntimeError(serverId: number, message = ''): void {
    runtimeErrorByServerId.value = {
      ...runtimeErrorByServerId.value,
      [serverId]: message,
    }
  }

  function setRuntimeHealthReport(input: {
    server: Server | null
    serverId: number
    success: boolean
    message: string
    healthPath: string
    status: number
    statusText: string
    latencyMs: number
    responseBody: unknown
    raw?: unknown
  }): void {
    setRuntimeReport({
      serverId: input.serverId,
      engine: getModelStatusEngine(input.server),
      checkedAt: new Date().toISOString(),
      success: input.success,
      message: input.message,
      health: {
        ok: input.success,
        status: input.status,
        statusText: input.statusText,
        latencyMs: input.latencyMs,
        path: input.healthPath,
        data: input.responseBody,
      },
      raw: input.raw,
    })
  }

  async function requestServer(
    serverInput: Server,
    pathOverride?: string,
    options: RequestInit = {},
  ) {
    const server = getHydratedServer(serverInput)
    const baseUrl = String(server.baseUrl || '').replace(/\/+$/, '')

    if (!baseUrl) {
      throw new Error(
        `Server "${server.title || server.label || server.id}" is missing baseUrl.`,
      )
    }

    const rawPath = String(pathOverride || server.healthPath || '')
    const path = rawPath
      ? rawPath.startsWith('/')
        ? rawPath
        : `/${rawPath}`
      : ''

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
      authType?: 'NONE' | 'BEARER' | 'HEADER' | 'QUERY' | 'API_KEY'
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
        hiddenServerIds: stringifyHiddenServerIds(nextHiddenServerIds),
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
        hiddenServerIds: stringifyHiddenServerIds(nextHiddenServerIds),
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

    const serverBaseUrl = server?.baseUrl || ''

    const healthPath =
      server && serverBaseUrl && healthUrl.startsWith(serverBaseUrl)
        ? healthUrl.slice(serverBaseUrl.length) || server.healthPath || '/'
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
                authType: server.authType,
                apiKeyName: server.apiKeyName,
                isActive: server.isActive,
                isDefault: server.isDefault,
                isOfficial: server.isOfficial,
                isPublic: server.isPublic,
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
    setRuntimeHealthReport({
      server,
      serverId: id,
      success: report.ok,
      message: report.message,
      healthPath,
      status: report.status,
      statusText: report.statusText,
      latencyMs: report.latencyMs,
      responseBody: report.responseBody,
      raw: result,
    })

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
    setCurrentServer(id)
  }

  function setCurrentServerMode(mode: CurrentServerMode): void {
    currentServerMode.value = mode
  }

  function setCurrentServer(id: number | null): void {
    if (id === null) {
      selectedServer.value = null
      serverForm.value = {}
      syncToLocalStorage()
      return
    }

    const server = getServerById(id)

    if (!server) {
      setStoreError(
        ErrorType.VALIDATION_ERROR,
        'Server not found.',
        'setCurrentServer',
      )
      return
    }

    selectedServer.value = server
    serverForm.value = { ...server }
    syncToLocalStorage()
  }

  function createNewServer(serverType: ServerType = 'CUSTOM'): void {
    const isComfy = serverType === 'COMFY'
    const isA1111 = serverType === 'A1111'
    const isText =
      serverType === 'OPENAI' ||
      serverType === 'ANTHROPIC' ||
      serverType === 'CUSTOM'

    serverForm.value = {
      title: '',
      label: '',
      description: '',
      category: isText ? 'text' : 'image',
      serverType,

      baseUrl: '',
      endpointPath: isComfy
        ? '/prompt'
        : isA1111
          ? '/sdapi/v1/txt2img'
          : '/v1/chat/completions',
      healthPath: isComfy
        ? '/system_stats'
        : isA1111
          ? '/sdapi/v1/progress'
          : '/health',

      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
      isMature: false,

      accessMode: isComfy || isA1111 ? 'TAILSCALE' : 'BACKEND',
      authType: 'NONE',
      apiKeyName: '',
      apiKey: '',

      apiLink: '',
      model: '',
      designer: userStore.user?.designerName || userStore.user?.username || '',
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
      const message = 'No server form loaded.'
      setStoreError(ErrorType.VALIDATION_ERROR, message, 'saveServer')
      return { success: false, message }
    }

    const payload: Partial<Server> = {
      title: serverForm.value.title,
      label: serverForm.value.label,
      description: serverForm.value.description,
      category: serverForm.value.category,
      serverType: serverForm.value.serverType,

      baseUrl: serverForm.value.baseUrl,
      endpointPath: serverForm.value.endpointPath,
      healthPath: serverForm.value.healthPath,
      apiLink: serverForm.value.apiLink,

      accessMode: serverForm.value.accessMode,
      authType: serverForm.value.authType,
      apiKeyName: serverForm.value.apiKeyName,

      isPublic: serverForm.value.isPublic,
      isOfficial: serverForm.value.isOfficial,
      isDefault: serverForm.value.isDefault,
      isActive: serverForm.value.isActive,
      isEditable: serverForm.value.isEditable,
      isMature: serverForm.value.isMature,

      model: serverForm.value.model,
      designer: serverForm.value.designer,
      version: serverForm.value.version,
      notes: serverForm.value.notes,
      sortOrder: serverForm.value.sortOrder,
      lastCheckedAt: serverForm.value.lastCheckedAt,
      lastStatus: serverForm.value.lastStatus,
      artPrompt: serverForm.value.artPrompt,
    }

    isSaving.value = true

    try {
      if (typeof serverForm.value.id === 'number') {
        return await updateServer(serverForm.value.id, payload)
      }

      return await addServer(payload)
    } catch (error) {
      handleError(error, 'saving server')
      const message =
        error instanceof Error ? error.message : 'Failed to save server.'
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
      ['OPENAI', 'ANTHROPIC', 'CUSTOM'].includes(server.serverType)

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
      (server.serverType === 'A1111' || server.serverType === 'COMFY')

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
      accessMode: storedServer?.accessMode ?? serverInput.accessMode,
      authType: storedServer?.authType ?? serverInput.authType,
      baseUrl: storedServer?.baseUrl ?? serverInput.baseUrl,
      healthPath: storedServer?.healthPath ?? serverInput.healthPath,
      endpointPath: storedServer?.endpointPath ?? serverInput.endpointPath,
      serverType: storedServer?.serverType ?? serverInput.serverType,
      apiKeyName: storedServer?.apiKeyName ?? serverInput.apiKeyName,
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
          accessMode: source.accessMode,
          authType: source.authType,
          baseUrl: source.baseUrl,
          endpointPath: source.endpointPath,
          healthPath: source.healthPath,
          apiLink: source.apiLink,
          apiKeyName: source.apiKeyName,
          model: source.model,
          designer: source.designer,
          version: source.version,
          notes: source.notes,
          sortOrder: source.sortOrder,
          isActive: source.isActive,
          isEditable: source.isEditable,
          isMature: source.isMature,
          lastStatus: 'UNKNOWN' as ServerStatus,
          artPrompt: source.artPrompt,
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
      serverType: 'CUSTOM',
      baseUrl: '',
      endpointPath: '',
      healthPath: '/health',
      userId: userStore.user?.id ?? null,

      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
      isMature: false,

      accessMode: 'BROWSER',
      authType: 'NONE',
      apiKeyName: '',
      apiKey: '',

      apiLink: '',
      model: '',
      designer: userStore.user?.username ?? '',
      version: '',
      notes: '',
      sortOrder: 0,
      lastCheckedAt: null,
      lastStatus: 'UNKNOWN',
      artPrompt: '',
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
    setCurrentServer(null)
  }

  async function readRuntimeJsonResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return await response.json().catch(() => null)
    }

    return await response.text().catch(() => null)
  }

  function stringifyRuntimeError(value: unknown): string {
    if (!value) return ''

    if (typeof value === 'string') return value

    if (typeof value === 'object') {
      const data = value as Record<string, unknown>

      const error = data.error
      const message = data.message
      const detail = data.detail
      const statusMessage = data.statusMessage
      const statusText = data.statusText

      if (typeof error === 'string') return error
      if (typeof message === 'string') return message
      if (typeof detail === 'string') return detail
      if (typeof statusMessage === 'string') return statusMessage
      if (typeof statusText === 'string') return statusText

      return JSON.stringify(data)
    }

    return String(value)
  }

  async function requestRuntimeJson(
    server: Server,
    path: string,
    options: RequestInit = {},
  ): Promise<unknown> {
    const response = await requestServer(server, path, options)
    const data = await readRuntimeJsonResponse(response)

    if (!response.ok) {
      const message = stringifyRuntimeError(data)

      throw new Error(
        `Runtime request failed: ${response.status} ${response.statusText}${
          message ? ` - ${message}` : ''
        }`,
      )
    }

    return data
  }

  function patchRuntimeReport(
    server: Server,
    patch: Partial<ServerRuntimeReport>,
  ): ServerRuntimeReport {
    const existing = runtimeReportsByServerId.value[server.id]

    const report: ServerRuntimeReport = {
      serverId: server.id,
      engine: getModelStatusEngine(server),
      checkedAt: new Date().toISOString(),
      success: patch.success ?? existing?.success ?? true,
      message:
        patch.message || existing?.message || 'Server runtime report updated.',
      health: patch.health ?? existing?.health,
      a1111: {
        ...(existing?.a1111 || {}),
        ...(patch.a1111 || {}),
      },
      comfy: {
        ...(existing?.comfy || {}),
        ...(patch.comfy || {}),
      },
      raw: patch.raw ?? existing?.raw,
    }

    setRuntimeReport(report)
    return report
  }

  async function runRuntimeAction<T>(
    server: Server,
    label: string,
    action: () => Promise<T>,
  ): Promise<T> {
    setRuntimeLoading(server.id, true)
    setRuntimeError(server.id, '')

    try {
      const result = await action()

      patchRuntimeReport(server, {
        success: true,
        message: `${label} succeeded.`,
      })

      return result
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${label} failed.`

      setRuntimeError(server.id, message)

      patchRuntimeReport(server, {
        success: false,
        message,
      })

      setStoreError(ErrorType.NETWORK_ERROR, message, label)

      throw error
    } finally {
      setRuntimeLoading(server.id, false)
    }
  }

  async function fetchA1111Options(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchA1111Options', async () => {
      const data = await requestRuntimeJson(server, '/sdapi/v1/options', {
        method: 'GET',
      })

      const options =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>)
          : {}

      const currentModel =
        typeof options.sd_model_checkpoint === 'string'
          ? options.sd_model_checkpoint
          : ''

      const currentModelHash =
        typeof options.sd_checkpoint_hash === 'string'
          ? options.sd_checkpoint_hash
          : ''

      patchRuntimeReport(server, {
        success: true,
        message: currentModel
          ? `A1111 current model: ${currentModel}`
          : 'A1111 options fetched.',
        a1111: {
          options,
          currentModel,
          currentModelHash,
        },
        raw: data,
      })

      return data
    })
  }

  async function fetchA1111Models(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchA1111Models', async () => {
      const data = await requestRuntimeJson(server, '/sdapi/v1/sd-models', {
        method: 'GET',
      })

      const models = Array.isArray(data) ? data : []

      patchRuntimeReport(server, {
        success: true,
        message: `Fetched ${models.length} A1111 model${
          models.length === 1 ? '' : 's'
        }.`,
        a1111: {
          models,
        },
        raw: data,
      })

      return data
    })
  }

  async function fetchA1111Samplers(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchA1111Samplers', async () => {
      const data = await requestRuntimeJson(server, '/sdapi/v1/samplers', {
        method: 'GET',
      })

      const samplers = Array.isArray(data) ? data : []

      patchRuntimeReport(server, {
        success: true,
        message: `Fetched ${samplers.length} A1111 sampler${
          samplers.length === 1 ? '' : 's'
        }.`,
        a1111: {
          samplers,
        },
        raw: data,
      })

      return data
    })
  }

  async function setA1111Model(
    server: Server,
    checkpoint: string,
  ): Promise<unknown> {
    return await runRuntimeAction(server, 'setA1111Model', async () => {
      const cleanCheckpoint = checkpoint.trim()

      if (!cleanCheckpoint) {
        throw new Error('Cannot set A1111 model without a checkpoint name.')
      }

      const data = await requestRuntimeJson(server, '/sdapi/v1/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sd_model_checkpoint: cleanCheckpoint,
        }),
      })

      patchRuntimeReport(server, {
        success: true,
        message: `Requested A1111 model change: ${cleanCheckpoint}`,
        a1111: {
          requestedModel: cleanCheckpoint,
          setModelResponse: data,
        },
        raw: data,
      })

      await fetchA1111Options(server)

      return data
    })
  }

  async function fetchComfySystemStats(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchComfySystemStats', async () => {
      const data = await requestRuntimeJson(server, '/system_stats', {
        method: 'GET',
      })

      patchRuntimeReport(server, {
        success: true,
        message: 'Fetched Comfy system stats.',
        comfy: {
          systemStats: data,
        },
        raw: data,
      })

      return data
    })
  }

  async function fetchComfyObjectInfo(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchComfyObjectInfo', async () => {
      const data = await requestRuntimeJson(server, '/object_info', {
        method: 'GET',
      })

      patchRuntimeReport(server, {
        success: true,
        message: 'Fetched Comfy object info.',
        comfy: {
          objectInfo: data,
        },
        raw: data,
      })

      return data
    })
  }
  async function fetchA1111Loras(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchA1111Loras', async () => {
      const data = await requestRuntimeJson(server, '/sdapi/v1/loras', {
        method: 'GET',
      })

      const loras = Array.isArray(data) ? data : []

      patchRuntimeReport(server, {
        success: true,
        message: `Fetched ${loras.length} A1111 LoRA${
          loras.length === 1 ? '' : 's'
        }.`,
        a1111: {
          loras,
        },
        raw: data,
      })

      return data
    })
  }

  async function fetchA1111Embeddings(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchA1111Embeddings', async () => {
      const data = await requestRuntimeJson(server, '/sdapi/v1/embeddings', {
        method: 'GET',
      })

      const loaded =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>).loaded
          : null

      const count =
        loaded && typeof loaded === 'object'
          ? Object.keys(loaded as Record<string, unknown>).length
          : 0

      patchRuntimeReport(server, {
        success: true,
        message: `Fetched ${count} A1111 embedding${count === 1 ? '' : 's'}.`,
        a1111: {
          embeddings: data,
        },
        raw: data,
      })

      return data
    })
  }

  async function fetchComfyHistory(server: Server): Promise<unknown> {
    return await runRuntimeAction(server, 'fetchComfyHistory', async () => {
      const data = await requestRuntimeJson(server, '/history', {
        method: 'GET',
      })

      patchRuntimeReport(server, {
        success: true,
        message: 'Fetched Comfy history.',
        comfy: {
          history: data,
        },
        raw: data,
      })

      return data
    })
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
    fetchA1111Loras,
    fetchA1111Embeddings,

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
    getRuntimeReport,
    setRuntimeReport,
    clearRuntimeReport,
    clearAllRuntimeReports,
    setRuntimeLoading,
    setRuntimeError,

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

    runtimeReportsByServerId,
    runtimeLoadingByServerId,
    runtimeErrorByServerId,
    activeRuntimeReport,
    activeRuntimeLoading,
    activeRuntimeError,
    getRuntimeReportForServer,

    setRuntimeHealthReport,
    patchRuntimeReport,

    fetchA1111Options,
    fetchA1111Models,
    fetchA1111Samplers,
    setA1111Model,
    fetchComfySystemStats,
    fetchComfyObjectInfo,
    fetchComfyHistory,

    currentServerMode,
    currentServer,
    setCurrentServerMode,
    setCurrentServer,
  }
})

export type { Server, ServerStatus, ServerType }
