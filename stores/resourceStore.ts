// /stores/resourceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch, handleError } from './utils'
import { resourceData } from './../stores/seeds/seedResources'
import type { Resource, Server } from '~/prisma/generated/prisma/client'
import type { ServerRuntimeReport } from '@/stores/helpers/serverHelper'

export const useResourceStore = defineStore('resourceStore', () => {
  const resources = ref<Resource[]>([])
  const currentResource = ref<Resource | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const hasLoaded = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Resource[]> | null>(null)
  const seedPromise = ref<Promise<void> | null>(null)

  async function loadStore(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      isLoading.value = true

      try {
        await getResources()

        if (resources.value.length === 0) {
          await seedResources()
        }

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing resource store')
      } finally {
        isLoading.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function getResources(force = false): Promise<Resource[]> {
    if (!force && hasLoaded.value) return resources.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      const res = await performFetch<Resource[]>('/api/resources')

      if (!res.success) {
        throw new Error(res.message || 'Failed to fetch resources')
      }

      resources.value = res.data || []
      hasLoaded.value = true
      return resources.value
    })()

    try {
      return await fetchPromise.value
    } catch (error) {
      handleError(error, 'fetching resources')
      return []
    } finally {
      fetchPromise.value = null
    }
  }

  async function seedResources(): Promise<void> {
    if (seedPromise.value) return seedPromise.value

    seedPromise.value = (async () => {
      if (resources.value.length > 0) return

      await addResources(resourceData)

      if (resources.value.length === 0) {
        await getResources(true)
      }
    })()

    try {
      await seedPromise.value
    } catch (error) {
      handleError(error, 'seeding resources')
    } finally {
      seedPromise.value = null
    }
  }

  type RuntimeResourceKind =
    | 'checkpoint'
    | 'sampler'
    | 'lora'
    | 'embedding'
    | 'vae'
    | 'unet'
    | 'unknown'

  type RuntimeResourcePayload = Partial<Resource> & {
    resourceKind?: RuntimeResourceKind
    serverId?: number
    serverTitle?: string
    runtimeSource?: string
    runtimeKey?: string
    Servers?: number[]
  }

  interface RuntimeResourceImportResult {
    success: boolean
    created: Resource[]
    skipped: number
    candidates: RuntimeResourcePayload[]
    message: string
  }

  function safeText(value: unknown): string {
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim()
    }

    return ''
  }

  function serverResourceLabel(server: Server): string {
    return (
      safeText(server.label) || safeText(server.title) || `Server ${server.id}`
    )
  }

  function getRuntimeResourceKey(input: {
    server: Server
    kind: RuntimeResourceKind
    name: string
  }): string {
    return [input.server.id, input.kind, input.name.trim().toLowerCase()].join(
      '::',
    )
  }

  function resourceExistsForServer(input: {
    server: Server
    kind: RuntimeResourceKind
    name: string
  }): boolean {
    const key = getRuntimeResourceKey(input)

    return resources.value.some((resource) => {
      const record = resource as Resource & Record<string, unknown>

      const runtimeKey = safeText(record.runtimeKey)
      if (runtimeKey && runtimeKey === key) return true

      const sameName =
        safeText(resource.name).toLowerCase() ===
        input.name.trim().toLowerCase()
      const sameGeneration =
        safeText(resource.generation).toLowerCase() === input.kind
      const sameSupportedServer =
        safeText(resource.supportedServer) ===
          serverResourceLabel(input.server) ||
        safeText(resource.supportedServer) === String(input.server.id)

      return Boolean(sameName && sameGeneration && sameSupportedServer)
    })
  }

  function makeRuntimeResource(input: {
    server: Server
    userId: number | null
    kind: RuntimeResourceKind
    name: string
    customLabel?: string
    description?: string
    localPath?: string
    raw?: unknown
  }): RuntimeResourcePayload | null {
    const name = safeText(input.name)

    if (!name) return null

    if (
      resourceExistsForServer({
        server: input.server,
        kind: input.kind,
        name,
      })
    ) {
      return null
    }

    const serverLabel = serverResourceLabel(input.server)
    const runtimeKey = getRuntimeResourceKey({
      server: input.server,
      kind: input.kind,
      name,
    })

    return {
      name,
      customLabel: safeText(input.customLabel) || name,
      description:
        safeText(input.description) ||
        `${input.kind} discovered from ${serverLabel}.`,
      localPath: safeText(input.localPath) || null,
      generation: input.kind,
      supportedServer: serverLabel,
      userId: input.userId,
      isPublic: false,
      isMature: false,
      resourceKind: input.kind,
      serverId: input.server.id,
      serverTitle: serverLabel,
      runtimeSource: 'server-runtime',
      runtimeKey,
      Servers: [input.server.id],
      notes: input.raw ? JSON.stringify(input.raw).slice(0, 2000) : undefined,
    } as RuntimeResourcePayload
  }

  function getA1111ModelResources(input: {
    server: Server
    report: ServerRuntimeReport
    userId: number | null
  }): RuntimeResourcePayload[] {
    const models = input.report.a1111?.models

    if (!Array.isArray(models)) return []

    return models
      .map((model) => {
        if (!model || typeof model !== 'object') return null

        const record = model as Record<string, unknown>
        const title = safeText(record.title)
        const modelName =
          safeText(record.model_name) || safeText(record.modelName) || title
        const filename = safeText(record.filename)

        return makeRuntimeResource({
          server: input.server,
          userId: input.userId,
          kind: 'checkpoint',
          name: modelName || title,
          customLabel: title || modelName,
          localPath: filename,
          description: `A1111 checkpoint discovered from ${serverResourceLabel(
            input.server,
          )}.`,
          raw: record,
        })
      })
      .filter((resource): resource is RuntimeResourcePayload =>
        Boolean(resource),
      )
  }

  function getA1111SamplerResources(input: {
    server: Server
    report: ServerRuntimeReport
    userId: number | null
  }): RuntimeResourcePayload[] {
    const samplers = input.report.a1111?.samplers

    if (!Array.isArray(samplers)) return []

    return samplers
      .map((sampler) => {
        if (!sampler || typeof sampler !== 'object') return null

        const record = sampler as Record<string, unknown>
        const name = safeText(record.name)

        return makeRuntimeResource({
          server: input.server,
          userId: input.userId,
          kind: 'sampler',
          name,
          customLabel: name,
          description: `A1111 sampler discovered from ${serverResourceLabel(
            input.server,
          )}.`,
          raw: record,
        })
      })
      .filter((resource): resource is RuntimeResourcePayload =>
        Boolean(resource),
      )
  }

  function getA1111LoraResources(input: {
    server: Server
    report: ServerRuntimeReport
    userId: number | null
  }): RuntimeResourcePayload[] {
    const loras = input.report.a1111?.loras

    if (!Array.isArray(loras)) return []

    return loras
      .map((lora) => {
        if (!lora || typeof lora !== 'object') return null

        const record = lora as Record<string, unknown>
        const name =
          safeText(record.name) ||
          safeText(record.alias) ||
          safeText(record.path)
        const path = safeText(record.path)

        return makeRuntimeResource({
          server: input.server,
          userId: input.userId,
          kind: 'lora',
          name,
          customLabel: safeText(record.alias) || name,
          localPath: path,
          description: `A1111 LoRA discovered from ${serverResourceLabel(
            input.server,
          )}.`,
          raw: record,
        })
      })
      .filter((resource): resource is RuntimeResourcePayload =>
        Boolean(resource),
      )
  }

  function getA1111EmbeddingResources(input: {
    server: Server
    report: ServerRuntimeReport
    userId: number | null
  }): RuntimeResourcePayload[] {
    const embeddings = input.report.a1111?.embeddings

    if (!embeddings || typeof embeddings !== 'object') return []

    const record = embeddings as Record<string, unknown>
    const loaded = record.loaded

    if (!loaded || typeof loaded !== 'object') return []

    return Object.entries(loaded as Record<string, unknown>)
      .map(([name, embedding]) => {
        const embeddingRecord =
          embedding && typeof embedding === 'object'
            ? (embedding as Record<string, unknown>)
            : {}

        return makeRuntimeResource({
          server: input.server,
          userId: input.userId,
          kind: 'embedding',
          name,
          customLabel: name,
          localPath: safeText(embeddingRecord.filename),
          description: `A1111 embedding discovered from ${serverResourceLabel(
            input.server,
          )}.`,
          raw: embeddingRecord,
        })
      })
      .filter((resource): resource is RuntimeResourcePayload =>
        Boolean(resource),
      )
  }

  function getComfyObjectInfoResources(input: {
    server: Server
    report: ServerRuntimeReport
    userId: number | null
  }): RuntimeResourcePayload[] {
    const objectInfo = input.report.comfy?.objectInfo

    if (!objectInfo || typeof objectInfo !== 'object') return []

    const info = objectInfo as Record<string, unknown>
    const resourcesToCreate: RuntimeResourcePayload[] = []

    const loaderMap: Array<{
      nodeName: string
      inputName: string
      kind: RuntimeResourceKind
    }> = [
      {
        nodeName: 'CheckpointLoaderSimple',
        inputName: 'ckpt_name',
        kind: 'checkpoint',
      },
      {
        nodeName: 'CheckpointLoader',
        inputName: 'ckpt_name',
        kind: 'checkpoint',
      },
      {
        nodeName: 'LoraLoader',
        inputName: 'lora_name',
        kind: 'lora',
      },
      {
        nodeName: 'VAELoader',
        inputName: 'vae_name',
        kind: 'vae',
      },
      {
        nodeName: 'UNETLoader',
        inputName: 'unet_name',
        kind: 'unet',
      },
    ]

    for (const loader of loaderMap) {
      const node = info[loader.nodeName]

      if (!node || typeof node !== 'object') continue

      const nodeRecord = node as Record<string, unknown>
      const nodeInput = nodeRecord.input

      if (!nodeInput || typeof nodeInput !== 'object') continue

      const inputRecord = nodeInput as Record<string, unknown>
      const required = inputRecord.required

      if (!required || typeof required !== 'object') continue

      const requiredRecord = required as Record<string, unknown>
      const definition = requiredRecord[loader.inputName]

      if (!Array.isArray(definition)) continue

      const values = Array.isArray(definition[0]) ? definition[0] : []

      for (const value of values) {
        const name = safeText(value)

        const resource = makeRuntimeResource({
          server: input.server,
          userId: input.userId,
          kind: loader.kind,
          name,
          customLabel: name,
          description: `Comfy ${loader.kind} discovered from ${serverResourceLabel(
            input.server,
          )}.`,
          raw: {
            nodeName: loader.nodeName,
            inputName: loader.inputName,
            value,
          },
        })

        if (resource) resourcesToCreate.push(resource)
      }
    }

    return resourcesToCreate
  }

  function buildResourcesFromServerRuntime(input: {
    server: Server
    report: ServerRuntimeReport | null
    userId: number | null
  }): RuntimeResourcePayload[] {
    const report = input.report

    if (!report) return []

    const runtimeInput = {
      server: input.server,
      report,
      userId: input.userId,
    }

    return [
      ...getA1111ModelResources(runtimeInput),
      ...getA1111SamplerResources(runtimeInput),
      ...getA1111LoraResources(runtimeInput),
      ...getA1111EmbeddingResources(runtimeInput),
      ...getComfyObjectInfoResources(runtimeInput),
    ]
  }
  async function createResourcesForServerRuntime(input: {
    server: Server
    report: ServerRuntimeReport | null
    userId: number | null
  }): Promise<RuntimeResourceImportResult> {
    const candidates = buildResourcesFromServerRuntime(input)

    if (candidates.length === 0) {
      return {
        success: true,
        created: [],
        skipped: 0,
        candidates: [],
        message:
          'No new runtime resources found. Refresh server runtime first, then try again.',
      }
    }

    const created = await addResources(candidates as Partial<Resource>[])

    await getResources(true)

    return {
      success: created.length > 0,
      created,
      skipped: candidates.length - created.length,
      candidates,
      message: `Created ${created.length} resource${
        created.length === 1 ? '' : 's'
      } for ${serverResourceLabel(input.server)}.`,
    }
  }

  async function getResourceById(id: number): Promise<Resource | null> {
    try {
      const existing = resources.value.find((resource) => resource.id === id)

      if (existing) {
        currentResource.value = existing
        return existing
      }

      const res = await performFetch<Resource>(`/api/resources/${id}`)

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch resource by ID')
      }

      currentResource.value = res.data

      const index = resources.value.findIndex((resource) => resource.id === id)
      if (index === -1) {
        resources.value.push(res.data)
      } else {
        resources.value[index] = res.data
      }

      return res.data
    } catch (error) {
      handleError(error, `fetching resource by ID: ${id}`)
      return null
    }
  }

  async function addResources(data: Partial<Resource>[]): Promise<Resource[]> {
    try {
      const res = await performFetch<Resource[]>('/api/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to add resources')
      }

      const created = res.data
      const createdIds = new Set(created.map((resource) => resource.id))

      resources.value = [
        ...resources.value.filter((resource) => !createdIds.has(resource.id)),
        ...created,
      ]

      hasLoaded.value = true
      return created
    } catch (error) {
      handleError(error, 'adding resources')
      return []
    }
  }

  async function updateResource(
    id: number,
    data: Partial<Resource>,
  ): Promise<Resource | null> {
    try {
      const res = await performFetch<Resource>(`/api/resources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update resource')
      }

      currentResource.value = res.data

      const index = resources.value.findIndex((resource) => resource.id === id)
      if (index !== -1) {
        resources.value[index] = res.data
      } else {
        resources.value.push(res.data)
      }

      return res.data
    } catch (error) {
      handleError(error, `updating resource ID: ${id}`)
      return null
    }
  }

  async function deleteResource(id: number): Promise<boolean> {
    try {
      const res = await performFetch(`/api/resources/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete resource')
      }

      resources.value = resources.value.filter((resource) => resource.id !== id)

      if (currentResource.value?.id === id) {
        currentResource.value = null
      }

      return true
    } catch (error) {
      handleError(error, `deleting resource ID: ${id}`)
      return false
    }
  }

  function clearCurrentResource(): void {
    currentResource.value = null
  }

  return {
    resources,
    currentResource,
    isInitialized,
    isLoading,
    hasLoaded,
    initializePromise,
    fetchPromise,
    seedPromise,
    loadStore,
    getResources,
    seedResources,
    getResourceById,
    addResources,
    updateResource,
    deleteResource,
    clearCurrentResource,
    buildResourcesFromServerRuntime,
    createResourcesForServerRuntime,
  }
})

export type { Resource }
